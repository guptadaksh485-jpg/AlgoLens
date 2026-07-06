import { useEffect, useState } from "react";
import api from "../api";
import ContestForm from "../components/ContestForm";
import ContestTable from "../components/ContestTable";
import LoadingSpinner from "../components/LoadingSpinner";

const Contests = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchContests = async () => {
    const { data } = await api.get("/contests");
    setContests(data);
  };

  useEffect(() => {
    fetchContests().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editingContest) {
        await api.put(`/contests/${editingContest._id}`, form);
      } else {
        await api.post("/contests", form);
      }
      await fetchContests();
      setShowForm(false);
      setEditingContest(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contest) => {
    setEditingContest(contest);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contest?")) return;
    await api.delete(`/contests/${id}`);
    await fetchContests();
  };

  const handleRegenerateReview = async (id) => {
    await api.post(`/contests/${id}/review`);
    await fetchContests();
  };

  if (loading) return <LoadingSpinner label="Loading contests..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Contests</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingContest(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            + Add Contest
          </button>
        )}
      </div>

      {showForm && (
        <ContestForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContest(null);
          }}
          editingContest={editingContest}
          submitting={submitting}
        />
      )}

      <ContestTable
        contests={contests}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRegenerateReview={handleRegenerateReview}
      />
    </div>
  );
};

export default Contests;
