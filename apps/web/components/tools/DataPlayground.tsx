"use client";

import { useState } from "react";
import {
  decodeAccountData,
  type AccountDecodeMode,
  type AccountDecodeResult,
} from "../../lib/solana/decode/account";
import {
  decodeInstructionData,
  type InstructionDecodeResult,
  normalizeInstructionInput,
} from "../../lib/solana/decode/instruction";
import {
  decodeTransaction,
  formatLamports,
  formatTimestamp,
  type TransactionDecodeResult,
} from "../../lib/solana/decode/transaction";
import {
  decodeEventLogs,
  EXAMPLE_BORSH_SCHEMA,
  EXAMPLE_EVENT_LOGS,
  EXAMPLE_INSTRUCTION_HEX,
  type EventDecodeResult,
} from "../../lib/solana/decode/events";
import {
  DecodeButton,
  ErrorBanner,
  ResultField,
  TabBar,
  ToolInput,
  ToolPanel,
  ToolSection,
  ToolTextarea,
} from "./ToolPrimitives";

type DecoderTab = "account" | "instruction" | "transaction" | "events";

const TABS: Array<{ id: DecoderTab; label: string }> = [
  { id: "account", label: "Account" },
  { id: "instruction", label: "Instruction" },
  { id: "transaction", label: "Transaction" },
  { id: "events", label: "Events" },
];

export function DataPlayground() {
  const [tab, setTab] = useState<DecoderTab>("account");

  return (
    <ToolPanel
      moduleTag="Phase 4 · Data Playground"
      title="Data Playground"
      description="Paste account data, instruction bytes, transaction signatures, or program logs — decode in one place."
    >
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "account" && <AccountDecoderTab />}
      {tab === "instruction" && <InstructionDecoderTab />}
      {tab === "transaction" && <TransactionDecoderTab />}
      {tab === "events" && <EventDecoderTab />}
    </ToolPanel>
  );
}

