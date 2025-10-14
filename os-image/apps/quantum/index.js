export default function boot(ctx) {
  const win = ctx.ui.openWindow({ title: "Quantum Reality" });
  win.mount("inside jokes coming from /system/apps/quantum/*.md");
}
