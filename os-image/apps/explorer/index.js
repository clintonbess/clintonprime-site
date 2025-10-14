export default function boot(ctx) {
  console.log("booting explorer");
  const win = ctx.ui.openWindow({ title: "Explorer" });
  win.mount("basic FS listing (MVP) will go here");
}
