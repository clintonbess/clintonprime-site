import { useState } from "react";
import { PrimeWindow } from "../components/prime-window";

export function ProgrammingWindow({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "projects" | "clintonprime" | "notes"
  >("projects");

  const tabs = [
    {
      key: "projects",
      name: "projects/index.ts",
      color: "text-monokai-blue",
      icon: "fa-code",
    },
    {
      key: "clintonprime",
      name: "clintonprime-site.tsx",
      color: "text-monokai-green",
      icon: "fa-terminal",
    },
    {
      key: "notes",
      name: "dev_notes.md",
      color: "text-monokai-purple",
      icon: "fa-book",
    },
  ];

  return (
    <PrimeWindow
      title="Programming Workspace"
      icon="fa-code"
      color="text-monokai-blue"
      onClose={onClose}
    >
      {/* Tab bar */}
      <div className="flex items-center space-x-2 border-b border-monokai-border pb-1 mb-3 text-xs font-mono">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as "projects" | "clintonprime" | "notes")
            }
            className={`px-3 py-1 rounded-t-md select-none ${
              activeTab === tab.key
                ? "bg-[#2e2e2e] text-monokai-fg border-t border-x border-monokai-border"
                : "text-monokai-fg2 hover:text-monokai-fg1 cursor-pointer"
            }`}
          >
            <i className={`fa-solid ${tab.icon} mr-1 text-[10px]`} />
            <span className={tab.color}>{tab.name}</span>
          </div>
        ))}
      </div>

      {/* PROJECTS INDEX */}
      {activeTab === "projects" && (
        <div className="font-mono space-y-2 text-sm">
          <div className="text-monokai-green">// Active Projects</div>

          <div className="text-monokai-fg">
            ▸ <span className="text-monokai-blue">project-neo/</span> — Quantum
            Space
          </div>

          <div className="text-monokai-fg">
            ▸ <span className="text-monokai-blue">foxpro-to-nodejs/</span> — Day
            Job
          </div>

          <div className="text-monokai-fg">
            ▸ <span className="text-monokai-blue">clintonprime-site/</span> —
            Prime Desktop Interface
          </div>
        </div>
      )}

      {/* CLINTONPRIME-SITE TAB */}
      {activeTab === "clintonprime" && (
        <div className="font-mono text-sm space-y-2">
          <div className="text-monokai-green">// clintonprime-site summary</div>
          <p className="text-monokai-fg1/90 leading-relaxed">
            The public-facing digital desktop of ClintonPrime — a live Monokai
            environment blending code, music, and identity. Deployed at{" "}
            <a
              href="https://dev.clintonprime.com"
              target="_blank"
              rel="noreferrer"
              className="text-monokai-blue hover:text-monokai-green transition-colors"
            >
              dev.clintonprime.com
            </a>
            .
          </p>

          <div className="text-monokai-fg2 italic text-xs">
            // Components: PrimeWindow, QuantumWorkspace, MusicWindow, Readme,
            Lore Log
          </div>

          <div className="border-t border-monokai-border pt-2 text-monokai-fg1 space-y-1">
            <p>
              <span className="text-monokai-yellow">Build System:</span> Vite +
              React + Tailwind
            </p>
            <p>
              <span className="text-monokai-yellow">Deploy:</span> PM2 + nginx +
              GitHub Actions
            </p>
            <p>
              <span className="text-monokai-yellow">Theme:</span> Monokai +
              Neon-glass aesthetic
            </p>
            <p>
              <span className="text-monokai-yellow">Purpose:</span> bridge art,
              code, and personality — a live portfolio OS.
            </p>
          </div>
        </div>
      )}

      {/* DEV NOTES TAB */}
      {activeTab === "notes" && (
        <div className="font-mono text-sm leading-relaxed space-y-2 text-monokai-fg1 px-1">
          <div className="text-monokai-purple font-bold"># dev_notes.md</div>

          <p>
            - Refactor shared tab bar to{" "}
            <span className="text-monokai-green">useTabBar()</span> utility
            (consistent across all windows). - Prepare{" "}
            <span className="text-monokai-cyan">NeoMCP</span> spec for
            integration. - Add{" "}
            <span className="text-monokai-blue">aura_mix.js</span> to
            MusicWindow for dream-generated playlists. - Continue lore entries
            in README.md after each major merge.
          </p>

          <div className="border-t border-monokai-border pt-2 text-monokai-fg2 text-xs italic">
            // “Every project is a node in the Prime network. Every commit, a
            pulse in the dream.”
          </div>
        </div>
      )}
    </PrimeWindow>
  );
}
