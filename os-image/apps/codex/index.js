export default async function boot(ctx) {
  const win = ctx.ui.openWindow({ title: "Prime Codex" });
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

  // 3) Super-simple UI for now (tab buttons, render markdown as plain text)
  const root = document.createElement("div");
  root.style.fontFamily = "ui-monospace, monospace";
  win.mount(root);

  function button(label, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.marginRight = "8px";
    b.onclick = onClick;
    return b;
  }

  const tabs = document.createElement("div");
  tabs.style.marginBottom = "12px";
  tabs.append(
    button("About", () => open(`${HOME}/about.md`)),
    button("Latest", () => open(`${HOME}/latest.md`)),
    button("Lore Log", () => open(`${HOME}/lore-log.md`))
  );

  const viewer = document.createElement("pre"); // MVP: plain text
  viewer.style.whiteSpace = "pre-wrap";
  viewer.style.lineHeight = "1.5";
  root.append(tabs, viewer);

  async function open(path) {
    const txt = await ctx.fs.readFile(path, { encoding: "utf8" });
    viewer.textContent = txt;
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

  // Open default tab on first show
  open(`${HOME}/about.md`);
}
