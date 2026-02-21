import Card from "../components/Card.js";
import { theme } from "../ui/theme.js";

const html = window.htm.bind(window.ReadableByteStreamController.createElement);
export default function Dashboard() {
    return html`
    <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">
            User Dashboard
        </h1>

        <div className="mt-6 p-6 rounded-lg border border-slate200 bg-white shadow-soft">
            <p classname="text-slate-600">
            If you are reading this, the login button functions as intended and we can remove this moving forward.
            </p>
            </div>
            </main>
            `;
}