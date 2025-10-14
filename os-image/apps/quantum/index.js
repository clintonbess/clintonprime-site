export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({ title: "Quantum Reality" });
  win.mount(
    React.createElement(
      window.PrimeTabsWindow,
      { icon: "fa-atom" },
      React.createElement(
        "div",
        null,
        "inside jokes coming from /system/apps/quantum/*.md"
      )
    )
  );
}
