export type LangCode = "en" | "fr" | "es" | "zh" | "ko" | "ru";

type Dict = Record<string, string>;
type Translations = Record<LangCode, Dict>;

export const LANG_NAMES: Record<LangCode, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  zh: "中文",
  ko: "한국어",
  ru: "Русский",
};

const translations: Translations = {
  en: {
    "app.name": "Mocha",
    "nav.dashboard": "Dashboard",
    "nav.password_manager": "Password Manager",
    "nav.authenticator": "Authenticator",
    "nav.subscriptions": "Subscriptions",
    "nav.settings": "Settings",
    "nav.sign_out": "Sign out",
    "dashboard.title": "Welcome to Mocha",
    "dashboard.subtitle": "Your personal suite of privacy tools. Select an app to get started.",
    "settings.title": "Settings",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.language": "Language",
  },

  fr: {
    "app.name": "Mocha",
    "nav.dashboard": "Tableau de bord",
    "nav.password_manager": "Gestionnaire de mots de passe",
    "nav.authenticator": "Authentificateur",
    "nav.subscriptions": "Abonnements",
    "nav.settings": "Paramètres",
    "nav.sign_out": "Se déconnecter",
    "dashboard.title": "Bienvenue sur Mocha",
    "dashboard.subtitle": "Votre suite personnelle d'outils de confidentialité. Sélectionnez une application pour commencer.",
    "settings.title": "Paramètres",
    "settings.appearance": "Apparence",
    "settings.theme": "Thème",
    "settings.language": "Langue",
  },

  es: {
    "app.name": "Mocha",
    "nav.dashboard": "Panel",
    "nav.password_manager": "Gestor de contraseñas",
    "nav.authenticator": "Autenticador",
    "nav.subscriptions": "Suscripciones",
    "nav.settings": "Ajustes",
    "nav.sign_out": "Cerrar sesión",
    "dashboard.title": "Bienvenido a Mocha",
    "dashboard.subtitle": "Su suite personal de herramientas de privacidad. Seleccione una aplicación para empezar.",
    "settings.title": "Ajustes",
    "settings.appearance": "Apariencia",
    "settings.theme": "Tema",
    "settings.language": "Idioma",
  },

  zh: {
    "app.name": "Mocha",
    "nav.dashboard": "仪表盘",
    "nav.password_manager": "密码管理器",
    "nav.authenticator": "验证器",
    "nav.subscriptions": "订阅管理",
    "nav.settings": "设置",
    "nav.sign_out": "退出登录",
    "dashboard.title": "欢迎使用 Mocha",
    "dashboard.subtitle": "您的个人隐私工具套件。选择一个应用开始使用。",
    "settings.title": "设置",
    "settings.appearance": "外观",
    "settings.theme": "主题",
    "settings.language": "语言",
  },

  ko: {
    "app.name": "Mocha",
    "nav.dashboard": "대시보드",
    "nav.password_manager": "비밀번호 관리자",
    "nav.authenticator": "인증기",
    "nav.subscriptions": "구독 관리",
    "nav.settings": "설정",
    "nav.sign_out": "로그아웃",
    "dashboard.title": "Mocha에 오신 것을 환영합니다",
    "dashboard.subtitle": "개인 정보 보호 도구 모음입니다. 시작하려면 앱을 선택하세요.",
    "settings.title": "설정",
    "settings.appearance": "모양",
    "settings.theme": "테마",
    "settings.language": "언어",
  },

  ru: {
    "app.name": "Mocha",
    "nav.dashboard": "Панель",
    "nav.password_manager": "Менеджер паролей",
    "nav.authenticator": "Аутентификатор",
    "nav.subscriptions": "Подписки",
    "nav.settings": "Настройки",
    "nav.sign_out": "Выйти",
    "dashboard.title": "Добро пожаловать в Mocha",
    "dashboard.subtitle": "Ваш личный набор инструментов конфиденциальности. Выберите приложение для начала.",
    "settings.title": "Настройки",
    "settings.appearance": "Внешний вид",
    "settings.theme": "Тема",
    "settings.language": "Язык",
  },
};

export function getTranslation(lang: LangCode, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export function getAvailableLangs(): LangCode[] {
  return Object.keys(translations) as LangCode[];
}
