export {};

declare global {
  interface Window {
    React: typeof import("react");
    PrimeWindow?: any;
    PrimeTabsWindow?: any;
  }
}
