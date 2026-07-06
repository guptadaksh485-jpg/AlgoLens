import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../api";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("algolens_dark_mode");
    return stored ? JSON.parse(stored) : user?.darkMode || false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("algolens_dark_mode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);

    if (user) {
      try {
        await api.put("/profile", { darkMode: next });
        updateUser({ darkMode: next });
      } catch (err) {
        console.error("Failed to save dark mode preference:", err.message);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
