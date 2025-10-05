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
          System generated at runtime. Reality version 2.1.3
        </div>
      </div>
    </PrimeWindow>
  );
}
