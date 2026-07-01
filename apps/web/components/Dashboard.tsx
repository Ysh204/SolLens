"use client";

import { useState } from "react";
import type { ModuleId } from "../lib/types";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { ComingSoon, Terminal } from "./Terminal";

export function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleId>("terminal");

  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-body">
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} />

        <div className="main-column">
          <main className="main-content">
            {activeModule === "terminal" ? (
              <Terminal isActive />
            ) : (
              <ComingSoon moduleId={activeModule} />
            )}
          </main>
          <Footer />
        </div>

        <RightPanel onToolSelect={setActiveModule} />
      </div>
    </div>
  );
}
