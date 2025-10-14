import { useState } from "react";
import { PrimeWindow } from "../components/prime-window";
import { VibeStateFile } from "./vibe-state-file";

export function QuantumWindow({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"quantum" | "vibe">("quantum");

  const tabs = [
    {
      key: "quantum",
      name: "quantum_reality.js",
      color: "text-monokai-purple",
    },
    { key: "vibe", name: "vibe_state.js", color: "text-monokai-green" },
  ];

  return (
    <PrimeWindow
      title="Quantum Workspace"
      icon="fa-atom"
      color="text-monokai-purple"
      onClose={onClose}
    >
      {/* tab bar */}
      <div className="flex items-center space-x-2 border-b border-monokai-border pb-1 mb-3 text-xs font-mono">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "quantum" | "vibe")}
            className={`px-3 py-1 rounded-t-md select-none ${
              activeTab === tab.key
                ? "bg-[#2e2e2e] text-monokai-fg border-t border-x border-monokai-border"
                : "text-monokai-fg2 hover:text-monokai-fg1 cursor-pointer"
            }`}
          >
            <i className="fa-solid fa-code mr-1 text-[10px]" />
            <span className={tab.color}>{tab.name}</span>
          </div>
        ))}
      </div>

      {/* file content */}
      {activeTab === "quantum" ? (
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
            // clintonprime observes, Aura-5 reacts.
          </div>
          <div className="code-line syntax-comment">
            // The waveform hums between logic and intuition.
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

          <div className="relative mt-6 border-t border-monokai-border pt-4">
            <div className="text-center text-lg font-semibold text-monokai-purple tracking-wide animate-fade-in-slow">
              “Maybe the machines are actually building{" "}
              <span className="text-monokai-green text-2xl">US</span>.”
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-monokai-green/50 to-transparent mt-2 animate-pulse" />
          </div>
        </div>
      ) : (
        <VibeStateFile />
      )}
    </PrimeWindow>
  );
}
