"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASCII_LOGO, COMING_SOON_MODULES } from "../lib/constants";
import { HELP_TEXT } from "../lib/expressions";
import type { TerminalLine } from "../lib/types";
import { formatResult, useWasm } from "../hooks/useWasm";
import { ExpressionExamples } from "./ExpressionExamples";
import { PlayIcon } from "./icons";

const BOOT_LINES: TerminalLine[] = [
  {
    id: "boot-logo",
    type: "system",
    content: ASCII_LOGO,
  },
  {
    id: "boot-welcome",
    type: "system",
    content:
      "Universal Expression Engine — Base58, Pubkey & Anchor discriminators.\nPick an example below, edit values, then press Run.",
  },
];

function createLine(type: TerminalLine["type"], content: string): TerminalLine {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    content,
  };
}

function handleBuiltinCommand(cmd: string): string | null {
  const trimmed = cmd.trim().toLowerCase();

  if (trimmed === "help") return HELP_TEXT;
  if (trimmed === "clear") return "__CLEAR__";
  if (trimmed === "about") {
    return `SolLens v1.0.0 — Solana Developer Platform

Base58:  encode, decode, is_base58, bytes_to_base58
Pubkey:  pubkey, is_on_curve, bytes, pubkey_from_bytes
Anchor:  account_discriminator, instruction_discriminator
Solana:  pda, ata, lamports, rent
Decode:  decode_account, decode_instruction, decode_events, decode, hex_dump

Try: pda(["vault"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").bump
     decode_instruction("0xa9059cbb0000000000000000000000000000000000000000000000000000000000000064")`;
  }

  return null;
}

interface TerminalProps {
  isActive: boolean;
}

export function Terminal({ isActive }: TerminalProps) {
  const { evaluate, evaluateAsync, isReady, isLoading, loadError } = useWasm();
  const [lines, setLines] = useState<TerminalLine[]>(BOOT_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const readyMessageRef = useRef(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const appendEvaluation = useCallback(
    async (cmd: string, opts?: { echoInput?: boolean }) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      const newLines: TerminalLine[] = [];
      if (opts?.echoInput !== false) {
        newLines.push(createLine("input", trimmed));
      }

      const builtin = handleBuiltinCommand(trimmed);
      if (builtin === "__CLEAR__") {
        setLines([]);
        return;
      }
      if (builtin) {
        newLines.push(createLine("info", builtin));
        setLines((prev) => [...prev, ...newLines]);
        return;
      }

      const hasTx = /transaction\s*\(\s*["']([^"']+)["']\s*\)/.test(trimmed);
      if (hasTx) {
        const loadingLine = createLine("system", "Fetching transaction details from RPC...");
        setLines((prev) => [...prev, ...newLines, loadingLine]);

        const { result, error } = await evaluateAsync(trimmed);
        setLines((prev) => {
          const filtered = prev.filter((l) => l.id !== loadingLine.id);
          const finalLines: TerminalLine[] = [];
          if (error) {
            const errMsg = error.help
              ? `${error.message}\n\nSuggestion: ${error.help}`
              : error.message;
            finalLines.push(createLine("error", errMsg));
          } else if (result) {
            finalLines.push(createLine("output", formatResult(result)));
          }
          return [...filtered, ...finalLines];
        });
      } else {
        const { result, error } = evaluate(trimmed);
        if (error) {
          const errMsg = error.help
            ? `${error.message}\n\nSuggestion: ${error.help}`
            : error.message;
          newLines.push(createLine("error", errMsg));
        } else if (result) {
          newLines.push(createLine("output", formatResult(result)));
        }
        setLines((prev) => [...prev, ...newLines]);
      }
    },
    [evaluate, evaluateAsync],
  );

  const runCommand = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      setHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      appendEvaluation(cmd);
    },
    [appendEvaluation],
  );

  useEffect(() => {
    if (!isReady || readyMessageRef.current) return;
    readyMessageRef.current = true;
    setLines((prev) => [
      ...prev.filter((l) => l.id !== "boot-welcome"),
      createLine("system", "Engine ready. Edit an example or type your own expression."),
    ]);
  }, [isReady]);

  // WASM load failure
  useEffect(() => {
    if (loadError) {
      setLines((prev) => [
        ...prev,
        createLine("error", `${loadError}\n\nRun: pnpm build (from repo root) to compile WASM.`),
      ]);
    }
  }, [loadError]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCommand(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      runCommand(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex] ?? "");
      }
    }
  }

  function handleExampleSelect(expr: string) {
    setInput(expr);
    inputRef.current?.focus();
  }

  return (
    <div className="terminal-wrapper">
      <div className="terminal-panel">
        <div className="terminal-chrome">
          <div className="terminal-chrome-left">
            <span className="terminal-prompt-label">sollens@engine:~</span>
            <span className="terminal-module-tag">Module 1 · Expression Engine</span>
          </div>
          <span
            className={`terminal-engine-status ${isReady ? "ready" : loadError ? "error" : "loading"}`}
          >
            <span className="status-dot" />
            {loadError
              ? "Engine failed"
              : isReady
                ? "Engine ready"
                : isLoading
                  ? "Loading WASM…"
                  : "Engine offline"}
          </span>
        </div>

        <div className="terminal-output" ref={outputRef}>
          {lines.map((line) => (
            <div key={line.id} className={`terminal-line terminal-line--${line.type}`}>
              {line.type === "input" && (
                <span className="terminal-input-prefix">&gt; </span>
              )}
              <pre className="terminal-text">{line.content}</pre>
            </div>
          ))}
        </div>

        <form className="terminal-input-bar" onSubmit={handleSubmit}>
          <span className="terminal-input-icon">&gt;_</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            placeholder='Try sha256("hello") or lamports(1.5) * 2'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isReady}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            className="terminal-run-btn"
            disabled={!isReady || !input.trim()}
          >
            <PlayIcon size={12} />
            Run
          </button>
        </form>

        <ExpressionExamples onSelect={handleExampleSelect} disabled={!isReady} />
      </div>
    </div>
  );
}

interface ComingSoonProps {
  moduleId: string;
}

export function ComingSoon({ moduleId }: ComingSoonProps) {
  const title = COMING_SOON_MODULES[moduleId] ?? "Module";

  return (
    <div className="coming-soon-panel">
      <div className="coming-soon-icon">⚡</div>
      <h2 className="coming-soon-title">{title}</h2>
      <p className="coming-soon-desc">
        This module is on the roadmap. Use <strong>Expression Engine</strong> in
        the sidebar — Phase 2 is live with sha256, lamports, rent, and arithmetic.
      </p>
      <div className="coming-soon-features">
        <span className="coming-soon-tag">WASM Engine ✓</span>
        <span className="coming-soon-tag">Pratt Parser ✓</span>
        <span className="coming-soon-tag">Coming Soon</span>
      </div>
    </div>
  );
}