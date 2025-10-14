const { createElement } = window.React;

export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Prime Codex" });

  const HOME = "/home/codex";
  if (!(await ctx.fs.exists(HOME)))
    await ctx.fs.mkdir(HOME, { recursive: true });

  // 🧱 Seed files if missing
  const seededMarker = `${HOME}/.seeded`;
  const needsSeed = !(await ctx.fs.exists(seededMarker));
  const files = ["about.md", "latest.md", "lore-log.md"];

  if (needsSeed) {
    for (const f of files) {
      const dest = `${HOME}/${f}`;
      if (!(await ctx.fs.exists(dest))) {
        const src = `/system/apps/codex/templates/${f}`;
        const txt = await ctx.fs.readFile(src, { encoding: "utf8" });
        await ctx.fs.writeFile(dest, txt, { createDirs: true });
      }
    }
    await ctx.fs.writeFile(seededMarker, "ok");
  }

  // 🪟 Target container
  const container = document.createElement("div");
  container.className = "markdown-view";
  win.mount(container);

  // 🧭 File renderer
  async function open(path) {
    const name = path.split("/").pop();

    const txt = await ctx.fs.readFile(path, { encoding: "utf8" });
    const style = name === "latest.md" ? "code" : "md";
    const el = await ctx.ui.renderMarkdown(txt, style);
    container.replaceChildren(el);

    win.setTitle(`Prime Codex`);
  }

  // 📡 Listen for log.append events
  ctx.bus.on("log.append", async (e) => {
    if (!e.path.startsWith(HOME + "/")) return;
    const prev =
      (await ctx.fs.readFile(e.path, { encoding: "utf8" }).catch(() => "")) ||
      "";
    await ctx.fs.writeFile(e.path, prev + e.text + "\n", { createDirs: true });

    if (e.path.endsWith("lore-log.md")) {
      const el = await ctx.ui.renderMarkdown(prev + e.text + "\n", "md");
      container.replaceChildren(el);
    }
  });

  // 🗂 Tabs
  const tabs = [
    { id: "about", label: "About", path: `${HOME}/about.md` },
    { id: "latest", label: "Latest", path: `${HOME}/latest.md` },
    { id: "lore", label: "Lore Log", path: `${HOME}/lore-log.md` },
  ];

  win.mount(
    createElement(window.PrimeTabsWindow, {
      fs: ctx.fs,
      title: "Prime Codex",
      icon: "fa-book",
      tabs,
    })
  );

  // 🚀 Default tab
  await open(`${HOME}/about.md`);
}
