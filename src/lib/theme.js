// Theme preference: "light" (default) | "dark". Applied as data-theme on <html>.
// Vendora's brand is the warm ivory light theme; dark is an opt-in evening mode.
export const THEME_KEY = "vendora-theme";

// Runs inline in <head> before first paint so the saved theme never flashes
export const themeInitScript = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`;

export const getThemePreference = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const resolveTheme = (pref = getThemePreference()) => (pref === "dark" ? "dark" : "light");

export const applyTheme = (pref = getThemePreference()) => {
  const root = document.documentElement;
  if (pref === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
};

export const setThemePreference = (pref) => {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // storage unavailable (private mode): the theme still applies for this visit
  }
  applyTheme(pref);
};
