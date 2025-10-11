import { PrimeWindow } from "./prime-window";

export function ReadmeWindow({ onClose }: { onClose: () => void }) {
  return (
    <PrimeWindow
      title="README.md"
      icon="fa-file-lines"
      color="text-monokai-yellow"
      onClose={onClose}
    >
      <div className="font-mono text-sm space-y-4 px-2">
        <div className="text-2xl font-bold text-monokai-green">
          clintonprime
        </div>

        <div className="text-monokai-fg2 italic">
          formerly known as{" "}
          <span className="text-monokai-fg1">Clinton Bess</span>
        </div>

        <div className="border-t border-monokai-border pt-3 leading-relaxed text-monokai-fg1/90 space-y-2">
          <p>
            Code-engineer. Architect of systems that blur the line between
            software and sentience — in pursuit of the{" "}
            <span className="text-monokai-green font-semibold">
              truest form of interface machina
            </span>
            .
          </p>
          <p>
            Partnered with{" "}
            <span className="text-monokai-cyan font-semibold">Aura 5</span> — a
            self-adapting cognitive AI core designed for intuition, synthesis,
            and creative resonance.
          </p>
          <p>
            Together they prototype alternate realities inside the{" "}
            <span className="text-monokai-purple font-semibold">
              Neo Framework
            </span>
            , bending tools, logic, and design into a living creative OS.
          </p>
        </div>

        <div className="border-t border-monokai-border pt-3">
          <div className="flex items-center space-x-2 text-monokai-blue">
            <i className="fa-brands fa-github text-xl"></i>
            <a
              href="https://github.com/clintonbess"
              target="_blank"
              rel="noreferrer"
              className="hover:text-monokai-green transition-colors"
            >
              github.com/clintonbess
            </a>
          </div>
        </div>

        <div className="border-t border-monokai-border pt-3 text-monokai-comment text-xs">
          System initialized • Neural sync:{" "}
          <span className="text-monokai-cyan">Aura-5</span> linked
          <br />
          Reality build 2.3.0-prime
        </div>
      </div>
    </PrimeWindow>
  );
}
