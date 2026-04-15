import Navbar from "./components/Navbar.js";
import Analyze from "./pages/Analyze.js";
import Dashboard from "./pages/Dashboard.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Admin from "./pages/Admin.js";
import ForgotPassword from "./pages/ForgotPassword.js";
import ResetPassword from "./pages/ResetPassword.js";

import { apiFetch } from "./ui/api.js";
import { getToken, clearToken } from "./ui/auth.js";

const html = window.htm.bind(window.React.createElement);

function getInitialPage() {
  try {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");

    if (pageParam === "reset-password") return "reset-password";
    if (pageParam === "forgot-password") return "forgot-password";
  } catch (err) {
    // ignore query parsing issues
  }

  return "analyze";
}

export default function App() {
  const [page, setPage] = window.React.useState(getInitialPage());
  const [user, setUser] = window.React.useState(null);
  const [booting, setBooting] = window.React.useState(true);

  window.React.useEffect(() => {
    (async () => {
      try {
        const token = getToken();

        if (!token) {
          setUser(null);
          return;
        }

        const me = await apiFetch("/api/me");
        const normalized = {
          id: me.id ?? me.user_id,
          email: me.email,
          role: me.role,
        };

        setUser(normalized);
      } catch (e) {
        clearToken();
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  function handleLogout() {
    clearToken();
    setUser(null);
    setPage("analyze");
  }

  function guardDashboard() {
    if (!user) {
      setPage("login");
      return false;
    }
    return true;
  }

  function guardAdmin() {
    if (!user) {
      setPage("login");
      return false;
    }

    if (user.role !== "admin") {
      setPage("dashboard");
      return false;
    }

    return true;
  }

  const body =
    page === "analyze"
      ? html`<${Analyze} />`
      : page === "dashboard"
        ? guardDashboard()
          ? html`<${Dashboard} setPage=${setPage} user=${user} />`
          : null
        : page === "admin"
          ? guardAdmin()
            ? html`<${Admin} setPage=${setPage} user=${user} />`
            : null
          : page === "login"
            ? html`<${Login} setPage=${setPage} onLoggedIn=${setUser} />`
            : page === "register"
              ? html`<${Register} setPage=${setPage} />`
              : page === "forgot-password"
                ? html`<${ForgotPassword} setPage=${setPage} />`
                : page === "reset-password"
                  ? html`<${ResetPassword} setPage=${setPage} />`
                  : html`<${Analyze} />`;

  return html`
    <div className="min-h-screen">
      <${Navbar}
        setPage=${setPage}
        user=${user}
        onLogout=${handleLogout}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        ${booting
          ? html`<div className="text-sm text-slate-500">Loading…</div>`
          : body}
      </main>
    </div>
  `;
}