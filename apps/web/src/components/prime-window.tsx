import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import { useEffect } from "react";
import { useWindowLayout } from "../context/window-layout-context";

export function PrimeWindow({
  title,
  icon,
  color,
  onClose,
  children,
}: {
  title: string;
  icon: string;
  color?: string;
  onClose?: () => void;
  children?: ReactNode;
}) {
  const { layout, updateLayout, resetLayout } = useWindowLayout();

  useEffect(() => {
    if (layout.x === 0 && layout.y === 0) {
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      const centeredX = Math.max(0, winW / 2 - layout.width / 2);
      const centeredY = Math.max(0, winH / 2 - layout.height / 2 - 40);

      updateLayout({ x: centeredX, y: centeredY });
    }
  }, [layout.x, layout.y, layout.width, layout.height, updateLayout]);

  return (
    <Rnd
      bounds="window"
      size={{ width: layout.width, height: layout.height }}
      position={{ x: layout.x, y: layout.y }}
      onDragStop={(_e, d) => updateLayout({ x: d.x, y: d.y })}
      onResizeStop={(_e, _dir, ref, _delta, pos) =>
        updateLayout({
          x: pos.x,
          y: pos.y,
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        })
      }
      dragHandleClassName="window-drag"
      className="floating-element z-40"
    >
      <div className="glass-morphism neon-border rounded-lg shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="window-drag flex items-center justify-between p-3 border-b border-monokai-border cursor-move relative"
          style={{
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.25)", // subtle header shadow
            backgroundColor: "rgba(30, 30, 30, 0.5)", // faint tint for contrast
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center space-x-3">
            {/* traffic lights */}
            <div className="flex space-x-1">
              <button
                className="w-3 h-3 bg-monokai-red rounded-full glow-accent hover:scale-110 transition-transform"
                onClick={onClose}
                title="Close window"
              />
              <div className="w-3 h-3 bg-monokai-orange rounded-full glow-accent" />
              <div className="w-3 h-3 bg-monokai-green rounded-full glow-accent" />
            </div>

            <div className="flex items-center space-x-2 ml-1">
              <i
                className={`fa-solid ${icon} ${color ?? "text-monokai-green"}`}
              />
              <span className="text-monokai-fg text-sm">{title}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetLayout}
              className="text-monokai-blue hover:text-monokai-green transition-colors"
              title="Reset window position"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
            {onClose && (
              <button
                className="text-monokai-red hover:text-monokai-orange transition-colors"
                onClick={onClose}
                title="Close window"
              >
                <i className="fa-solid fa-times" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 text-monokai-fg1 font-mono text-sm bg-[var(--color-monokai-bg1)]/70">
          {children}
        </div>
      </div>
    </Rnd>
  );
}
