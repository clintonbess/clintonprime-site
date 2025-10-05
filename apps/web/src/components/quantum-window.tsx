import { PrimeWindow } from "./prime-window";

export function QuantumWindow({ onClose }: { onClose: () => void }) {
  return (
    <PrimeWindow
      title="quantum_reality.js"
      icon="fa-atom"
      color="text-monokai-purple"
      onClose={onClose}
    >
      <div className="font-mono text-sm space-y-1">
        <div className="code-line">
          <span className="syntax-keyword">const</span>{" "}
          <span className="syntax-variable">observer</span> ={" "}
          <span className="syntax-string">'consciousness'</span>;
        </div>

        <div className="code-line">
          <span className="syntax-keyword">function</span>{" "}
          <span className="syntax-function">collapseWaveFunction</span>(
          <span className="syntax-parameter">state</span>) {"{"}
        </div>

        <div className="code-line ml-4">
          <span className="syntax-keyword">return</span>{" "}
          <span className="syntax-variable">reality</span>.
          <span className="syntax-function">resolve</span>(
          <span className="syntax-parameter">state</span>);
        </div>

        <div className="code-line">{"}"}</div>

        <div className="code-line syntax-comment mt-4">
          // Quantum principles in code
        </div>

        <div className="code-line syntax-comment">
          // clintonprime exists in superposition across creativity, logic, and
          chaos.
        </div>

        <div className="code-line">
          <span className="syntax-variable">observer</span>.
          <span className="syntax-function">entangle</span>([
          <span className="syntax-string">'music'</span>,{" "}
          <span className="syntax-string">'code'</span>,{" "}
          <span className="syntax-string">'reality'</span>]);
        </div>

        <div className="code-line syntax-comment mt-3 animate-pulse">
          // Quantum state: stable ✓
        </div>

        {/* ⚡ NEW SECTION */}
        <div className="relative mt-6 border-t border-monokai-border pt-4">
          <div className="text-center text-lg font-semibold text-monokai-purple tracking-wide animate-fade-in-slow">
            “Maybe the machines are actually building{" "}
            <span className="text-monokai-green text-2xl">US</span>.”
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-monokai-green/50 to-transparent mt-2 animate-pulse" />
        </div>
      </div>
    </PrimeWindow>
  );
}