function AccountDecoderTab() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AccountDecodeMode>("anchor");
  const [schema, setSchema] = useState(EXAMPLE_BORSH_SCHEMA);
  const [result, setResult] = useState<AccountDecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDecode() {
    setLoading(true);
    setError(null);
    try {
      const decoded = await decodeAccountData(input, mode, mode === "borsh" ? schema : undefined);
      setResult(decoded);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Decode failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="decoder-tab">
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Paste Account Data">
          <ToolTextarea
            label="Account Data"
            hint="Base58 (from RPC) or hex (0x…)"
            value={input}
            onChange={setInput}
            placeholder="Paste raw account data…"
            rows={6}
          />
          <div className="mode-toggle">
            {(["anchor", "borsh", "raw"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`mode-toggle-btn ${mode === m ? "active" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "anchor" ? "Anchor" : m === "borsh" ? "Borsh" : "Raw bytes"}
              </button>
            ))}
          </div>
          {mode === "borsh" && (
            <ToolTextarea
              label="Borsh Schema (JSON)"
              hint='Array of { "name", "type" } — u8, u16, u32, u64, i64, bool, pubkey'
              value={schema}
              onChange={setSchema}
              rows={6}
            />
          )}
          <DecodeButton onClick={handleDecode} loading={loading} disabled={!input.trim()} />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Decoded">
          {result ? (
            <>
              <ResultField label="Length" value={`${result.byteLength} bytes`} copyable={false} />
              <ResultField label="Hex" value={result.hex} />
              {result.discriminator && (
                <>
                  <ResultField label="Discriminator" value={result.discriminator.hex} />
                  {result.discriminator.possibleAccount && (
                    <ResultField
                      label="Possible Account"
                      value={result.discriminator.possibleAccount}
                      highlight
                    />
                  )}
                </>
              )}
              {result.borsh && (
                <div className="borsh-fields">
                  <span className="result-field-label">Borsh Fields</span>
                  {result.borsh.error && <ErrorBanner message={result.borsh.error} />}
                  {result.borsh.fields.map((f) => (
                    <div key={`${f.name}-${f.offset}`} className="borsh-field-row">
                      <span className="borsh-field-name">{f.name}</span>
                      <span className="borsh-field-type">{f.type}</span>
                      <code>{f.value}</code>
                      <span className="borsh-field-offset">@{f.offset}</span>
                    </div>
                  ))}
                </div>
              )}
              {(mode === "raw" || mode === "anchor") && (
                <div className="hex-dump">
                  <span className="result-field-label">Hex Dump</span>
                  {result.dump.map((line) => (
                    <div key={line.offset} className="hex-dump-line">
                      <span className="hex-dump-offset">{line.offset.toString(16).padStart(4, "0")}</span>
                      <span className="hex-dump-hex">{line.hex}</span>
                      <span className="hex-dump-ascii">{line.ascii}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="tool-empty">Paste account data and decode.</div>
          )}
        </ToolSection>
      </div>
    </div>
  );
}

function InstructionDecoderTab() {
  const [input, setInput] = useState(EXAMPLE_INSTRUCTION_HEX);
  const [result, setResult] = useState<InstructionDecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDecode() {
    setLoading(true);
    setError(null);
    try {
      const normalized = normalizeInstructionInput(input);
      const decoded = await decodeInstructionData(normalized);
      setResult(decoded);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Decode failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="decoder-tab">
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Paste Instruction Data">
          <ToolTextarea
            label="Instruction Data"
            hint="Hex (0xa905…) or base64"
            value={input}
            onChange={setInput}
            placeholder="0xa9059cbb…"
            rows={4}
          />
          <DecodeButton onClick={handleDecode} loading={loading} disabled={!input.trim()} />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Arguments">
          {result ? (
            <>
              <ResultField label="Length" value={`${result.byteLength} bytes`} copyable={false} />
              <ResultField label="Full Hex" value={result.hex} />
              {result.discriminator && (
                <>
                  <ResultField label="Discriminator (8 B)" value={result.discriminator.hex} />
                  {result.discriminator.possibleInstruction && (
                    <ResultField
                      label="Possible Instruction"
                      value={result.discriminator.possibleInstruction}
                      highlight
                    />
                  )}
                </>
              )}
              {result.remainingHex && (
                <ResultField label="Remaining Args" value={result.remainingHex} />
              )}
            </>
          ) : (
            <div className="tool-empty">Paste instruction bytes and decode.</div>
          )}
        </ToolSection>
      </div>
    </div>
  );
}

function TransactionDecoderTab() {
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<TransactionDecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDecode() {
    setLoading(true);
    setError(null);
    try {
      const decoded = await decodeTransaction(signature);
      for (const ix of decoded.instructions) {
        if (ix.type === "partial" && ix.dataHex) {
          try {
            const engineDecoded = await decodeInstructionData(ix.dataHex);
            if (engineDecoded.discriminator?.possibleInstruction) {
              ix.name = engineDecoded.discriminator.possibleInstruction;
            }
          } catch (e) {
            console.error("Failed to decode instruction via engine:", e);
          }
        }
      }
      setResult(decoded);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="decoder-tab">
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Paste Signature">
          <ToolInput
            label="Transaction Signature"
            value={signature}
            onChange={setSignature}
            placeholder="5VERv8NMvzbJMEkJfz…"
          />
          <DecodeButton
            onClick={handleDecode}
            loading={loading}
            disabled={!signature.trim()}
            label="Fetch & Decode"
          />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Overview">
          {result ? (
            <>
              <ResultField
                label="Status"
                value={result.status === "success" ? "Success ✓" : `Failed: ${result.err}`}
                copyable={false}
                highlight={result.status === "success"}
              />
              <ResultField label="Slot" value={String(result.slot)} copyable={false} />
              <ResultField label="Block Time" value={formatTimestamp(result.blockTime)} copyable={false} />
              <ResultField label="Fee" value={formatLamports(result.fee)} copyable={false} />
              {result.computeUnits !== undefined && (
                <ResultField label="Compute Units" value={result.computeUnits.toLocaleString()} copyable={false} />
              )}
            </>
          ) : (
            <div className="tool-empty">Paste a signature to fetch from RPC.</div>
          )}
        </ToolSection>
      </div>

      {result && (
        <>
          <ToolSection title={`Instructions (${result.instructions.length})`}>
            <div className="tx-instructions">
              {result.instructions.map((ix) => (
                <div key={ix.index} className="tx-instruction-card">
                  <div className="tx-instruction-header">
                    <span className="tx-ix-index">#{ix.index + 1}</span>
                    <span className="tx-ix-program">{ix.programName ?? ix.programId}</span>
                    {ix.name && <span className="tx-ix-name">{ix.name}</span>}
                  </div>
                  {ix.dataHex && <code className="tx-ix-data">{ix.dataHex}</code>}
                  {ix.info && (
                    <pre className="tx-ix-info">{JSON.stringify(ix.info, null, 2)}</pre>
                  )}
                  {ix.accounts.length > 0 && (
                    <div className="tx-ix-accounts">
                      {ix.accounts.map((acc, i) => (
                        <code key={i}>{acc}</code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ToolSection>

          <ToolSection title={`Logs (${result.logs.length})`}>
            <div className="tx-logs">
              {result.logs.map((log, i) => (
                <div key={i} className="tx-log-line">
                  {log}
                </div>
              ))}
            </div>
          </ToolSection>

          <ToolSection title={`Accounts (${result.accountKeys.length})`}>
            <div className="tx-accounts">
              {result.accountKeys.map((key, i) => (
                <div key={key} className="tx-account-row">
                  <span>{i}</span>
                  <code>{key}</code>
                </div>
              ))}
            </div>
          </ToolSection>
        </>
      )}
    </div>
  );
}

function EventDecoderTab() {
  const [input, setInput] = useState(EXAMPLE_EVENT_LOGS);
  const [result, setResult] = useState<EventDecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDecode() {
    setLoading(true);
    setError(null);
    try {
      const decoded = await decodeEventLogs(input);
      setResult(decoded);
      if (decoded.events.length === 0) {
        setError("No Program data: lines found in logs. Paste transaction logs containing Anchor events.");
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Decode failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="decoder-tab">
      <div className="tool-grid tool-grid--2col">
        <ToolSection title="Paste Logs">
          <ToolTextarea
            label="Transaction Logs"
            hint='Look for "Program data: …" lines from Anchor programs'
            value={input}
            onChange={setInput}
            placeholder="Program log: …"
            rows={10}
          />
          <DecodeButton onClick={handleDecode} loading={loading} disabled={!input.trim()} />
          {error && <ErrorBanner message={error} />}
        </ToolSection>

        <ToolSection title="Summary">
          {result ? (
            <>
              <ResultField label="Log Lines" value={String(result.totalLogLines)} copyable={false} />
              <ResultField label="Program Data Lines" value={String(result.programDataLines)} copyable={false} />
              <ResultField label="Events Decoded" value={String(result.events.length)} copyable={false} />
            </>
          ) : (
            <div className="tool-empty">Paste Anchor program logs.</div>
          )}
        </ToolSection>
      </div>

      {result && result.events.length > 0 && (
        <ToolSection title="Decoded Events">
          <div className="event-cards">
            {result.events.map((event) => (
              <div key={event.index} className="event-card">
                <div className="event-card-header">
                  <span>Event #{event.index + 1}</span>
                  {event.program && <code>{event.program.slice(0, 8)}…</code>}
                </div>
                {event.discriminator && (
                  <>
                    <ResultField label="Discriminator" value={event.discriminator.hex} />
                    {event.discriminator.possibleEvent && (
                      <ResultField
                        label="Possible Event"
                        value={event.discriminator.possibleEvent}
                        highlight
                      />
                    )}
                  </>
                )}
                {event.dataHex && <ResultField label="Event Data" value={event.dataHex} />}
                <ResultField label="Full Payload" value={event.hex} />
              </div>
            ))}
          </div>
        </ToolSection>
      )}
    </div>
  );
}
