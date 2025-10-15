// /system/apps/explorer/index.js
// Read-only Explorer using PrimeWindow when available (with safe fallback)

export default async function boot(ctx) {
  const win = await ctx.ui.openWindow({
    title: "Explorer",
    icon: "fa-folder",
  });

  const React = window.React;
  const { useEffect, useMemo, useState } = React;

  // ---- PrimeWindow shim (prevents "Element type is invalid") ----
  // If the host hasn't exposed window.PrimeWindow, we fall back to a simple div shell.
  const PrimeWindowShim =
    window.PrimeWindow ||
    window.PrimeTabsWindow ||
    function PrimeWindowFallback(props) {
      return React.createElement(
        "div",
        {
          className:
            "h-full flex flex-col border border-monokai-border rounded-xl bg-card/70 backdrop-blur-sm",
        },
        // Simple header bar to mimic the chrome:
        React.createElement(
          "div",
          {
            className:
              "px-3 py-2 text-sm border-b border-monokai-border flex items-center justify-between",
          },
          React.createElement(
            "div",
            { className: "font-medium text-monokai-fg" },
            props.title || "Window"
          ),
          React.createElement(
            "button",
            {
              className:
                "text-xs px-2 py-1 rounded border border-monokai-border hover:bg-card transition-colors",
              onClick: props.onClose,
              title: "Close",
            },
            "✕"
          )
        ),
        React.createElement(
          "div",
          { className: "min-h-0 flex-1" },
          props.children
        )
      );
    };

  // ---- path helpers ----
  function joinPath(a, b) {
    if (!a || a === "/") return b?.startsWith("/") ? b : "/" + (b || "");
    if (!b) return a;
    const left = a.replace(/\/+$/g, "");
    const right = b.replace(/^\/+/g, "");
    return (left || "/") + "/" + right;
  }
  function dirname(p) {
    if (!p || p === "/") return "/";
    const parts = p.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }

  // Normalize fs.readdir outputs into [{name, type:'dir'|'file'}]
  async function safeReaddir(fs, path) {
    const entries = await fs.readdir(path);
    const toItem = async (ent) => {
      if (typeof ent === "string") {
        try {
          const st = await fs.stat(joinPath(path, ent));
          const isDir =
            st?.isDirectory?.() || st?.type === "dir" || st?.isDir === true;
          return { name: ent, type: isDir ? "dir" : "file" };
        } catch {
          return { name: ent, type: "file" };
        }
      }
      if (ent && typeof ent === "object") {
        const name = ent.name ?? ent.path ?? "";
        let type = ent.type;
        if (type !== "dir" && type !== "file") {
          try {
            const st = await fs.stat(joinPath(path, name));
            type = st?.isDirectory?.() ? "dir" : "file";
          } catch {
            type = "file";
          }
        }
        return { name, type: type === "dir" ? "dir" : "file" };
      }
      return null;
    };
    const out = await Promise.all((entries || []).map(toItem));
    return out.filter(Boolean);
  }

  function Breadcrumbs({ path, onNav }) {
    const parts = useMemo(() => {
      if (!path || path === "/") return [{ label: "root", full: "/" }];
      const segs = path.split("/").filter(Boolean);
      const acc = [];
      const out = [{ label: "root", full: "/" }];
      for (const s of segs) {
        acc.push(s);
        out.push({ label: s, full: "/" + acc.join("/") });
      }
      return out;
    }, [path]);

    return React.createElement(
      "div",
      {
        className:
          "flex flex-wrap items-center gap-1 text-xs md:text-sm text-monokai-fg1",
      },
      parts.map((p, i) =>
        React.createElement(
          React.Fragment,
          { key: p.full },
          React.createElement(
            "button",
            {
              className:
                "px-1.5 py-0.5 rounded hover:bg-[var(--color-monokai-card)] hover:text-monokai-green transition-colors",
              onClick: () => onNav(p.full),
            },
            p.label || "/"
          ),
          i < parts.length - 1 &&
            React.createElement("span", { className: "opacity-40 px-0.5" }, "›")
        )
      )
    );
  }

  function Row({ item, onOpen }) {
    const isDir = item.type === "dir";
    return React.createElement(
      "div",
      {
        className:
          "group flex items-center gap-3 px-3 py-2 rounded-md border border-transparent hover:border-monokai-border hover:bg-card/40 cursor-pointer transition-colors",
        onClick: () => isDir && onOpen(item.name),
        title: isDir ? "Open folder" : "File (read-only)",
      },
      React.createElement(
        "div",
        {
          className:
            "w-8 h-8 rounded-md flex items-center justify-center bg-[var(--color-monokai-bg1)] border border-monokai-border",
        },
        React.createElement("span", {
          className: `text-base ${
            isDir ? "text-monokai-blue" : "text-monokai-fg2"
          }`,
          children: isDir ? "📁" : "📄",
        })
      ),
      React.createElement(
        "div",
        { className: "flex flex-col min-w-0" },
        React.createElement(
          "div",
          { className: "truncate text-monokai-fg" },
          item.name
        ),
        React.createElement(
          "div",
          { className: "text-[11px] text-monokai-fg2" },
          isDir ? "Folder" : "File"
        )
      )
    );
  }

  function Explorer({ fs, startPath = "/home" }) {
    const [path, setPath] = useState(startPath);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    async function load(p) {
      setLoading(true);
      try {
        const list = await safeReaddir(fs, p);
        list.sort((a, b) => {
          if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        setItems(list);
      } catch (e) {
        console.error("[Explorer] read error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      load(path);
    }, [path]);

    const canUp = path !== "/";
    const goUp = () => setPath(dirname(path));
    const enter = (name) => setPath(joinPath(path, name));

    return React.createElement(
      PrimeWindowShim,
      {
        title: "Explorer",
        icon: "fa-folder",
        onClose: () => win.close(),
      },
      // Toolbar
      React.createElement(
        "div",
        {
          className:
            "flex items-center justify-between gap-3 px-3 py-2 border-b border-monokai-border bg-card/60 backdrop-blur-sm",
        },
        React.createElement(
          "div",
          { className: "flex items-center gap-2" },
          React.createElement(
            "button",
            {
              className:
                "text-xs px-2 py-1 rounded border border-monokai-border hover:bg-card transition-colors disabled:opacity-40",
              onClick: goUp,
              disabled: !canUp,
              title: "Up one level",
            },
            "↑ Up"
          ),
          React.createElement(
            "span",
            { className: "text-monokai-fg2 text-[11px]" },
            "Read-only"
          )
        ),
        React.createElement(
          "div",
          { className: "text-xs text-monokai-fg2 truncate max-w-[60%]" },
          path
        )
      ),

      // Breadcrumbs
      React.createElement(
        "div",
        { className: "px-3 py-2 border-b border-monokai-border" },
        React.createElement(Breadcrumbs, { path, onNav: setPath })
      ),

      // Body
      loading
        ? React.createElement(
            "div",
            { className: "p-6 text-monokai-fg2" },
            "Loading…"
          )
        : items.length === 0
        ? React.createElement(
            "div",
            {
              className:
                "m-6 p-6 rounded-xl border border-monokai-border bg-card/30 text-monokai-fg2 text-center",
            },
            "This folder is empty."
          )
        : React.createElement(
            "div",
            {
              className:
                "grid grid-cols-1 md:grid-cols-2 gap-2 p-3 overflow-auto",
              style: { minHeight: 0, maxHeight: "60vh" },
            },
            items.map((it) =>
              React.createElement(Row, {
                key: it.name + ":" + it.type,
                item: it,
                onOpen: enter,
              })
            )
          )
    );
  }

  // Mount once into the host window
  win.mount(
    React.createElement("div", { className: "h-full bg-transparent" }, [
      React.createElement(Explorer, {
        key: "expl",
        fs: ctx.fs,
        startPath: "/home",
      }),
    ])
  );

  // Optional: react to OS "open" events (folders only)
  ctx.bus.on("os.open", async (e) => {
    if (!e?.path) return;
    try {
      const st = await ctx.fs.stat(e.path);
      const isDir = st?.isDirectory?.() || st?.type === "dir";
      if (isDir) {
        win.mount(
          React.createElement("div", { className: "h-full bg-transparent" }, [
            React.createElement(Explorer, {
              key: "expl-" + e.path,
              fs: ctx.fs,
              startPath: e.path,
            }),
          ])
        );
        win.setTitle("Explorer — " + e.path);
      }
    } catch {}
  });
}
