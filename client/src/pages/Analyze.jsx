import { useEffect, useState } from "react";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

const Analyze = () => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    const { data } = await api.get("/ai/history");
    setHistory(data.filter((h) => h.type === "progress" || h.type === "recommendations"));
  };

  useEffect(() => {
    fetchHistory().finally(() => setLoadingHistory(false));
  }, []);

  const handleAnalyze = async () => {
    setError("");
    setAnalyzing(true);
    try {
      await api.post("/ai/analyze");
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRecommend = async () => {
    setError("");
    setRecommending(true);
    try {
      await api.post("/ai/recommendations");
      await fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Recommendation failed");
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">AI Coach</h1>
        <div className="flex gap-2">
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary">
            {analyzing ? "Analyzing..." : "Analyze My Progress"}
          </button>
          <button onClick={handleRecommend} disabled={recommending} className="btn-secondary">
            {recommending ? "Fetching..." : "Recommend Problems"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {loadingHistory ? (
        <LoadingSpinner label="Loading AI history..." />
      ) : history.length === 0 ? (
        <div className="card text-sm text-zinc-500 dark:text-zinc-400">
          No AI analysis yet. Click "Analyze My Progress" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item._id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {item.type === "progress" ? "Progress Analysis" : "Problem Recommendations"}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {item.type === "progress" ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Strongest Topics
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-300">
                        {item.content.strongestTopics.join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Weakest Topics
                      </p>
                      <p className="text-zinc-600 dark:text-zinc-300">
                        {item.content.weakestTopics.join(", ")}
                      </p>
                    </div>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300">{item.content.performanceTrend}</p>
                  <ul className="list-inside list-disc text-zinc-600 dark:text-zinc-300">
                    {item.content.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {item.content.recommendations.map((rec, i) => (
                    <div key={i} className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/60">
                      <p className="font-medium text-zinc-800 dark:text-zinc-100">
                        {rec.order}. {rec.title}{" "}
                        <span className="font-mono text-xs text-zinc-400">({rec.difficulty})</span>
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{rec.reason}</p>
                      <p className="text-xs text-accent">Improves: {rec.improves}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analyze;
