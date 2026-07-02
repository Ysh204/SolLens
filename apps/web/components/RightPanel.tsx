"use client";

import type { ModuleId } from "../lib/types";
import { LIVE_TOOL_ITEMS } from "../lib/constants";
import { ChevronRightIcon, NavIcon } from "./icons";
import { NetworkStatus } from "./NetworkStatus";

interface RightPanelProps {
  activeModule: ModuleId;
  onToolSelect: (id: ModuleId) => void;
}

export function RightPanel({ activeModule, onToolSelect }: RightPanelProps) {
  return (
    <aside className="right-panel">
      <span className="sidebar-label">Tools</span>
      <div className="tool-cards">
        {LIVE_TOOL_ITEMS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`tool-card ${activeModule === tool.id ? "tool-card--active" : ""}`}
            onClick={() => onToolSelect(tool.id)}
          >
            <div className="tool-card-icon">
              <NavIcon name={tool.icon} size={16} />
            </div>
            <div className="tool-card-body">
              <span className="tool-card-title">{tool.title}</span>
              <span className="tool-card-desc">{tool.description}</span>
            </div>
            <ChevronRightIcon className="tool-card-arrow" />
          </button>
        ))}
      </div>
      <NetworkStatus />
    </aside>
  );
}
