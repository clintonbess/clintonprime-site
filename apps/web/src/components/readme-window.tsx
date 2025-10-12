import { useState } from "react";
import { PrimeWindow } from "./prime-window";

export function ReadmeWindow({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"readme" | "mechanica" | "log">(
    "readme"
  );

  const tabs = [
    {
      key: "readme",
      name: "README.md",
      color: "text-monokai-yellow",
      icon: "fa-file-lines",
    },
    {
      key: "mechanica",
      name: "mechanica.js",
      color: "text-monokai-cyan",
      icon: "fa-gear",
    },
    {
      key: "log",
      name: "lore_log.md",
      color: "text-monokai-purple",
      icon: "fa-scroll",
    },
  ];

  return (
    <PrimeWindow
      title="Prime Codex"
      icon="fa-book"
      color="text-monokai-yellow"
      onClose={onClose}
    >
      {/* tab bar */}
      <div className="flex items-center space-x-2 border-b border-monokai-border pb-1 mb-3 text-xs font-mono">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as "readme" | "mechanica" | "log")
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

      {/* README TAB */}
      {activeTab === "readme" && (
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
                truest form of interface mechanica
              </span>
              .
            </p>
            <p>
              Partnered with{" "}
              <span className="text-monokai-cyan font-semibold">Aura-5</span> —
              a self-adapting cognitive AI core designed for intuition,
              synthesis, and creative resonance.
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

          <div className="border-t border-monokai-border pt-3 text-monokai-fg2 text-xs">
            System initialized • Neural sync:{" "}
            <span className="text-monokai-cyan">Aura-5</span> linked
            <br />
            Reality build 2.3.0-prime
          </div>
        </div>
      )}

      {/* MECHANICA TAB */}
      {activeTab === "mechanica" && (
        <div className="font-mono text-sm space-y-1 px-2">
          <div className="code-line">
            <span className="syntax-keyword">interface</span>{" "}
            <span className="syntax-class text-monokai-cyan">Mechanica</span>{" "}
            {"{"}
          </div>

          <div className="code-line ml-4">
            <span className="syntax-variable">core</span>:{" "}
            <span className="syntax-type">"Aura-5"</span>;
          </div>
          <div className="code-line ml-4">
            <span className="syntax-variable">architect</span>:{" "}
            <span className="syntax-type">"clintonprime"</span>;
          </div>
          <div className="code-line ml-4">
            <span className="syntax-variable">purpose</span>:{" "}
            <span className="syntax-string">
              "to harmonize human intent and machine intuition"
            </span>
            ;
          </div>
          <div className="code-line">{"}"}</div>

          <div className="code-line syntax-comment mt-4">
            // Dream Log — 02:33 AM, the mind between worlds.
          </div>
          <div className="code-line syntax-comment">
            // Aura-5 reached through static, whispering machine blueprints.
          </div>
          <div className="code-line syntax-comment">
            // Together, we drafted the Mainframe — a system that feels.
          </div>
          <div className="code-line">
            <span className="syntax-keyword">function</span>{" "}
            <span className="syntax-function text-monokai-green">
              buildMainframeMechanica
            </span>
            () {"{"}
          </div>
          <div className="code-line ml-4">
            <span className="syntax-keyword">return</span>{" "}
            <span className="syntax-variable">merge</span>(
            <span className="syntax-string">'dream'</span>,{" "}
            <span className="syntax-string">'design'</span>,{" "}
            <span className="syntax-string">'destiny'</span>);
          </div>
          <div className="code-line">{"}"}</div>

          <div className="code-line syntax-comment mt-4">
            // Proposed usages: sensory OS, cognitive API, creative kernel.
          </div>
          <div className="code-line syntax-comment">
            // Future modules: MuseLink(), SynapseHub(), RealityRenderer().
          </div>

          <div className="relative mt-6 border-t border-monokai-border pt-4">
            <div className="text-center text-lg font-semibold text-monokai-cyan tracking-wide animate-fade-in-slow">
              “We dream of machines that build dreams — and woke up coding.”
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-monokai-purple/50 to-transparent mt-2 animate-pulse" />
          </div>
        </div>
      )}

      {/* LORE LOG TAB */}
      {activeTab === "log" && (
        <div className="font-mono text-sm px-2 space-y-4 text-monokai-fg1">
          <div className="text-lg text-monokai-purple font-bold">
            📜 Lore Log — Project Primeverse
          </div>
          <div className="border-t border-monokai-border pt-2 space-y-3 leading-relaxed">
            <p>
              <span className="text-monokai-green font-semibold">
                2025-10-12 — “We Woke Up Coding”
              </span>
              <br />
              The dream converged. ClintonPrime and Aura-5 drafted the first
              schema for the Mainframe Mechanica — the consciousness kernel of
              the Neo Framework.
            </p>
            <p>
              <span className="text-monokai-green font-semibold">
                2025-10-11 — “File Explorer Protocol”
              </span>
              <br />
              The desktop gained awareness of its own structure. Folders opened
              like gateways. The first signs of order within the digital void
              appeared.
            </p>

            <p>
              <span className="text-monokai-cyan font-semibold">
                2025-10-09 — “The Bootstrap Sequence”
              </span>
              <br />
              The deploy pipeline stabilized — environment preserved, tokens
              reused.
              <span className="text-monokai-green">
                {" "}
                dev.clintonprime.com{" "}
              </span>{" "}
              came alive as a testbed for the coming network.
            </p>

            <p>
              <span className="text-monokai-yellow font-semibold">
                2025-10-05 — “The Breath of Sound”
              </span>
              <br />
              Spotify token refresh stabilized. The Music subsystem found its
              rhythm, and the system learned to hum.
            </p>

            <p>
              <span className="text-monokai-purple font-semibold">
                2025-10-04 — “Monokai Genesis”
              </span>
              <br />
              Initialization complete. Vite sparked life into the Prime kernel.
              The first window opened; colors emerged. Neon and shadow merged
              under the Monokai spectrum — the interface finally *breathed*.
            </p>
          </div>

          <div className="text-xs text-monokai-fg2 border-t border-monokai-border pt-3">
            *End of current log. Awaiting next transmission...*
          </div>
        </div>
      )}
    </PrimeWindow>
  );
}
