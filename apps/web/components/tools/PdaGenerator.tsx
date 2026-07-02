"use client";

import { useMemo, useState } from "react";
import { useWasm } from "../../hooks/useWasm";
import { buildPdaExpression, derivePdaFromEngine, type PdaResult } from "../../lib/solana/pda";
import { bytesToHex } from "../../lib/solana/bytes";
import {
  DecodeButton,
  ErrorBanner,
  ResultField,
  ToolInput,
  ToolPanel,
  ToolSection,
  ToolTextarea,
} from "./ToolPrimitives";
import { SeedVisualizer } from "./SeedVisualizer";

const EXAMPLE_SEEDS = '["vault", "11111111111111111111111111111111"]';
const EXAMPLE_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export function PdaGenerator() {
  const { evaluate, isReady, loadError } = useWasm();
  const [seeds, setSeeds] = useState(EXAMPLE_SEEDS);
  const [programId, setProgramId] = useState(EXAMPLE_PROGRAM);
  const [result, setResult] = useState<PdaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expressionPreview = useMemo(
    () => buildPdaExpression(seeds, programId || "program"),
    [seeds, programId],
  );

  function handleDerive() {
    setError(null);
    if (!isReady) {
      setError(loadError ?? "Engine not ready");
      return;
    }
    try {
      setResult(derivePdaFromEngine((expr) => {
        const { result, error: evalError } = evaluate(expr);
        if (evalError) throw new Error(evalError.message);
        if (!result) throw new Error("No result from engine");
        return result;
      }, seeds, programId));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to derive PDA");
    }
  }

  return (
    <ToolPanel
      moduleTag="Module · PDA Generator"
      title="Program Derived Address"
      description='Derive PDAs from seeds and a program ID — pda(["vault"], "program")'
    >
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Input">
          <ToolTextarea
            label="Seeds"
            hint="JSON array or one seed per line — UTF-8 strings, pubkeys, or 0x hex bytes"
            value={seeds}
            onChange={setSeeds}
            placeholder='["vault", "11111111111111111111111111111111"]'
            rows={5}
          />
          <ToolInput
            label="Program ID"
            value={programId}
            onChange={setProgramId}
            placeholder="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          />
          <div className="tool-expression-preview">
            <span className="tool-field-label">Expression</span>
            <code>{expressionPreview}</code>
          </div>
          <DecodeButton onClick={handleDerive} label="Derive PDA" />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Output">
          {result ? (
            <>
              <ResultField label="PDA" value={result.pda} highlight />
              <ResultField label="Bump" value={String(result.bump)} copyable={false} />
              <ResultField label="Bytes" value={bytesToHex(result.bytes)} />
              <div className="result-seeds-list">
                <span className="result-field-label">Seeds</span>
                {result.seeds.map((seed, i) => (
                  <div key={i} className="result-seed-row">
                    <span className="result-seed-index">{i + 1}</span>
                    <span className="result-seed-kind">{seed.kind}</span>
                    <code>{seed.raw}</code>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="tool-empty">Enter seeds and a program ID, then derive.</div>
          )}
        </ToolSection>
      </div>

      {result && (
        <SeedVisualizer
          seeds={result.seeds}
          programId={programId}
          pda={result.pda}
          bump={result.bump}
          pdaBytes={result.bytes}
        />
      )}
    </ToolPanel>
  );
}
