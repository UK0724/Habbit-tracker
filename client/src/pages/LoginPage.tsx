import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { BrandMark } from "../components/brand/BrandMark";
import { ApiError } from "../services/api";
import { loginApi } from "../services/authApi";
import { useAuthStore } from "../stores/authStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginApi(email, password);
      setAuth(result.token, result.user);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Login failed"
      );
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
            Welcome back to Pulse
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Sign in to keep your streaks going
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
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-content-muted">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-accent hover:text-accent"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
