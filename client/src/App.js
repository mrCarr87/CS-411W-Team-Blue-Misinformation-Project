import Navbar from "./components/Navbar.js";
import Analyze from "./pages/Analyze.js";
import Dashboard from "./pages/Dashboard.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";

const html = window.htm.bind(window.React.createElement);

export default function App() {
  const [page, setPage] = window.React.useState("analyze");

  return html`
    <div className="min-h-screen">
      <${Navbar} setPage=${setPage} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        ${
          page === "analyze"
            ? html`<${Analyze} />`
            : page === "dashboard"
              ? html`<${Dashboard} setPage=${setPage} />`
              : page === "login"
                ? html`<${Login} setPage=${setPage} />`
                : page === "register"
                  ? html`<${Register} setPage=${setPage} />`
                  : html`<${Analyze} />`
        }
      </main>
    </div>
  `;
}