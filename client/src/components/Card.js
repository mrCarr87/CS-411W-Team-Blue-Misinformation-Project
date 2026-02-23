const html = window.htm.bind(window.React.createElement);

export default function Card({ title, subtitle, children }) {
  return html`
    <section className="border border-slate-300">
      ${title || subtitle
        ? html`
            <div className="px-6 pt-6">
              ${title ? html`<h2 className="text-base font-semibold text-slate-900">${title}</h2>` : null}
              ${subtitle ? html`<p className="mt-1 text-sm text-slate-600">${subtitle}</p>` : null}
            </div>
          `
        : null}
      <div className="px-6 pb-6 pt-5">${children}</div>
    </section>
  `;
}