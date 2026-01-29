"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Leer tema del localStorage e inicializar en el cliente
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ?? (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    
    if (newTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Evitar render en servidor para prevenir hidratación fallida
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        disabled
        aria-label="Cargando tema"
      >
        <Sun size={18} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10"
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
      title={`Modo ${theme === "light" ? "oscuro" : "claro"}`}
    >
      {theme === "light" ? (
        <Moon size={18} className="transition-all" />
      ) : (
        <Sun size={18} className="transition-all" />
      )}
    </Button>
  );
}
