import { Outlet, NavLink } from "react-router-dom";
import {
  Home,
  ListOrdered,
  PlusCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import BrandHeader from "./BrandHeader";
import "./Layout.css";

const Layout = () => {
  return (
    <div className="layout-container">
      <BrandHeader />

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          end
        >
          <Home size={24} />
          <span>Resumo</span>
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <ListOrdered size={24} />
          <span>Histórico</span>
        </NavLink>
        <NavLink
          to="/new"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <div className="fab">
            <PlusCircle size={32} />
          </div>
          <span>Novo</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <SettingsIcon size={24} />
          <span>Ajustes</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
