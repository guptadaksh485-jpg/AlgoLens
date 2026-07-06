import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const Planner = () => {
  const { user } = useAuth();
  const [targetRating, setTargetRating] = useState(user?.targetRating || 1600);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    const { data } = await api.get("/ai/history?type=plan");
    setHistory(data);
    if (data.length > 0) setPlan(data[0]);
  };

  useEffect(() => {
    fetchHistory().finally(() => setLoadingHistory(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/plan", { targetRating, hoursPerDay });
      setPlan(data);
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Practice Planner</h1>

      <form onSubmit={handleGenerate} className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="label-text">Target Rating</label>
          <input
            type="number"
            value={targetRating}
            onChange={(e) => setTargetRating(Number(e.target.value))}
            className="input-field w-32"
          />
        </div>
        <div>
          <label className="label-text">Hours Per Day</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            className="input-field w-32"
          />
        </div>
        <button type="submit" disabled={generating} className="btn-primary">
          {generating ? "Generating..." : "Generate Weekly Plan"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loadingHistory ? (
        <LoadingSpinner label="Loading planner history..." />
      ) : plan ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan.content.days.map((day, i) => (
            <div key={i} className="card">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {day.day}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {day.focus}
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-zinc-600 dark:text-zinc-300">
                {day.tasks.map((task, j) => (
                  <li key={j}>{task}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-sm text-zinc-500 dark:text-zinc-400">
          No plan generated yet. Fill in the form above to get your first weekly roadmap.
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Previous Plans
          </h2>
          <div className="space-y-2">
            {history.slice(1).map((h) => (
              <button
                key={h._id}
                onClick={() => setPlan(h)}
                className="card block w-full text-left text-xs text-zinc-500 hover:border-accent dark:text-zinc-400"
              >
                Target {h.content.targetRating} · {h.content.hoursPerDay}h/day ·{" "}
                {new Date(h.createdAt).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
