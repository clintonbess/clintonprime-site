export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Viewer" });

  let containerEl = null;

  win.mount(
    React.createElement(
      window.PrimeTabsWindow,
      { icon: "fa-file-lines" },
      React.createElement(
        "div",
        {
          className: "markdown-view",
          ref: (el) => (containerEl = el),
        },
        "Viewer booted. Double-click a README shortcut to open a file."
      )
    )
  );

  ctx.bus.on("os.open", async (e) => {
    if (!e.path.endsWith(".md")) return;
    if (!containerEl) return;

    const txt = await ctx.fs.readFile(e.path, { encoding: "utf8" });
    const el = await ctx.ui.renderMarkdown(txt, "md");
    containerEl.replaceChildren(el);

    win.setTitle("Viewer — " + e.path.split("/").pop());
  });
}
