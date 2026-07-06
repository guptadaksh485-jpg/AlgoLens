const StatCard = ({ label, value, suffix = "" }) => (
  <div className="card">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </p>
    <p className="mt-2 font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
      {value}
      {suffix && <span className="ml-1 text-base text-zinc-400">{suffix}</span>}
    </p>
  </div>
);

export default StatCard;
