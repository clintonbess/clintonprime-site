import { PrimeWindow } from "./prime-window";

export function ProgrammingWindow({ onClose }: { onClose: () => void }) {
  return (
    <PrimeWindow
      title="projects/index.ts"
      icon="fa-code"
      color="text-monokai-blue"
      onClose={onClose}
    >
      <div className="font-mono space-y-2">
        <div className="text-monokai-green">// Active Projects</div>
        <div className="text-monokai-fg">
          ▸ <span className="text-monokai-blue">project-neo/</span> — Quantum
          Space
        </div>
        <div className="text-monokai-fg">
          ▸ <span className="text-monokai-blue">foxpro-to-nodejs/</span> — Day
          Job
        </div>
      </div>
    </PrimeWindow>
  );
}
