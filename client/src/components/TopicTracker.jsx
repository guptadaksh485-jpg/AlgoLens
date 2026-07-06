const TopicTracker = ({ topic, onUpdate }) => {
  const accuracy = topic.attempted > 0 ? Math.round((topic.solved / topic.attempted) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">{topic.name}</p>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{accuracy}%</span>
      </div>

      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-accent"
          style={{ width: `${Math.min(accuracy, 100)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {topic.solved} solved · {topic.attempted} attempted
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => onUpdate(topic._id, { solvedDelta: 1, attemptedDelta: 1 })} className="btn-secondary flex-1 text-xs">
          + Solved
        </button>
        <button onClick={() => onUpdate(topic._id, { attemptedDelta: 1 })} className="btn-secondary flex-1 text-xs">
          + Attempted
        </button>
      </div>
    </div>
  );
};

export default TopicTracker;
