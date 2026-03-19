import { Outlet, NavLink } from "react-router-dom";
import {
  Home,
  ListOrdered,
  PlusCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import logo from "../../../logo-final.svg";
import "./Layout.css";

const Layout = () => {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <NavLink to="/" className="brand-link" end>
          <img src={logo} alt="Família Finance" className="brand-logo" />
        </NavLink>
      </header>

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
