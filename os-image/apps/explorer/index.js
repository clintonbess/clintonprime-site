export default async function boot(ctx) {
  console.log("booting explorer");
  const win = await ctx.ui.openWindow({ title: "Explorer" });
  win.mount(
    React.createElement(
      window.PrimeTabsWindow,
      { icon: "fa-folder" },
      React.createElement("div", null, "basic FS listing (MVP) will go here")
    )
  );
}
