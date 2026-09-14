// CRUD_Project/app/client/src/pages/Tasks/TasksPage.tsx

import React, { useState, useCallback, useEffect } from "react";
import "./TasksPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";

import type { Task as ApiTaskFromTypes } from "../../types/task";
import type { Task, ActiveTab, ApiUser } from "./types";
import { tasksAPI, usersAPI } from "../../services/api";
import { mapApiTask } from "./helpers";
import { InnerTabs } from "./MicroComponents";

import AllTasksPanel from "./AllTasksPanel";
import KanbanPanel from "./KanbanPanel";
import ByStaffPanel from "./ByStaffPanel";
import CalendarPanel from "./CalendarPanel";
import NewTaskPanel from "./NewTaskPanel";
import TaskOverlay from "./TaskOverlay";

const MAIN_TABS: { id: ActiveTab; label: string }[] = [
  { id: "all", label: "All Tasks" },
  { id: "kanban", label: "Board View" },
  { id: "bystaff", label: "By Staff" },
  { id: "calendar", label: "Calendar" },
  { id: "add", label: "+ New Task" },
];

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  // ── Load tasks + stats + users ─────────────────────────
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, statsRes, usersRes] = await Promise.allSettled([
        tasksAPI.getAll({ limit: 100 }),
        tasksAPI.getStats(),
        usersAPI.getAll({ limit: 100 }),
      ]);

      if (tasksRes.status === "fulfilled") {
        // Response shape: { data: { data: { tasks: [...] } } }
        const raw: ApiTaskFromTypes[] = tasksRes.value.data.data?.tasks || [];
        setTasks(raw.map(mapApiTask));
      }

      if (statsRes.status === "fulfilled") {
        // Stats response uses `result` key (not `data`):
        // { success, result: { total, pending, inProgress, completed, cancelled, overdue, highPriority } }
        setStats(statsRes.value.data.result || statsRes.value.data.data);
      }

      if (usersRes.status === "fulfilled") {
        const rawUsers: ApiUser[] =
          usersRes.value.data?.data?.users || usersRes.value.data?.users || [];
        console.log("FIRST USER:", rawUsers[0]); // dekho _id hai ya nahi
        setUsers(rawUsers);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Open / close overlay ───────────────────────────────
  const openTask = useCallback(
    (id: string) => {
      setSelectedTask(tasks.find((x) => x.id === id) ?? null);
    },
    [tasks],
  );

  const closeTask = useCallback(() => setSelectedTask(null), []);

  // ── Mark Done ──────────────────────────────────────────
  // Sends: PATCH /api/tasks/:id/status  { status: 'Completed' }
  // Valid from: Pending | InProgress
  const markDone = useCallback(async (id: string) => {
    try {
      await tasksAPI.updateStatus(id, { status: "Completed" });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "Done" as const, progress: 100 } : t,
        ),
      );
      setSelectedTask(null);
    } catch {
      // silent — task stays as-is if API fails
    }
  }, []);

  // ── Filter handler (for AllTasksPanel) ────────────────
  const handleFilter = useCallback(
    async (params: {
      status?: string;
      priority?: string;
      assignee?: string;
    }) => {
      try {
        const res = await tasksAPI.getAll({ limit: 100, ...params });
        const raw: ApiTaskFromTypes[] = res.data.data?.tasks || [];
        setTasks(raw.map(mapApiTask));
      } catch {
        // keep existing list on error
      }
    },
    [],
  );

  // ── Derived stats ──────────────────────────────────────
  // Prefer API stats; fall back to local counts
  const totalCnt = stats?.total ?? tasks.length;
  const doneCnt =
    stats?.completed ?? tasks.filter((t) => t.status === "Done").length;
  const inProgCnt =
    stats?.inProgress ?? tasks.filter((t) => t.status === "In Progress").length;
  const overdueCnt =
    stats?.overdue ?? tasks.filter((t) => t.status === "Overdue").length;

  const renderPanel = () => {
    switch (activeTab) {
      case "all":
        return (
          <AllTasksPanel
            tasks={tasks}
            users={users}
            loading={loading}
            totalItems={totalCnt}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
            onOpenTask={openTask}
            onMarkDone={markDone}
            onNewTask={() => setActiveTab("add")}
            onFilter={handleFilter}
          />
        );
      case "kanban":
        return (
          <KanbanPanel tasks={tasks} loading={loading} onOpenTask={openTask} />
        );
      case "bystaff":
        return (
          <ByStaffPanel tasks={tasks} loading={loading} onOpenTask={openTask} />
        );
      case "calendar":
        return (
          <CalendarPanel
            tasks={tasks}
            loading={loading}
            onOpenTask={openTask}
          />
        );
      case "add":
        return (
          <NewTaskPanel
            tasks={tasks}
            users={users}
            onCancel={() => setActiveTab("all")}
            onCreated={loadTasks}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="page-tasks">
      <TopLoadingBar
        progress={loadingProgress}
        isLoading={isLoading || loading}
      />

      <div className="page-hero">
        <div className="page-hero-title">Task Management</div>
        <div className="page-hero-sub">
          Create, assign, and track daily tasks across staff members. Monitor
          completion rates and operational efficiency.
        </div>
      </div>

      {error && (
        <div className="alert-strip danger" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-exclamation" />
          <div>{error}</div>
          <button
            className="t-btn danger"
            style={{ marginLeft: "auto" }}
            onClick={loadTasks}
          >
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      )}

      {!loading && overdueCnt > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-triangle-exclamation" />
          <div>
            <strong>{overdueCnt} tasks overdue</strong> — assigned to staff with
            no update.
          </div>
          <button
            className="t-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => setActiveTab("all")}
          >
            <i className="fa-solid fa-eye" /> View Overdue
          </button>
        </div>
      )}

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total Tasks</div>
          <div className="ms-value">{loading ? "…" : totalCnt}</div>
          <div className="ms-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> This period
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Completed</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {loading ? "…" : doneCnt}
          </div>
          <div className="ms-trend up">
            <i className="fa-solid fa-circle-check" />{" "}
            {totalCnt > 0 ? Math.round((doneCnt / totalCnt) * 100) : 0}%
            completion rate
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">In Progress</div>
          <div className="ms-value" style={{ color: "var(--blue)" }}>
            {loading ? "…" : inProgCnt}
          </div>
          <div className="ms-trend">
            <i className="fa-solid fa-spinner" /> Active
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Overdue</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            {loading ? "…" : overdueCnt}
          </div>
          <div className="ms-trend down">
            <i className="fa-solid fa-circle-exclamation" /> Needs attention
          </div>
        </div>
      </div>

      <InnerTabs
        tabs={MAIN_TABS}
        active={activeTab}
        onChange={(id) => switchTab(id as ActiveTab)}
      />

      {loading && tasks.length === 0 ? (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 11,
          }}
        >
          <i className="fa-solid fa-spinner" style={{ marginRight: 6 }} />
          Loading tasks…
        </div>
      ) : (
        renderPanel()
      )}

      <TaskOverlay
        task={selectedTask}
        onClose={closeTask}
        onMarkDone={markDone}
        onDeleted={loadTasks}
      />
    </div>
  );
};

export default TasksPage;
