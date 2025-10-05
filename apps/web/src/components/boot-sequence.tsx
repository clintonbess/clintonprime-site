// components/boot-sequence.tsx
import { useEffect, useState } from "react";

export function BootSequence() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 4200);
    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <div
      id="boot-sequence"
      className="fixed inset-0 flex items-center justify-center bg-[var(--color-monokai-bg3)] z-[9999] fade-out"
    >
      <div className="w-full max-w-3xl px-8 py-6 glass-morphism neon-border rounded-lg shadow-2xl font-mono">
        {/* Header lights */}
        <div className="flex items-center mb-4">
          <div className="w-3 h-3 bg-monokai-red rounded-full glow-accent mr-2"></div>
          <div
            className="w-3 h-3 bg-monokai-orange rounded-full glow-accent mr-2"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="w-3 h-3 bg-monokai-green rounded-full glow-accent"
            style={{ animationDelay: "1s" }}
          ></div>
          <span className="text-monokai-fg2 ml-4 text-sm">
            ClintonPrime Terminal v2.1
          </span>
        </div>

        {/* Boot log */}
        <div className="text-sm space-y-2 leading-relaxed">
          <div className="code-line">
            <span className="syntax-keyword">&gt;</span>{" "}
            <span className="syntax-function">initializing</span>(
            <span className="syntax-variable">clintonprime</span>
            <span className="syntax-operator">()</span>
            <span className="syntax-operator">...</span>
          </div>

          <div className="code-line">
            <span className="syntax-keyword">&gt;</span>{" "}
            <span className="syntax-function">loading</span>{" "}
            <span className="syntax-string">modules:</span>{" "}
            <span className="syntax-variable">programming</span>,{" "}
            <span className="syntax-variable">music</span>,{" "}
            <span className="syntax-variable">dota</span>,{" "}
            <span className="syntax-variable">skate</span>,{" "}
            <span className="syntax-variable">quantum</span>
          </div>

          <div className="code-line">
            <span className="syntax-keyword">&gt;</span>{" "}
            <span className="syntax-function">systemCheck</span>()
            <span className="syntax-operator"> → </span>
            <span className="syntax-string">'Quantum Field Stable'</span>
          </div>

          <div className="code-line">
            <span className="syntax-keyword">&gt;</span>{" "}
            <span className="syntax-comment">// Boot sequence complete</span>
          </div>

          <div className="syntax-green animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
}
