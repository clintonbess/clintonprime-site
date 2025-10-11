export function VibeStateFile() {
  return (
    <div className="font-mono text-sm space-y-1">
      <div className="code-line syntax-comment">// vibe_state.js</div>

      <div className="code-line">
        <span className="syntax-keyword">const</span>{" "}
        <span className="syntax-variable">vibe</span> ={" "}
        <span className="syntax-string">'resonant'</span>;
      </div>

      <div className="code-line">
        <span className="syntax-keyword">function</span>{" "}
        <span className="syntax-function">sustain</span>() {"{"}
      </div>

      <div className="code-line ml-4">
        <span className="syntax-function">tune</span>(
        <span className="syntax-string">'frequency_of_focus'</span>);
      </div>
      <div className="code-line ml-4">
        <span className="syntax-function">improvise</span>(
        <span className="syntax-string">'within chaos'</span>);
      </div>
      <div className="code-line ml-4">
        <span className="syntax-function">loop</span>(
        <span className="syntax-string">'until groove achieved'</span>);
      </div>

      <div className="code-line">{"}"}</div>

      <div className="code-line syntax-comment mt-3 animate-pulse">
        // current vibe: quantum improv ✨
      </div>
    </div>
  );
}
