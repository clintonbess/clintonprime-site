import "./App.css";

import { BootSequence } from "./_archive/boot-sequence";
import { DesktopEnvironment } from "./components/desktop-environment";

export default function App() {
  return (
    <>
      <BootSequence />
      <DesktopEnvironment />
    </>
  );
}
