import React, { createContext, useContext, useState, useEffect } from "react";

export type WindowLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutContextType = {
  layout: WindowLayout;
  updateLayout: (partial: Partial<WindowLayout>) => void;
  resetLayout: () => void;
};

const defaultLayout: WindowLayout = {
  x: 120,
  y: 120,
  width: 800,
  height: 520,
};

const WindowLayoutContext = createContext<LayoutContextType>({
  layout: defaultLayout,
  updateLayout: () => {},
  resetLayout: () => {},
});

export function WindowLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [layout, setLayout] = useState<WindowLayout>(() => {
    try {
      const saved = localStorage.getItem("primeos-layout");
      return saved ? JSON.parse(saved) : defaultLayout;
    } catch {
      return defaultLayout;
    }
  });

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const sanitize = (l: WindowLayout): WindowLayout => {
    const maxW = window.innerWidth - 100;
    const maxH = window.innerHeight - 100;
    return {
      x: clamp(l.x, 0, maxW),
      y: clamp(l.y, 0, maxH),
      width: clamp(l.width, 400, window.innerWidth),
      height: clamp(l.height, 300, window.innerHeight),
    };
  };

  const updateLayout = (partial: Partial<WindowLayout>) => {
    setLayout((prev) => {
      const next = sanitize({ ...prev, ...partial });
      localStorage.setItem("primeos-layout", JSON.stringify(next));
      return next;
    });
  };

  const resetLayout = () => {
    localStorage.removeItem("primeos-layout");
    setLayout(defaultLayout);
  };

  // Ensure correction when viewport changes
  useEffect(() => {
    const handleResize = () => setLayout((l) => sanitize(l));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <WindowLayoutContext.Provider value={{ layout, updateLayout, resetLayout }}>
      {children}
    </WindowLayoutContext.Provider>
  );
}

export const useWindowLayout = () => useContext(WindowLayoutContext);
