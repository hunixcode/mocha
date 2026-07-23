import { createContext, useContext, useState, ReactNode } from "react";
import { LangCode, getTranslation, getAvailableLangs, LANG_NAMES } from "../lib/translations";

const STORAGE_KEY = "mocha_lang";
const DEFAULT_LANG: LangCode = "en";

interface I18nContextValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
  langNames: Record<LangCode, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const available = getAvailableLangs();
    if (stored && available.includes(stored as LangCode)) return stored as LangCode;
    return DEFAULT_LANG;
  });

  function setLang(l: LangCode) {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }

  function t(key: string): string {
    return getTranslation(lang, key);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, langNames: LANG_NAMES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
