import { getCurrentWindow } from "@tauri-apps/api/window";
import { useLocation } from "react-router-dom";
import { useI18n } from "../contexts/I18nContext";

const TITLE_KEYS: Record<string, string> = {
  "/": "nav.dashboard",
  "/vault": "nav.password_manager",
  "/authenticator": "nav.authenticator",
  "/subscriptions": "nav.subscriptions",
  "/settings": "nav.settings",
};

export default function Topbar() {
  const location = useLocation();
  const { t } = useI18n();
  const titleKey = TITLE_KEYS[location.pathname];
  const title = titleKey ? t(titleKey) : t("app.name");

  function startDrag(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;
    getCurrentWindow().startDragging();
  }

  return (
    <header className="topbar" onMouseDown={startDrag}>
      <h1 className="topbar-title">{title}</h1>
      <div className="window-controls" onClick={(e) => e.stopPropagation()}>
        <button className="wc-btn" onClick={() => getCurrentWindow().minimize()} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1" fill="currentColor" rx="0.5" /></svg>
        </button>
        <button className="wc-btn" onClick={() => getCurrentWindow().toggleMaximize()} aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
        </button>
        <button className="wc-btn wc-close" onClick={() => getCurrentWindow().close()} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </button>
      </div>
    </header>
  );
}
