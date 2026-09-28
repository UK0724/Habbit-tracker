import { useState } from "react";
import { Link } from "react-router-dom";

import { BrandMark } from "../components/brand/BrandMark";
import { ApiError } from "../services/api";
import { forgotPasswordApi } from "../services/authApi";

const inputClass =
  "h-11 w-full rounded-xl border border-border-app bg-surface-2 px-4 text-sm text-content placeholder-slate-400 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/30";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSent(true);
    } catch (err) {
      // Only rate limits / outages reach here; the response never reveals
      // whether an account exists.
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many requests. Please wait a few minutes and try again."
          : "Could not send the reset email right now. Please try again."
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
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Enter the email you use for Pulse and we&apos;ll send you a link.
          </p>
        </div>

        <div className="surface-card p-8">
          {sent ? (
            <div role="status" className="space-y-4 text-center">
              <p className="text-sm font-medium text-content">
                If an account exists for that email, we&apos;ve sent a reset
                link.
              </p>
              <p className="text-xs text-content-muted">
                The link works for 30 minutes. Check your spam folder if you
                don&apos;t see it.
              </p>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
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
                  className={inputClass}
                />
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-content-muted">
            Remembered it?{" "}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
