import Panel from "../components/Panel.js";
import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";

const { useState, useMemo, useCallback } = window.React;
const html = window.htm.bind(window.React.createElement);

export default function ResetPassword({ setPage }) {
  const token = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") || "";
    } catch {
      return "";
    }
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e && e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      setMessage(res.message || "Password reset successful.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }, [token, newPassword, confirmPassword]);

  const actions = html`
    <button
      type="button"
      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      onClick=${() => setPage && setPage("login")}
    >
      Back to Login
    </button>
  `;

  return html`
    <div className="space-y-8">
      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl dark:text-slate-400">
              Enter your new password below.
            </p>
          </div>
        </div>
      <//>

      <${Card} title="Set New Password" subtitle="Your new password must be at least 6 characters.">

        ${error && html`
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <span className="font-medium">Error:</span> ${error}
          </div>
        `}

        ${message && html`
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
            ${message}
          </div>
        `}

        <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 " + theme.ring}>
              <input
                type="password"
                value=${newPassword}
                onInput=${(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none dark:text-slate-100"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 " + theme.ring}>
              <input
                type="password"
                value=${confirmPassword}
                onInput=${(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none dark:text-slate-100"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled=${loading}
              className=${[
                "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition",
                loading ? "bg-sky-400 cursor-not-allowed" : theme.button
              ].join(" ")}
            >
              ${loading ? "Saving..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick=${() => setPage && setPage("login")}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      <//>
    </div>
  `;
}