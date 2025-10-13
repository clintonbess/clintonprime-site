import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import { useEffect, useRef } from "react";
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
  const centeredOnceRef = useRef(false);

  // one-time initial centering if x/y are 0 (your default)
  useEffect(() => {
    if (centeredOnceRef.current) return;
    if (layout.x === 0 && layout.y === 0) {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const centeredX = Math.max(0, winW / 2 - layout.width / 2);
      const centeredY = Math.max(0, winH / 2 - layout.height / 2 - 40);
      updateLayout({ x: centeredX, y: centeredY });
    }
    centeredOnceRef.current = true;
  }, [layout.x, layout.y, layout.width, layout.height, updateLayout]);

  return (
    <Rnd
      bounds="window"
      // CONTROLLED: no `default` + no `key` remounts
      position={{ x: layout.x, y: layout.y }}
      size={{ width: layout.width, height: layout.height }}
      onDragStop={(_e, d) => {
        updateLayout({ x: d.x, y: d.y });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const width = parseInt(ref.style.width, 10);
        const height = parseInt(ref.style.height, 10);
        updateLayout({ x: position.x, y: position.y, width, height });
      }}
      dragHandleClassName="window-drag"
      className="floating-element z-40 will-change-transform"
      style={{ transform: "translateZ(0)" }} // force GPU layer
    >
      <div className="rounded-md border border-white/10 h-full flex flex-col bg-[#262626]">
        {/* Header */}
        <div className="window-drag flex items-center justify-between p-3 cursor-move relative select-none border-b border-white/10 bg-[#2c2c2c]">
          {/* Left */}
          <div className="flex items-center space-x-3 z-10">
            <button
              className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#ff6666] to-[#b30000]
              shadow-[0_0_6px_rgba(255,0,0,0.5)]
              transition-all duration-150 ease-out
              hover:from-[#ff8080] hover:to-[#ff1a1a]
              hover:shadow-[0_0_10px_rgba(255,60,60,0.8)]
              active:scale-90"
              onClick={onClose}
              title="Close window"
            />
            <div className="flex items-center space-x-2 ml-1">
              <i
                className={`fa-solid ${icon} ${color ?? "text-monokai-green"}`}
              />
              <span className="text-monokai-fg text-sm font-medium tracking-wide">
                {title}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center space-x-2 z-10">
            <button
              onClick={resetLayout}
              className="text-monokai-blue hover:text-monokai-green transition-colors"
              title="Reset window position"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 text-monokai-fg1 font-mono text-sm bg-[#232323] editor-scrollbar">
          {children}
        </div>
      </div>
    </Rnd>
  );
}
