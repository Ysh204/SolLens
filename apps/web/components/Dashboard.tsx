"use client";

import { useState } from "react";
import type { ModuleId } from "../lib/types";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";
import { ComingSoon, Terminal } from "./Terminal";
import { PdaGenerator } from "./tools/PdaGenerator";
import { AtaGenerator } from "./tools/AtaGenerator";
import { DataPlayground } from "./tools/DataPlayground";

function ModuleContent({ moduleId }: { moduleId: ModuleId }) {
  switch (moduleId) {
    case "terminal":
      return <Terminal isActive />;
    case "pda-generator":
      return <PdaGenerator />;
    case "spl-token":
      return <AtaGenerator />;
    case "data-decoder":
      return <DataPlayground />;
    default:
      return <ComingSoon moduleId={moduleId} />;
  }
}

export function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleId>("terminal");

  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-body">
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} />

        <div className="main-column">
          <main className="main-content">
            <ModuleContent moduleId={activeModule} />
          </main>
          <Footer />
        </div>

        <RightPanel activeModule={activeModule} onToolSelect={setActiveModule} />
      </div>
    </div>
  );
}
