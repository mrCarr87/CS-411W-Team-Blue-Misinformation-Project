import Panel from "../components/Panel.js";
import SavedArticleCard from "../components/SavedArticleCard.js";
import { theme } from "../ui/theme.js";

const html = window.htm.bind(window.React.createElement);

function demoSaved() {
  return [
    {
      id: 1,
      title: "City council votes on new housing plan",
      url: "https://example.com/news/housing-plan",
      domain: "example.com",
      date: "Feb 22, 2026",
      score: 81,
      note: "Little misinformation detected.",
    },
    {
      id: 2,
      title: "“Miracle cure” claim spreads on social media",
      url: "https://health-now.blog/miracle-cure",
      domain: "health-now.blog",
      date: "Feb 21, 2026",
      score: 43,
      note: "Weak sources detected.",
    },
    {
      id: 3,
      title: "Opinion: Why the economy is about to collapse",
      url: "https://hot-takes.net/economy-collapse",
      domain: "hot-takes.net",
      date: "Feb 19, 2026",
      score: 28,
      note: "High bias detected.",
    },
  ];
}

export default function Dashboard({ setPage }) {
  const [items, setItems] = window.React.useState(demoSaved());

  function onOpen(item) {
    alert("Demo: would open the saved report for:\n\n" + item.title);
  }

  function onRemove(item) {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  const actions = html`
    <button
      type="button"
      className=${"px-3 py-2 text-sm font-medium text-white bg-gradient-to-br " + theme.accent + " hover:opacity-90 transition"}
      onClick=${() => setPage && setPage("analyze")}
    >
      New analysis
    </button>
  `;

  return html`
    <div className="space-y-8">

      <${Panel} actions=${actions}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-slate-200 grid place-items-center overflow-hidden">
              <div className="text-3xl">👤</div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Welcome <span className="text-slate-700">[UserName]!</span>
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-xl">
                Here are your saved analyses and their results! Review them and read back over your previous submissions or you can analyze new ones!
              </p>
            </div>
          </div>
        </div>
      <//>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved Links</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${items.map((item) => html`
          <${SavedArticleCard}
            key=${item.id}
            item=${item}
            onOpen=${onOpen}
            onRemove=${onRemove}
          />
        `)}
      </div>

    </div>
  `;
}