"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getThemePreference, resolveTheme, setThemePreference } from "@/lib/theme";

const ThemeContext = createContext({ resolved: "dark", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [resolved, setResolved] = useState("dark");

  useEffect(() => {
    // Sync with the theme the inline <head> script already applied, and follow the OS while on "system"
    const sync = () => setResolved(resolveTheme(getThemePreference()));
    sync();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const toggle = useCallback(() => {
    const next = resolveTheme() === "light" ? "dark" : "light";
    setThemePreference(next);
    setResolved(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ resolved, toggle }}>
      {children}
      <Toaster
        theme={resolved}
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { borderRadius: 16, fontFamily: "var(--font-sans)" } }}
      />
    </ThemeContext.Provider>
  );
}
