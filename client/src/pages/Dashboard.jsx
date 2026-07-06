import { useEffect, useState } from "react";
import api from "../api";
import StatCard from "../components/StatCard";
import RatingChart from "../components/RatingChart";
import TopicChart from "../components/TopicChart";
import WeeklyActivityChart from "../components/WeeklyActivityChart";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard");
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  const { stats, charts } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Current Rating" value={stats.currentRating} />
        <StatCard label="Highest Rating" value={stats.highestRating} />
        <StatCard label="Total Solved" value={stats.totalProblemsSolved} />
        <StatCard label="Current Streak" value={stats.currentStreak} suffix="days" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RatingChart data={charts.ratingProgress} />
        <TopicChart data={charts.topicDistribution} />
        <WeeklyActivityChart data={charts.weeklyActivity} />
      </div>
    </div>
  );
};

export default Dashboard;
