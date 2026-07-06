import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [handle, setHandle] = useState(user?.handle || "");
  const [targetRating, setTargetRating] = useState(user?.targetRating || 1600);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.put("/profile", { name, handle, targetRating });
      updateUser(data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {saved && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            Profile updated
          </p>
        )}

        <div>
          <label className="label-text">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="label-text">Competitive Programming Handle</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="input-field"
            placeholder="Codeforces handle, optional"
          />
        </div>

        <div>
          <label className="label-text">Target Rating</label>
          <input
            type="number"
            value={targetRating}
            onChange={(e) => setTargetRating(Number(e.target.value))}
            className="input-field"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700">
          <span className="text-sm text-zinc-700 dark:text-zinc-200">Dark Mode</span>
          <button type="button" onClick={toggleDarkMode} className="btn-secondary text-xs">
            {darkMode ? "On" : "Off"}
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
