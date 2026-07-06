import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RatingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="card h-72">
        <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Rating Progress
        </h3>
        <p className="text-sm text-zinc-400">Add a contest to see your rating over time.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="card h-72">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Rating Progress
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
          <XAxis dataKey="date" fontSize={12} stroke="currentColor" className="text-zinc-500" />
          <YAxis fontSize={12} stroke="currentColor" className="text-zinc-500" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.contest || label}
          />
          <Line type="monotone" dataKey="rating" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RatingChart;
