import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-mono text-2xl font-semibold text-accent">{"</>"}</span>
          <h1 className="mt-2 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            Create your AlgoLens account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label className="label-text">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="label-text">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="At least 6 characters"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
