import type { ModuleId } from "../lib/types";
import { NAV_ITEMS } from "../lib/constants";
import { CrownIcon, DiscordIcon, MailIcon, NavIcon, XIcon } from "./icons";

interface SidebarProps {
  activeModule: ModuleId;
  onSelect: (id: ModuleId) => void;
}

const LIVE_MODULES: ModuleId[] = ["terminal", "pda-generator", "spl-token", "data-decoder"];

export function Sidebar({ activeModule, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <span className="sidebar-label">Toolkit</span>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeModule === item.id ? "active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <NavIcon name={item.icon} className="nav-icon" size={16} />
              <span>{item.label}</span>
              {LIVE_MODULES.includes(item.id) && (
                <span className="nav-live-badge">Live</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="pro-card">
          <div className="pro-card-header">
            <CrownIcon className="pro-icon" size={16} />
            <span className="pro-title">SolLens Pro</span>
          </div>
          <p className="pro-desc">Advanced tools, AI debugger & workspace sync</p>
          <button type="button" className="pro-upgrade-btn">
            Upgrade Now
            <span aria-hidden>→</span>
          </button>
        </div>

        <div className="sidebar-socials">
          <a href="https://discord.gg/3KRHKdk8eQ" className="social-link" aria-label="Discord">
            <DiscordIcon />
          </a>
          <a href="https://x.com/RixTick" className="social-link" aria-label="X">
            <XIcon />
          </a>
          <a href="yashgaikwad415002@gmail.com" className="social-link" aria-label="Email">
            <MailIcon />
          </a>
        </div>
        <p className="sidebar-copyright">© {new Date().getFullYear()} SolLens</p>
      </div>
    </aside>  
  );
}
