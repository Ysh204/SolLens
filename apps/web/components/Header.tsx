import { BookIcon, GithubIcon, StarIcon } from "./icons";
import { DOCS_URL, GITHUB_URL } from "../lib/constants";

export function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="header-title">SolLens</h1>
        <span className="version-badge">v1.0.0</span>
      </div>

      <div className="header-actions">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="header-icon-btn"
          aria-label="GitHub"
        >
          <GithubIcon size={20} />
        </a>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="header-text-btn"
        >
          <BookIcon size={16} />
          Docs
        </a>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="header-primary-btn"
        >
          <StarIcon />
          Star on GitHub
        </a>
      </div>
    </header>
  );
}
