import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../components/brand/BrandMark";
import { ApiError } from "../services/api";
import { registerApi } from "../services/authApi";
import { useAuthStore } from "../stores/authStore";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await registerApi(email, password);
      setAuth(result.token, result.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
          <h1 className="text-2xl font-bold tracking-tight text-content">
            Create your Arc account
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Start tracking habits, streaks &amp; spending
          </p>
        </div>

        <div className="surface-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-content-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-border-app bg-surface-2 px-4 text-sm text-content placeholder-slate-400 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-content-2"
              >
                Password
                <span className="ml-1 font-normal text-content-subtle">
                  (min. 8 characters)
                </span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 w-full rounded-xl border border-border-app bg-surface-2 px-4 text-sm text-content placeholder-slate-400 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/30"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="mb-1.5 block text-sm font-semibold text-content-2"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                className="h-11 w-full rounded-xl border border-border-app bg-surface-2 px-4 text-sm text-content placeholder-slate-400 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/30"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-content-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-accent hover:text-accent"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
