import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";
import { Logo, IconDashboard, IconKey, IconShield, IconReceipt, IconSettings } from "./Icons";

export default function Sidebar() {
  const { signOut } = useAuth();
  const { t } = useI18n();

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-brand">
        <Logo size={22} />
        <span>{t("app.name")}</span>
      </div>
      <nav className="sidebar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <IconDashboard />
          <span>{t("nav.dashboard")}</span>
        </NavLink>
        <NavLink to="/vault" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <IconKey />
          <span>{t("nav.password_manager")}</span>
        </NavLink>
        <NavLink to="/authenticator" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <IconShield />
          <span>{t("nav.authenticator")}</span>
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <IconReceipt />
          <span>{t("nav.subscriptions")}</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <IconSettings />
          <span>{t("nav.settings")}</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button className="nav-link" onClick={signOut}>
          {t("nav.sign_out")}
        </button>
      </div>
    </aside>
  );
}
