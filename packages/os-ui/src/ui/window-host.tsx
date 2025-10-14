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
  let setNode: (n: React.ReactNode) => void = () => {};
  let setTitle: (t: string) => void = () => {};
  let closeRef: (() => void) | null = null;

  // NOTE: no fixed/inset wrappers here
  const WindowShell: React.FC<{ title: string; onClose: () => void }> = ({
    title,
    onClose,
  }) => {
    const [node, _setNode] = React.useState<React.ReactNode>(null);
    const [t, _setTitle] = React.useState(title);

    setNode = _setNode;
    setTitle = _setTitle;
    closeRef = onClose;

    React.useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // pointer-events:auto so it can be clicked inside the global layer
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

  const api: UIWindow = {
    mount(node) {
      setNode(node);
    },
    setTitle(title) {
      setTitle(title);
    },
    focus() {},
    close() {
      closeRef?.();
    },
  };

  return { WindowShell, api };
}
