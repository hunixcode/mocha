import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { getAvailableLangs } from "../lib/translations";

export default function Settings() {
  const { theme, themeNames, setTheme } = useTheme();
  const { lang, setLang, t, langNames } = useI18n();
  const available = getAvailableLangs();

  return (
    <div className="settings-page">
      <h2>{t("settings.title")}</h2>

      <section className="settings-section">
        <h3>{t("settings.appearance")}</h3>

        <div className="settings-field">
          <label>{t("settings.theme")}</label>
          <div className="theme-grid">
            {themeNames.map((th) => (
              <button
                key={th.value}
                className={`theme-card ${theme === th.value ? "active" : ""}`}
                onClick={() => setTheme(th.value)}
                data-theme-preview={th.value}
              >
                <div className="theme-preview">
                  <div className="tp-bg" />
                  <div className="tp-surface" />
                  <div className="tp-accent" />
                </div>
                <span>{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-field">
          <label>{t("settings.language")}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
          >
            {available.map((code) => (
              <option key={code} value={code}>
                {langNames[code]}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
