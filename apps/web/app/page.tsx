"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

interface Span {
  start: number;
  end: number;
}

interface Diagnostic {
  severity: "Error" | "Warning";
  message: string;
  span: Span;
  help?: string;
}

interface SuccessValue {
  type: string;
  value: any;
}

export default function Home() {
  const [wasm, setWasm] = useState<any>(null);
  const [input, setInput] = useState('sha256("hello")');
  const [result, setResult] = useState<SuccessValue | null>({
    type: "Bytes",
    value: [
      44, 242, 77, 186, 95, 176, 163, 14, 38, 232, 59, 42, 197, 185, 226, 158,
      27, 22, 30, 92, 31, 167, 66, 94, 115, 4, 51, 98, 147, 139, 152, 36,
    ],
  });
  const [error, setError] = useState<Diagnostic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    import("@sollens/bindings")
      .then(async (mod) => {
        await mod.default();
        setWasm(mod);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  function getPositionAtOffset(text: string, offset: number) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return { line, column };
  }

  function formatValue(res: SuccessValue) {
    if (res.type === "Bytes" && Array.isArray(res.value)) {
      return (
        "0x" +
        res.value.map((b: number) => b.toString(16).padStart(2, "0")).join("")
      );
    }
    return String(res.value);
  }

  function handleRun(currentInput: string = input) {
    if (!wasm) return;
    try {
      const value = wasm.evaluate(currentInput);
      setResult(value);
      setError(null);
    } catch (err: any) {
      setResult(null);
      setError(err as Diagnostic);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(formatValue(result));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function loadExample(expr: string) {
    setInput(expr);
    handleRun(expr);
  }

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    monacoRef.current = { editor, monaco };

    monaco.editor.defineTheme("sollens", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "8B5CF6" },
        { token: "string", foreground: "22C55E" },
        { token: "number", foreground: "38BDF8" },
        { token: "identifier", foreground: "FAFAFA" },
      ],
      colors: {
        "editor.background": "#09090b",
        "editorCursor.foreground": "#8b5cf6",
        "editor.selectionBackground": "#8b5cf633",
        "editor.lineHighlightBackground": "#141417",
        "editorLineNumber.foreground": "#3f3f46",
        "editorLineNumber.activeForeground": "#ffffff",
        "editorIndentGuide.background": "#202024",
        "editorIndentGuide.activeBackground": "#404040",
      },
    });

    monaco.editor.setTheme("sollens");
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
      handleRun(editor.getValue()),
    );
  }

  useEffect(() => {
    if (!monacoRef.current) return;
    const { editor, monaco } = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    if (error) {
      const start = getPositionAtOffset(input, error.span.start);
      const end = getPositionAtOffset(input, error.span.end);
      monaco.editor.setModelMarkers(model, "sollens", [
        {
          startLineNumber: start.line,
          startColumn: start.column,
          endLineNumber: end.line,
          endColumn: end.column,
          severity: monaco.MarkerSeverity.Error,
          message: error.message + (error.help ? `\n\n${error.help}` : ""),
        },
      ]);
    } else {
      monaco.editor.setModelMarkers(model, "sollens", []);
    }
  }, [error, input]);

  return (
    <main className="app">
      <header className="header">
        <div className="logo">
          <h1>SolLens</h1>
        </div>

        <div className="header-right">
          <div className="status">
            <span className="status-dot" />
            {isLoading ? "Loading Engine..." : "Engine Ready"}
          </div>
          <button
            className="run-button"
            onClick={() => handleRun()}
            disabled={!wasm || isLoading}
          >
            ▶ Run
          </button>
        </div>
      </header>

      <section className="card">
        <div className="section-title">
          <h2>Expression Editor</h2>
          <span>Ctrl + Enter to Run</span>
        </div>

        <div className="ide-container">
          {/* Action sidebar mapping out your IDE controls */}
          <div className="ide-sidebar">
            <svg
              className="sidebar-icon active"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <svg
              className="sidebar-icon"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg
              className="sidebar-icon"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
          </div>

          <div className="ide-content-area">
            <div className="search-bar-wrapper">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search functions..."
                readOnly
              />
            </div>

            <div className="editor-wrapper">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={input}
                onChange={(value) => setInput(value || "")}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontLigatures: true,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "all",
                  roundedSelection: true,
                  wordWrap: "on",
                  automaticLayout: true,
                  domReadOnly: isLoading,
                  lineNumbersMinChars: 3,
                  padding: { top: 14, bottom: 14 },
                }}
              />
            </div>
          </div>
        </div>

        {/* Separated and explicit Function Shelves matching layout hierarchy */}
        <div className="examples-shelf">
          <div className="example-row">
            <span className="row-label">Functions</span>
            <button
              className="example-btn"
              onClick={() => loadExample('sha256("hello")')}
            >
              SHA256
            </button>
            <button
              className="example-btn"
              onClick={() => loadExample('echo("hello")')}
            >
              Echo
            </button>
            <button
              className="example-btn"
              onClick={() => loadExample('upper("solana")')}
            >
              Upper
            </button>
          </div>

          <div className="example-row">
            <span className="row-label">Utilities</span>
            <button
              className="example-btn"
              onClick={() => loadExample("lamports(1.5)")}
            >
              Lamports
            </button>
            <button
              className="example-btn"
              onClick={() => loadExample("rent(128)")}
            >
              Rent
            </button>
            <button
              className="example-btn"
              onClick={() => loadExample("address()")}
            >
              Address
            </button>
          </div>

          <div className="example-row">
            <span className="row-label">State</span>
            <button
              className="example-btn error-type"
              onClick={() => loadExample('sha25("hello")')}
            >
              Unknown Function
            </button>
            <button
              className="example-btn error-type"
              onClick={() => loadExample("sha256()")}
            >
              Wrong Arguments
            </button>
          </div>
        </div>
      </section>

      <section className="card output-card">
        <div className="section-title">
          <h2>Output</h2>
          <span>Evaluation Result</span>
        </div>

        {result && (
          <>
            <div className="success-badge">✓ Success</div>

            <div className="output-box">
              <div style={{ marginBottom: 20 }}>
                <span className="output-label">Type</span>
                <div
                  className="output-text-value"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {result.type}
                </div>
              </div>

              <div>
                <span className="output-label">Value</span>
                <div className="output-text-value" style={{ color: "#22c55e" }}>
                  {formatValue(result)}
                </div>
              </div>
            </div>

            <div className="output-footer">
              <button className="copy-btn" onClick={copyResult}>
                📋 Copy Result
              </button>
              {copied && <div className="toast-feedback">Copied! ✓</div>}
            </div>
          </>
        )}

        {error && (
          <div
            className="output-box"
            style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--error)",
                  boxShadow: "0 0 10px var(--error)",
                }}
              />
              <strong style={{ fontSize: 15, fontWeight: 600 }}>
                Compilation Error
              </strong>
            </div>

            <div
              className="output-text-value"
              style={{
                color: "#fca5a5",
                fontSize: 13,
                background: "rgba(239, 68, 68, 0.04)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.1)",
              }}
            >
              {error.message}
            </div>

            {error.help && (
              <div
                style={{
                  marginTop: 14,
                  background: "rgba(255,255,255,.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    marginBottom: 4,
                    color: "var(--accent-purple)",
                  }}
                >
                  Suggestion
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {error.help}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !error && (
          <div
            className="output-box"
            style={{
              textAlign: "center",
              color: "var(--muted)",
              padding: "40px 20px",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h3
              style={{
                marginBottom: 6,
                color: "var(--text-primary)",
                fontSize: 15,
              }}
            >
              Ready to Evaluate
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Type an expression in the editor, then press{" "}
              <strong>Ctrl + Enter</strong> or click <strong>Run</strong>.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
