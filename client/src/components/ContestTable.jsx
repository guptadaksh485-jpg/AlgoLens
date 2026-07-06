import { useState } from "react";
import ContestReviewCard from "./ContestReviewCard";

const ContestTable = ({ contests, onEdit, onDelete, onRegenerateReview }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const handleRegenerate = async (id) => {
    setRegeneratingId(id);
    await onRegenerateReview(id);
    setRegeneratingId(null);
  };

  if (contests.length === 0) {
    return (
      <div className="card text-sm text-zinc-500 dark:text-zinc-400">
        No contests logged yet. Add your first contest above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contests.map((contest) => {
        const ratingChange = contest.ratingAfter - contest.ratingBefore;
        const isExpanded = expandedId === contest._id;

        return (
          <div key={contest._id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-100">{contest.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(contest.date).toLocaleDateString()} · Rank #{contest.rank} ·{" "}
                  {contest.problemsSolved} solved
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono text-sm font-semibold">
                  {contest.ratingBefore} → {contest.ratingAfter}
                </p>
                <p
                  className={`font-mono text-xs ${
                    ratingChange >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {ratingChange >= 0 ? "+" : ""}
                  {ratingChange}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 text-xs">
              <button
                onClick={() => setExpandedId(isExpanded ? null : contest._id)}
                className="text-accent hover:underline"
              >
                {isExpanded ? "Hide AI review" : "View AI review"}
              </button>
              <button onClick={() => onEdit(contest)} className="text-zinc-500 hover:underline dark:text-zinc-400">
                Edit
              </button>
              <button onClick={() => onDelete(contest._id)} className="text-red-500 hover:underline">
                Delete
              </button>
            </div>

            {isExpanded && (
              <ContestReviewCard
                review={contest.review}
                onRegenerate={() => handleRegenerate(contest._id)}
                regenerating={regeneratingId === contest._id}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContestTable;
