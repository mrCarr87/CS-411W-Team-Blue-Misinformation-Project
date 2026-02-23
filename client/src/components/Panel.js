const html = window.htm.bind(window.React.createElement);

export default function Panel({actions, children}) {
    return html`
    <section className="border border-slate-300">
        <div className="flex justify-end px-6 pt-5">${actions}</div>
        <div className="px-6 pb-6 pt-5">${children}</div>
        </section>
    `;
}