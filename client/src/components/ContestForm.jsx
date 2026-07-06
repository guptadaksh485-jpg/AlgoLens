import { useState, useEffect } from "react";

const emptyForm = {
  name: "",
  date: "",
  rank: "",
  ratingBefore: "",
  ratingAfter: "",
  problemsSolved: "",
};

const ContestForm = ({ onSubmit, onCancel, editingContest, submitting }) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingContest) {
      setForm({
        name: editingContest.name,
        date: editingContest.date.split("T")[0],
        rank: editingContest.rank,
        ratingBefore: editingContest.ratingBefore,
        ratingAfter: editingContest.ratingAfter,
        problemsSolved: editingContest.problemsSolved,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingContest]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      rank: Number(form.rank),
      ratingBefore: Number(form.ratingBefore),
      ratingAfter: Number(form.ratingAfter),
      problemsSolved: Number(form.problemsSolved),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {editingContest ? "Edit Contest" : "Add Contest"}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-text">Contest Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Codeforces Round 950 (Div 3)"
          />
        </div>

        <div>
          <label className="label-text">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">Rank</label>
          <input
            type="number"
            name="rank"
            value={form.rank}
            onChange={handleChange}
            required
            min="1"
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">Problems Solved</label>
          <input
            type="number"
            name="problemsSolved"
            value={form.problemsSolved}
            onChange={handleChange}
            required
            min="0"
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">Rating Before</label>
          <input
            type="number"
            name="ratingBefore"
            value={form.ratingBefore}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="label-text">Rating After</label>
          <input
            type="number"
            name="ratingAfter"
            value={form.ratingAfter}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : editingContest ? "Save Changes" : "Add Contest"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ContestForm;
