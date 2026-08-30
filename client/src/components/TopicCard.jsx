// Read-only - this data comes from a sync, so manual edits would just get overwritten.
const TopicCard = ({ topic }) => {
  const accuracy = topic.attempted > 0 ? Math.round((topic.solved / topic.attempted) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="font-medium capitalize text-zinc-800 dark:text-zinc-100">{topic.tag}</p>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{accuracy}%</span>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-accent"
          style={{ width: `${Math.min(accuracy, 100)}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        {topic.solved} solved · {topic.attempted} attempted
      </p>
    </div>
  );
};

export default TopicCard;
