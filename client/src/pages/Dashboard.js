import Card from "../components/Card.js";

const html = window.htm.bind(window.React.createElement);

export default function Dashboard() {
  return html`
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        User Dashboard
      </h1>

      <${Card} title="Demo Page">
        <p className="text-slate-600">
          If you are reading this, the login button functions as intended and we can remove this moving forward.
        </p>
      <//>
    </div>
  `;
}