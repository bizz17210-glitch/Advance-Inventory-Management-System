import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  return (
    <div
      className="app-wrapper"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <div
        className="main-wrapper"
        style={{
          marginLeft: "220px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />
        <main
          className="content"
          id="main-content"
          style={{ padding: "18px 20px", flex: 1 }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
