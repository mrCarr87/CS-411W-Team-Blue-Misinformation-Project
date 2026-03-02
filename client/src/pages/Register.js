import Panel from "../components/Panel.js";
import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";

const { useState, useCallback } = window.React;
const html = window.htm.bind(window.React.createElement);

export default function Register({ setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleClear = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirm("");
    setError(null);
    setSuccess(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e && e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password || !confirm) {
      setError("Email, password, and confirm password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      setSuccess("Account created. You can log in now.");
      setPassword("");
      setConfirm("");

      setPage && setPage("login");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }, [email, password, confirm, setPage]);

  const actions = html`
    <button
      type="button"
      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      onClick=${() => setPage && setPage("login")}
    >
      Already have an account?
    </button>
  `;

  return html`
    <div className="space-y-8">

      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Register
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Create an account to save and revisit your credibility analyses.
              </p>
            </div>
          </div>
        </div>
      <//>

      <${Card} title="Create Account" subtitle="Use a valid email and a secure password.">

        ${error && html`
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            <span className="font-medium">Error:</span> ${error}
          </div>
        `}

        ${success && html`
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4">
            <span className="font-medium">Success:</span> ${success}
          </div>
        `}

        <form onSubmit=${handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="email"
                value=${email}
                onInput=${(e) => setEmail(e.target.value)}
                placeholder="you@odu.edu"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="password"
                value=${password}
                onInput=${(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <div className=${"mt-1 flex rounded-xl border border-slate-200 bg-white shadow-sm " + theme.ring}>
              <input
                type="password"
                value=${confirm}
                onInput=${(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
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
              ${loading ? "Creating..." : "Register"}
            </button>

            <button
              type="button"
              onClick=${handleClear}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>

        </form>
      <//>

    </div>
  `;
}