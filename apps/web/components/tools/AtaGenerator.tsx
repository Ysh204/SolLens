"use client";

import { useMemo, useState } from "react";
import { useWasm } from "../../hooks/useWasm";
import { buildAtaExpression, deriveAtaFromEngine, type AtaResult } from "../../lib/solana/ata";
import { bytesToHex } from "../../lib/solana/bytes";
import {
  DecodeButton,
  ErrorBanner,
  ResultField,
  ToolInput,
  ToolPanel,
  ToolSection,
} from "./ToolPrimitives";

const EXAMPLE_WALLET = "11111111111111111111111111111111";
const EXAMPLE_MINT = "So11111111111111111111111111111111111111112";

export function AtaGenerator() {
  const { evaluate, isReady, loadError } = useWasm();
  const [wallet, setWallet] = useState(EXAMPLE_WALLET);
  const [mint, setMint] = useState(EXAMPLE_MINT);
  const [tokenProgram, setTokenProgram] = useState("");
  const [result, setResult] = useState<AtaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expressionPreview = useMemo(
    () => buildAtaExpression(wallet || "wallet", mint || "mint", tokenProgram || undefined),
    [wallet, mint, tokenProgram],
  );

  function handleDerive() {
    setError(null);
    if (!isReady) {
      setError(loadError ?? "Engine not ready");
      return;
    }
    try {
      setResult(
        deriveAtaFromEngine(
          (expr) => {
            const { result, error: evalError } = evaluate(expr);
            if (evalError) throw new Error(evalError.message);
            if (!result) throw new Error("No result from engine");
            return result;
          },
          wallet,
          mint,
          tokenProgram || undefined,
        ),
      );
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to derive ATA");
    }
  }

  return (
    <ToolPanel
      moduleTag="Module · ATA Generator"
      title="Associated Token Account"
      description="Derive the SPL associated token address for any wallet + mint pair."
    >
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Input">
          <ToolInput
            label="Wallet"
            value={wallet}
            onChange={setWallet}
            placeholder="Owner wallet public key"
          />
          <ToolInput
            label="Mint"
            value={mint}
            onChange={setMint}
            placeholder="Token mint public key"
          />
          <ToolInput
            label="Token Program (optional)"
            hint="Defaults to Tokenkeg…"
            value={tokenProgram}
            onChange={setTokenProgram}
            placeholder="TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          />
          <div className="tool-expression-preview">
            <span className="tool-field-label">Expression</span>
            <code>{expressionPreview}</code>
          </div>
          <DecodeButton onClick={handleDerive} label="Derive ATA" />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Output">
          {result ? (
            <>
              <ResultField label="ATA" value={result.ata} highlight />
              <ResultField label="Wallet" value={result.wallet} />
              <ResultField label="Mint" value={result.mint} />
              <ResultField label="Bytes" value={bytesToHex(result.bytes)} />
              <ResultField
                label="On Curve?"
                value={result.isOnCurve ? "Yes (unexpected for ATA)" : "No ✓"}
                copyable={false}
              />
              <div className="result-meta-grid">
                <div className="result-meta-item">
                  <span>Token Program</span>
                  <code>{result.tokenProgram}</code>
                </div>
                <div className="result-meta-item">
                  <span>ATA Program</span>
                  <code>{result.associatedTokenProgram}</code>
                </div>
              </div>
            </>
          ) : (
            <div className="tool-empty">Enter a wallet and mint, then derive.</div>
          )}
        </ToolSection>
      </div>

      {result && (
        <div className="ata-flow">
          <div className="ata-flow-node">Wallet<br /><code>{result.wallet.slice(0, 8)}…</code></div>
          <span className="ata-flow-plus">+</span>
          <div className="ata-flow-node">Mint<br /><code>{result.mint.slice(0, 8)}…</code></div>
          <span className="ata-flow-arrow">→</span>
          <div className="ata-flow-node ata-flow-node--result">
            ATA<br /><code>{result.ata.slice(0, 8)}…</code>
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
