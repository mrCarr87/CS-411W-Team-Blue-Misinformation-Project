import Card from "../components/Card.js";

const html = window.htm.bind(window.React.createElement);

export default function Dashboard() {
  return html`
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        User Dashboard
      </h1>
      <h1 className="text-right text-3x1 font-bold text-slate-750">
        Welcome [UserName]!
      </h1>
      <h2 className"text-right text-lg font-medium text-slate-700">
      Here are your previous analyses and their results! Review them and read back over your previous submissions or you can analyze new ones!
      </h2>

      <${Card} title="Demo Page">
        <p className="text-slate-600">
          If you are reading this, the login button functions as intended and we can remove this moving forward.
        </p>
      <//>
    </div>
  `;
}