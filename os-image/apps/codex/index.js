const { createElement } = window.React;

export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Prime Codex" });
  // 1) Ensure target folder
  const HOME = "/home/codex";
  if (!(await ctx.fs.exists(HOME)))
    await ctx.fs.mkdir(HOME, { recursive: true });

  // 2) Seed once (idempotent)
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

  async function open(path) {
    const txt = await ctx.fs.readFile(path, { encoding: "utf8" });
    // viewer.textContent = txt;
    win.setTitle(`Prime Codex — ${path.split("/").pop()}`);
  }

  // Optional: respond to log appends sent by other parts of the OS
  ctx.bus.on("log.append", async (e) => {
    if (!e.path.startsWith(HOME + "/")) return;
    const prev =
      (await ctx.fs.readFile(e.path, { encoding: "utf8" }).catch(() => "")) ||
      "";
    await ctx.fs.writeFile(e.path, prev + e.text + "\n", { createDirs: true });
    if (win) viewer.textContent = prev + e.text + "\n";
  });

  const tabs = [
    { id: "about", label: "About", path: `${HOME}/about.md` },
    { id: "latest", label: "Latest", path: `${HOME}/latest.md` },
    { id: "lore", label: "Lore Log", path: `${HOME}/lore-log.md` },
  ];

  win.mount(
    React.createElement(window.PrimeTabsWindow, {
      fs: ctx.fs,
      title: "Prime Codex",
      icon: "fa-book",
      tabs,
    })
  );

  // Open default tab on first show
  open(`${HOME}/about.md`);
}
