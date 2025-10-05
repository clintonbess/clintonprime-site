import { WindowLayoutProvider } from "../context/window-layout-context";
import { DesktopEnvironment } from "../components/desktop-environment";
import { BootSequence } from "../components/boot-sequence";

export default function IndexPage() {
  return (
    <WindowLayoutProvider>
      <BootSequence />
      <DesktopEnvironment />
    </WindowLayoutProvider>
  );
}
