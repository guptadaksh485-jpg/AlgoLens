import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TopicChart = ({ data }) => {
  return (
    <div className="card h-72">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Topic Distribution
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
          <XAxis dataKey="topic" fontSize={11} stroke="currentColor" className="text-zinc-500" interval={0} angle={-25} textAnchor="end" height={50} />
          <YAxis fontSize={12} stroke="currentColor" className="text-zinc-500" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="solved" fill="#4f46e5" radius={[3, 3, 0, 0]} />
          <Bar dataKey="attempted" fill="#c7d2fe" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopicChart;
