import { Outlet } from "react-router-dom";
import ResizeHandles from "./ResizeHandles";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="app">
      <ResizeHandles />
      <div className="suite-layout">
        <Sidebar />
        <div className="suite-main">
          <Topbar />
          <div className="suite-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
