import { useEffect, useState } from "react";

type WindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function useWindowMemory(key: string, defaults: WindowState) {
  const [state, setState] = useState<WindowState>(() => {
    try {
      const saved = localStorage.getItem(`window-pos-${key}`);
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  });

  // persist changes
  useEffect(() => {
    localStorage.setItem(`window-pos-${key}`, JSON.stringify(state));
  }, [state, key]);

  return [state, setState] as const;
}
