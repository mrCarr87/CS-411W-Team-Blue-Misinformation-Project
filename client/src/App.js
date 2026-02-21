import Navbar from "./components/Navbar.js";
import Analyze from "./pages/Analyze.js";
import Dashboard from "./pages/Dashboard.js";

const html = window.htm.bind(window.React.createElement);

export default function App() {
  return html`
    <div className="min-h-screen">
      <${Navbar} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <${Analyze} />
      </main>
    </div>
  `;
}