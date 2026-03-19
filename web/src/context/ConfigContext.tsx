import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type FontSize = "normal" | "large";

interface ConfigContextType {
  theme: Theme;
  fontSize: FontSize;
  groupRecurring: boolean;
  toggleTheme: () => void;
  toggleFontSize: () => void;
  setPreferences: (theme: Theme, font: FontSize, groupRecurr?: boolean) => void;
  setGroupRecurring: (group: boolean) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "dark",
  );
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem("fontSize") as FontSize) || "normal",
  );
  const [groupRecurring, setGroupRecurringState] = useState<boolean>(
    () => {
      const local = localStorage.getItem("groupRecurring");
      if (local !== null) return local === "true";
      return true; // Default behavior
    }
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.setAttribute("data-font", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("groupRecurring", String(groupRecurring));
  }, [groupRecurring]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleFontSize = () =>
    setFontSize((prev) => (prev === "normal" ? "large" : "normal"));

  const setPreferences = (newTheme: Theme, newFont: FontSize, newGroupRecurr?: boolean) => {
    setTheme(newTheme);
    setFontSize(newFont);
    if (newGroupRecurr !== undefined) {
      setGroupRecurringState(newGroupRecurr);
    }
  };

  const setGroupRecurring = (group: boolean) => {
    setGroupRecurringState(group);
  };

  return (
    <ConfigContext.Provider
      value={{ theme, fontSize, groupRecurring, toggleTheme, toggleFontSize, setPreferences, setGroupRecurring }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
