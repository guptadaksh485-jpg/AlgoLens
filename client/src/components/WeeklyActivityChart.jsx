import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const WeeklyActivityChart = ({ data }) => {
  const chartData = (data || []).map((d) => ({ ...d, value: d.active ? 1 : 0 }));

  return (
    <div className="card h-72">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Weekly Activity
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" fontSize={12} stroke="currentColor" className="text-zinc-500" />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value) => (value ? "Active" : "No activity")}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.active ? "#4f46e5" : "#e4e4e7"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyActivityChart;
