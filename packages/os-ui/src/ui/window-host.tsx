import React from "react";
import { PrimeWindow } from "../ui/prime-window";
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

  const WindowShell: React.FC<{
    title: string;
    onClose: () => void;
  }> = ({ title, onClose }) => {
    const [node, setNode] = React.useState<React.ReactNode>(null);
    const [t, setTitle] = React.useState(title);

    React.useEffect(() => {
      const api: UIWindow = {
        mount(node: React.ReactNode | HTMLElement) {
          // If it's an actual HTMLElement, wrap it in a host container
          if (node instanceof HTMLElement) {
            setNode(
              React.createElement("div", {
                ref: (r) => r && r.appendChild(node),
              })
            );
          } else if (typeof node === "string" && window[Number(node)]) {
            const Comp = window[node as keyof typeof window];
            setNode(React.createElement(Comp));
          } else if (node instanceof HTMLElement) {
            setNode(
              React.createElement("div", {
                ref: (r) => r && r.appendChild(node),
              })
            );
          } else {
            setNode(node);
          }
        },
        setTitle(title) {
          setTitle(title);
        },
        focus() {},
        close() {
          onClose?.();
        },
      };
      readyResolve(api); // ✅ signal that mount() is now safe
    }, [onClose]);

    return (
      <div style={{ pointerEvents: "auto" }}>
        <WindowLayoutProvider initial={{ width: 760, height: 440 }}>
          <PrimeWindow title={t} icon="fa-window-maximize" onClose={onClose}>
            {node}
          </PrimeWindow>
        </WindowLayoutProvider>
      </div>
    );
  };

  return { WindowShell, ready };
}
