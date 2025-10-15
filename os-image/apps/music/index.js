const { useState, useEffect } = React;

export default async function boot({ fs, ui, bus }) {
  const win = await ui.openWindow({ title: "Music" });

  function App() {
    const [files, setFiles] = useState([]);
    const [current, setCurrent] = useState(null);

    useEffect(() => {
      (async () => {
        const list = await fs.readdir("/music");
        setFiles(list.filter((f) => f.endsWith(".mp3") || f.endsWith(".wav")));
      })();
    }, []);

    const play = async (name) => {
      const blob = await fs.readFile(`/music/${name}`);
      const url = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
      setCurrent(url);
    };

    const borrow = async (name) => {
      const blob = await fs.readFile(`/music/${name}`);
      const url = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      bus.emit({ type: "os.download", path: `/music/${name}` });
    };

    return React.createElement(
      "div",
      { className: "flex flex-col space-y-3" },
      React.createElement(
        "div",
        { className: "font-mono text-monokai-green text-sm opacity-80" },
        `Tracks (${files.length})`
      ),
      React.createElement(
        "div",
        { className: "space-y-2" },
        files.map((name) =>
          React.createElement(
            "div",
            {
              key: name,
              className:
                "flex items-center justify-between border border-white/10 rounded-md px-3 py-2 hover:bg-white/5 transition cursor-pointer",
              onDoubleClick: () => play(name),
            },
            React.createElement("span", { className: "truncate" }, name),
            React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  borrow(name);
                },
                className: "text-monokai-blue hover:text-monokai-green text-xs",
              },
              "Borrow"
            )
          )
        )
      ),
      current &&
        React.createElement("audio", {
          className: "mt-3 w-full",
          src: current,
          controls: true,
          autoPlay: true,
          onEnded: () => setCurrent(null),
        })
    );
  }

  win.mount(
    React.createElement(
      window.PrimeTabsWindow,
      { icon: "fa-music" },
      React.createElement(App)
    )
  );
}
