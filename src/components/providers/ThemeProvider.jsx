"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getThemePreference, resolveTheme, setThemePreference } from "@/lib/theme";

const ThemeContext = createContext({ resolved: "dark", toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const [resolved, setResolved] = useState("light");

  useEffect(() => {
    // Sync with the theme the inline <head> script already applied from localStorage
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved theme is only readable after mount
    setResolved(resolveTheme(getThemePreference()));
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
        closeButton
        toastOptions={{ style: { borderRadius: 10, fontFamily: "var(--font-sans)" } }}
      />
    </ThemeContext.Provider>
  );
}
