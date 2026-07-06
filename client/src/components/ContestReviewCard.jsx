const ContestReviewCard = ({ review, onRegenerate, regenerating }) => {
  if (!review?.generatedAt) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        <p>AI review wasn't generated for this contest yet.</p>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="mt-2 text-accent hover:underline disabled:opacity-50"
        >
          {regenerating ? "Generating..." : "Generate review"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60">
      <p className="text-zinc-700 dark:text-zinc-200">{review.summary}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <p className="font-medium text-emerald-600 dark:text-emerald-400">Strong points</p>
          <ul className="list-inside list-disc text-zinc-600 dark:text-zinc-300">
            {review.strongPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-amber-600 dark:text-amber-400">Weak points</p>
          <ul className="list-inside list-disc text-zinc-600 dark:text-zinc-300">
            {review.weakPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <p>
        <span className="font-medium text-red-600 dark:text-red-400">Biggest mistake: </span>
        <span className="text-zinc-600 dark:text-zinc-300">{review.biggestMistake}</span>
      </p>
      <p>
        <span className="font-medium text-accent">Next time: </span>
        <span className="text-zinc-600 dark:text-zinc-300">{review.improvementSuggestion}</span>
      </p>
    </div>
  );
};

export default ContestReviewCard;
