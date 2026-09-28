import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BrandMark } from "../components/brand/BrandMark";
import { ApiError } from "../services/api";
import { resetPasswordApi } from "../services/authApi";
import { validateNewPassword } from "../shared/lib/password";

const inputClass =
  "h-11 w-full rounded-xl border border-border-app bg-surface-2 px-4 text-sm text-content placeholder-slate-400 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/30";

const EXPIRED_MESSAGE = "This reset link is invalid or has expired.";

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLinkExpired(false);
    const passwordError = validateNewPassword(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setLinkExpired(/invalid|expired/i.test(err.message));
        setError(err.message || EXPIRED_MESSAGE);
      } else {
        setError("Could not reset your password. Please try again.");
      }
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
            Choose a new password
          </h1>
        </div>

        <div className="surface-card p-8">
          {!token ? (
            <div role="alert" className="space-y-4 text-center">
              <p className="text-sm font-medium text-content">
                {EXPIRED_MESSAGE}
              </p>
              <Link
                to="/forgot-password"
                className="font-semibold text-accent hover:underline"
              >
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div role="status" className="space-y-4 text-center">
              <p className="text-sm font-medium text-content">
                Your password has been changed.
              </p>
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-content-2"
                >
                  New password
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
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-semibold text-content-2"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-600"
                >
                  {error}
                  {linkExpired ? (
                    <>
                      {" "}
                      <Link to="/forgot-password" className="underline">
                        Request a new link
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
