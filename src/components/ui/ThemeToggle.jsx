"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { resolved, toggle } = useTheme();
  const next = resolved === "light" ? "dark" : "light";
  return (
    <button className={`btn btn-ghost btn-icon ${className}`} onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {resolved === "light" ? <Moon /> : <Sun />}
    </button>
  );
}
