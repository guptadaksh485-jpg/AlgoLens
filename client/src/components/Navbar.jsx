import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="font-mono text-base font-semibold text-accent">{"</>"}</span>
        <span className="font-semibold tracking-tight">AlgoLens</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
        <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
          {user?.name}
        </span>
        <button onClick={handleLogout} className="btn-secondary text-xs">
          Log out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
