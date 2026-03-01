import Panel from "../components/Panel.js";
import { theme } from "../ui/theme.js";
import Card from "../components/Card.js";

export default function Login ({ setPage }) { 
return html`
    <div className="space-y-8">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Welcome!</span>
            </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Please log in to view your dashboard and saved analyses!
              </p>
            </div>
    </div>
    `;
}