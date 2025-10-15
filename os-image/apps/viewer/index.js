export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Viewer" });

  // 1) Ensure target folder and seed README once
  const HOME = "/home/viewer";
  if (!(await ctx.fs.exists(HOME)))
    await ctx.fs.mkdir(HOME, { recursive: true });
  const README = `${HOME}/README.md`;
  const hasReadme = await ctx.fs.exists(README);
  if (!hasReadme) {
    // Seed from system template if present; fallback to a minimal intro
    const templatePath = "/system/apps/viewer/README.md";
    const template =
      (await ctx.fs
        .readFile(templatePath, { encoding: "utf8" })
        .catch(() => null)) ||
      "# Quantum — README\n\nThis space initializes a viewer with markdown rendering.";
    await ctx.fs.writeFile(README, template, { createDirs: true });
  }

  const containerEl = document.createElement("div");
  containerEl.className = "markdown-view";
  win.mount(containerEl);
  const tabs = [{ id: "README", label: "README", path: `${HOME}/README.md` }];

  win.mount(
    React.createElement(window.PrimeTabsWindow, {
      fs: ctx.fs,
      title: "README",
      icon: "fa-file-lines",
      tabs,
    })
  );

  // 2) Render the README on boot
  if (containerEl) {
    const txt = await ctx.fs.readFile(README, { encoding: "utf8" });
    const el = await ctx.ui.renderMarkdown(txt, "md");
    containerEl.replaceChildren(el);
    win.setTitle("Viewer — README.md");
  }

  // 3) Optional: support opening other .md files via OS event
  ctx.bus.on("os.open", async (e) => {
    if (!e.path.endsWith(".md")) return;
    if (!containerEl) return;
    const txt = await ctx.fs.readFile(e.path, { encoding: "utf8" });
    const el = await ctx.ui.renderMarkdown(txt, "md");
    containerEl.replaceChildren(el);
    win.setTitle("Viewer — " + e.path.split("/").pop());
  });
}
