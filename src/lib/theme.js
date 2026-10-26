// Theme preference: "light" | "dark" | "system" (default). Applied as data-theme on <html>.
export const THEME_KEY = "vendora-theme";

// Runs inline in <head> before first paint so the saved theme never flashes
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export const getThemePreference = () => {
  try {
    return localStorage.getItem(THEME_KEY) || "system";
  } catch {
    return "system";
  }
};

export const resolveTheme = (pref = getThemePreference()) => {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const applyTheme = (pref = getThemePreference()) => {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
};

export const setThemePreference = (pref) => {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // storage unavailable (private mode): the theme still applies for this visit
  }
  applyTheme(pref);
};
