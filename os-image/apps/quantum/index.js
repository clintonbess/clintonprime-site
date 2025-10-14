export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Quantum Reality" });
  win.mount("inside jokes coming from /system/apps/quantum/*.md");
}
