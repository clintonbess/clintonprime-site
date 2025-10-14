import React from "react";
import { WindowLayoutProvider } from "../context/window-layout-context";

export interface UIWindow {
  mount(node: React.ReactNode): void;
  setTitle(title: string): void;
  focus(): void;
  close(): void;
}

export function createWindowHost() {
  // We’ll fulfill this promise once WindowShell has mounted.
  let readyResolve: (api: UIWindow) => void;
  const ready = new Promise<UIWindow>((r) => (readyResolve = r));
  let resolved = false;

  const WindowShell: React.FC<{
    title: string;
    onClose: () => void;
  }> = ({ title, onClose }) => {
    const [node, setNode] = React.useState<React.ReactNode>(null);
    const [t, setT] = React.useState(title);

    React.useEffect(() => {
      const api: UIWindow = {
        mount(n: React.ReactNode | HTMLElement | string) {
          if (n instanceof HTMLElement) {
            setNode(
              React.createElement("div", {
                ref: (r) => r && r.appendChild(n),
              })
            );
          } else if (typeof n === "string" && n in window) {
            const Comp = (window as any)[n];
            setNode(typeof Comp === "function" ? React.createElement(Comp) : n);
          } else {
            setNode(n as React.ReactNode);
          }
        },
        setTitle(next) {
          setT(next);
        },
        focus() {},
        close() {
          onClose?.();
        },
      };
      if (!resolved) {
        resolved = true;
        readyResolve(api); // ✅ signal that mount() is now safe
      }
    }, [onClose]);

    const injected = React.isValidElement(node)
      ? React.cloneElement(node as any, { title: t, onClose })
      : node;

    return (
      <div style={{ pointerEvents: "auto" }}>
        <WindowLayoutProvider initial={{ width: 760, height: 440 }}>
          {injected}
        </WindowLayoutProvider>
      </div>
    );
  };

  return { WindowShell, ready };
}
