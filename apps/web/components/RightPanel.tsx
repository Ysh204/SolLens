"use client";

import type { ModuleId } from "../lib/types";
import { TOOL_ITEMS } from "../lib/constants";
import { ChevronRightIcon, NavIcon } from "./icons";
import { NetworkStatus } from "./NetworkStatus";

interface RightPanelProps {
  onToolSelect: (id: ModuleId) => void;
}

export function RightPanel({ onToolSelect }: RightPanelProps) {
  return (
    <aside className="right-panel">
      <span className="sidebar-label">Coming Soon</span>
      <div className="tool-cards">
        {TOOL_ITEMS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="tool-card tool-card--soon"
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
