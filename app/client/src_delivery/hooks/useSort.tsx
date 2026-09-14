import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export function useSort<T>() {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: null,
  });

  const requestSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction or reset
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: null, direction: null };
        }
        return { key, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const getSortIcon = useCallback(
    (key: keyof T) => {
      if (sortConfig.key !== key) {
        return <i className="fa-solid fa-sort"></i>;
      }
      if (sortConfig.direction === "asc") {
        return <i className="fa-solid fa-sort-up"></i>;
      }
      if (sortConfig.direction === "desc") {
        return <i className="fa-solid fa-sort-down"></i>;
      }
      return <i className="fa-solid fa-sort"></i>;
    },
    [sortConfig],
  );

  return { sortConfig, requestSort, getSortIcon };
}
