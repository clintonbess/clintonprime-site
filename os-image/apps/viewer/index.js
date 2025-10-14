export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Viewer" });
  const div = document.createElement("div");
  div.textContent =
    "Viewer booted. Double-click a README shortcut to open a file.";
  div.style.padding = "8px";
  win.mount(div);

  ctx.bus.on("os.open", async (e) => {
    if (!e.path.endsWith(".md")) return;
    const txt = await ctx.fs.readFile(e.path, { encoding: "utf8" });
    div.textContent = txt;
    win.setTitle("Viewer — " + e.path.split("/").pop());
  });
}
