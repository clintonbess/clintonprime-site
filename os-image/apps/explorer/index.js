export default async function boot(ctx) {
  console.log("booting explorer");
  const win = await ctx.ui.openWindow({ title: "Explorer" });
  win.mount("basic FS listing (MVP) will go here");
}
