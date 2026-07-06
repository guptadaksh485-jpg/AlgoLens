import { useEffect, useState } from "react";
import api from "../api";
import TopicTracker from "../components/TopicTracker";
import LoadingSpinner from "../components/LoadingSpinner";

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async () => {
    const { data } = await api.get("/topics");
    setTopics(data);
  };

  useEffect(() => {
    fetchTopics().finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, deltas) => {
    await api.put(`/topics/${id}`, deltas);
    await fetchTopics();
  };

  if (loading) return <LoadingSpinner label="Loading topics..." />;

  const weakTopics = [...topics].sort((a, b) => a.solved - b.solved).slice(0, 3);
  const strongTopics = [...topics].sort((a, b) => b.solved - a.solved).slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Topic Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Strong Topics
          </h3>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            {strongTopics.map((t) => (
              <li key={t._id}>
                {t.name} — {t.solved} solved
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            Weak Topics
          </h3>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            {weakTopics.map((t) => (
              <li key={t._id}>
                {t.name} — {t.solved} solved
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <TopicTracker key={topic._id} topic={topic} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  );
};

export default Topics;
