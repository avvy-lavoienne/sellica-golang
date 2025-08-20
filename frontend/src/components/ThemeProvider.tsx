"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystem?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light" | undefined
  systemTheme: "dark" | "light" | undefined
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: undefined,
  systemTheme: undefined,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Prevent hydration mismatch by only accessing localStorage on client
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<"dark" | "light" | undefined>(
    undefined,
  );
  const [mounted, setMounted] = useState(false);

  // Update systemTheme when system preference changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = () => {
      const newSystemTheme = media.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
    };

    // Set initial value
    updateSystemTheme();

    // Listen for changes with modern API
    try {
      media.addEventListener("change", updateSystemTheme);
      return () => media.removeEventListener("change", updateSystemTheme);
    } catch (error) {
      // Fallback for very old browsers (should rarely be needed)
      console.warn("Using deprecated media query listener API");
      media.addListener(updateSystemTheme);
      return () => media.removeListener(updateSystemTheme);
    }
  }, []);

  // Enhanced theme application with better transitions
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const isDark =
      theme === "dark" || (theme === "system" && systemTheme === "dark");

    // Add transition class for smooth theme changes
    const transitionClass = "theme-transition";
    root.classList.add(transitionClass);

    // Apply theme with enhanced meta theme-color support
    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", isDark ? "#0a0a0a" : "#ffffff");
    } else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = isDark ? "#0a0a0a" : "#ffffff";
      document.head.appendChild(meta);
    }

    // Update color-scheme for better browser integration
    root.style.colorScheme = isDark ? "dark" : "light";

    // Force a reflow to ensure the transition applies
    void root.offsetHeight;

    // Remove transition class after transition completes
    const removeTransition = () => {
      root.classList.remove(transitionClass);
    };

    // Use CSS variable duration for consistency
    const duration = parseInt(
      getComputedStyle(root).getPropertyValue("--duration-normal") || "300",
    );
    const timeout = setTimeout(removeTransition, duration);

    return () => clearTimeout(timeout);
  }, [theme, systemTheme, mounted]);

  // Handle mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const setTheme = React.useCallback(
    (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme);
        setThemeState(theme);

        // Dispatch custom event for other components to listen to theme changes
        window.dispatchEvent(
          new CustomEvent("theme-change", {
            detail: {
              theme,
              resolvedTheme: theme === "system" ? systemTheme : theme,
            },
          }),
        );
      } catch (error) {
        console.warn("Failed to save theme preference:", error);
        // Still update the state even if localStorage fails
        setThemeState(theme);
      }
    },
    [storageKey, systemTheme],
  );

  // Calculate the resolved theme (what's actually applied)
  const resolvedTheme = mounted
    ? ((theme === "system" ? systemTheme : theme) as "light" | "dark")
    : undefined;

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
  };

  // Prevent flash of incorrect theme by not rendering until mounted
  // Use a simple div with the appropriate theme class for SSR
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
