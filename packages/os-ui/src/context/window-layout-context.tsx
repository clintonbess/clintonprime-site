import React from "react";

type Layout = { x: number; y: number; width: number; height: number };
type Ctx = {
  layout: Layout;
  updateLayout: (p: Partial<Layout>) => void;
  resetLayout: () => void;
};

const DEFAULT: Layout = { x: 0, y: 0, width: 720, height: 420 };
const WindowLayoutContext = React.createContext<Ctx | null>(null);

export function WindowLayoutProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<Layout>;
}) {
  const [layout, setLayout] = React.useState<Layout>({
    ...DEFAULT,
    ...initial,
  });
  const updateLayout = (p: Partial<Layout>) =>
    setLayout((cur) => ({ ...cur, ...p }));
  const resetLayout = () => setLayout({ ...DEFAULT, ...initial });

  const value = React.useMemo(
    () => ({ layout, updateLayout, resetLayout }),
    [layout]
  );
  return (
    <WindowLayoutContext.Provider value={value}>
      {children}
    </WindowLayoutContext.Provider>
  );
}

export function useWindowLayout(): Ctx {
  const ctx = React.useContext(WindowLayoutContext);
  if (!ctx) {
    throw new Error(
      "useWindowLayout must be used within <WindowLayoutProvider>"
    );
  }
  return ctx;
}
