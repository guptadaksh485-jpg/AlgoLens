const LoadingSpinner = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500 dark:text-zinc-400">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-accent dark:border-zinc-700" />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;
