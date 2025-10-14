export default async function boot(ctx) {
  const win = ctx.ui.openWindow({ title: "Music" });
  const root = document.createElement("div");
  win.mount(root);
  async function list() {
    const items = await ctx.fs.readdir("/music");
    root.innerHTML = "";
    for (const name of items) {
      if (!/\.(mp3|wav)$/i.test(name)) continue;
      const row = document.createElement("div");
      row.className = "flex justify-between py-1";
      const open = document.createElement("button");
      open.textContent = name;
      open.onclick = () => play(`/music/${name}`);
      const borrow = document.createElement("button");
      borrow.textContent = "Borrow";
      borrow.onclick = () => download(`/music/${name}`);
      row.append(open, borrow);
      root.append(row);
    }
  }
  async function play(p) {
    const bytes = await ctx.fs.readFile(p);
    const url = URL.createObjectURL(new Blob([bytes]));
    new Audio(url).play();
  }
  async function download(p) {
    const bytes = await ctx.fs.readFile(p);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes]));
    a.download = p.split("/").pop() || "track";
    a.click();
  }
  await list();
  ctx.bus.on("os.open", (e) => e.path.startsWith("/music/") && play(e.path));
}
