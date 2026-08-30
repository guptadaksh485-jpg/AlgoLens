import { useEffect, useState } from "react";
import api from "../api";
import CodeforcesAnalytics from "../components/CodeforcesAnalytics";
import TopicCard from "../components/TopicCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

// One /codeforces/analytics fetch backs Strong/Weak, the cards, and the charts.
const Topics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.handle) {
      setLoading(false);
      return;
    }
    api
      .get("/codeforces/analytics")
      .then(({ data }) => setAnalytics(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load Codeforces analytics"))
      .finally(() => setLoading(false));
  }, [user?.handle]);

  if (loading) return <LoadingSpinner label="Loading topics..." />;

  if (!user?.handle) {
    return (
      <div className="card text-sm text-zinc-500 dark:text-zinc-400">
        Set your Codeforces handle in Profile and sync to see topic analytics.
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const topics = analytics?.topicWise || [];
  const hasData = topics.length > 0;
  const strongTopics = topics.slice(0, 3);
  const weakTopics = [...topics].sort((a, b) => a.solved - b.solved).slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Topic Analytics</h1>

      {!hasData ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No Codeforces data yet — hit "Sync Codeforces Data" in Profile.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Strong Topics
              </h3>
              <ul className="space-y-1 text-sm capitalize text-zinc-600 dark:text-zinc-300">
                {strongTopics.map((t) => (
                  <li key={t.tag}>
                    {t.tag} — {t.solved} solved
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                Weak Topics
              </h3>
              <ul className="space-y-1 text-sm capitalize text-zinc-600 dark:text-zinc-300">
                {weakTopics.map((t) => (
                  <li key={t.tag}>
                    {t.tag} — {t.solved} solved
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <CodeforcesAnalytics analytics={analytics} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.tag} topic={topic} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Topics;
