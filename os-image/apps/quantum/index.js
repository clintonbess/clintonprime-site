export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({
    title: "Quantum Reality",
    icon: "fa-atom",
  });

  const HOME = "/home/quantum";
  if (!(await ctx.fs.exists(HOME))) {
    await ctx.fs.mkdir(HOME, { recursive: true });
  }

  const DOC_PATH = `${HOME}/quantum-reality.md`;
  const hasDoc = await ctx.fs.exists(DOC_PATH);

  if (!hasDoc) {
    const systemTemplate = "/system/apps/quantum/quantum-reality.md";
    const content =
      (await ctx.fs
        .readFile(systemTemplate, { encoding: "utf8" })
        .catch(() => null)) ||
      "# Quantum Reality\n\n_A cyber-goth sutra for those who debug the illusion._";
    await ctx.fs.writeFile(DOC_PATH, content, { createDirs: true });
  }

  // 2) Mount PrimeTabsWindow + markdown container
  const containerEl = document.createElement("div");
  containerEl.className = "markdown-view";
  win.mount(containerEl);

  const tabs = [
    {
      id: "quantum-reality",
      label: "quantum-reality.md",
      path: DOC_PATH,
    },
  ];

  win.mount(
    React.createElement(window.PrimeTabsWindow, {
      fs: ctx.fs,
      title: "quantum-reality.md",
      icon: "fa-atom",
      tabs,
    })
  );

  // 3) Render markdown on boot
  if (containerEl) {
    const txt = await ctx.fs.readFile(DOC_PATH, { encoding: "utf8" });
    const el = await ctx.ui.renderMarkdown(txt, "md");
    containerEl.replaceChildren(el);
    win.setTitle("Quantum Reality — quantum-reality.md");
  }
}
