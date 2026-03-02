import Panel from "../components/Panel.js";
import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";
import { apiFetch } from "../ui/api.js";
import { setToken } from "../ui/auth.js";

const { useState, useCallback } = window.React;
const html = window.htm.bind(window.React.createElement);

export default function Login({ setPage, onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClear = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e && e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const loginRes = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!loginRes.token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      setToken(loginRes.token);

      const me = await apiFetch("/api/me");
      const user = {
        id: me.id ?? me.user_id,
        email: me.email,
        role: me.role,
      };

      onLoggedIn && onLoggedIn(user);

      setPage && setPage("dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }, [email, password, setPage, onLoggedIn]);

  const actions = html`
    <button
      type="button"
      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      onClick=${() => setPage && setPage("analyze")}
    >
      Go Back
    </button>
  `;

  return html`
    <div className="space-y-8">

      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Login
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Login to view your user dashboard and previous analyses.
              </p>
            </div>
          </div>
        </div>
      <//>

      <${Card} title="Login" subtitle="Use your registered email and password to continue.">

        ${error && html`
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
            <span className="font-medium">Error:</span> ${error}
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
                placeholder="Password"
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none"
                autoComplete="current-password"
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
              ${loading ? "Signing in..." : "Login"}
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