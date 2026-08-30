import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Renders the analytics payload the parent page fetches, so this and the
// Strong/Weak cards next to it never drift apart.
const CodeforcesAnalytics = ({ analytics }) => {
  if (!analytics || analytics.topicWise.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card h-72">
        <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Codeforces Tags Solved
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={analytics.topicWise.slice(0, 8)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
            <XAxis dataKey="tag" fontSize={11} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis fontSize={12} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="solved" fill="#4f46e5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card h-72">
        <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Solved by Difficulty
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={analytics.difficultyWise} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
            <XAxis dataKey="range" fontSize={11} />
            <YAxis fontSize={12} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="solved" fill="#059669" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CodeforcesAnalytics;
