"use client";

import { useEffect, useState, useRef } from "react";
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
  const [input, setInput] = useState<string>('sha256("hello")');
  const [result, setResult] = useState<SuccessValue | null>({
    type: "Bytes",
    value: [
      44, 242, 77, 186, 95, 176, 163, 14, 38, 232, 59, 42, 197, 185, 226, 158,
      27, 22, 30, 92, 31, 167, 66, 94, 115, 4, 51, 98, 147, 139, 152, 36
    ]
  });
  const [error, setError] = useState<Diagnostic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    import("@sollens/bindings")
      .then(async (mod) => {
        await mod.default();
        setWasm(mod);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load WASM bindings:", err);
        setIsLoading(false);
      });
  }, []);

  // Update Monaco Editor markers when input or error changes
  useEffect(() => {
    if (!monacoRef.current || !monacoRef.current.editor) return;
    const monaco = monacoRef.current.monaco;
    const editor = monacoRef.current.editor;
    const model = editor.getModel();

    if (!model) return;

    if (error) {
      const startPos = getPositionAtOffset(input, error.span.start);
      const endPos = getPositionAtOffset(input, error.span.end);
      
      monaco.editor.setModelMarkers(model, "sollens", [
        {
          startLineNumber: startPos.line,
          startColumn: startPos.column,
          endLineNumber: endPos.line,
          endColumn: endPos.column,
          message: error.message + (error.help ? `\nHelp: ${error.help}` : ""),
          severity: monaco.MarkerSeverity.Error,
        },
      ]);
    } else {
      monaco.editor.setModelMarkers(model, "sollens", []);
    }
  }, [error, input]);

  const getPositionAtOffset = (text: string, offset: number) => {
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
  };

  const handleRun = (currentInput: string = input) => {
    if (!wasm) return;
    try {
      const val = wasm.evaluate(currentInput);
      setResult(val);
      setError(null);
    } catch (err: any) {
      setError(err as Diagnostic);
      setResult(null);
    }
  };

  const loadExample = (expr: string) => {
    setInput(expr);
    handleRun(expr);
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    monacoRef.current = { editor, monaco };
    
    // Add command for Ctrl + Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun(editor.getValue());
    });
  };

  const formatValue = (res: SuccessValue) => {
    if (res.type === "Bytes" && Array.isArray(res.value)) {
      const hexStr = res.value.map((b: number) => b.toString(16).padStart(2, "0")).join("");
      return `0x${hexStr}`;
    }
    return String(res.value);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#0d0e12",
      color: "#f3f4f6",
      fontFamily: "var(--font-sans), sans-serif",
      padding: "2rem",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        borderBottom: "1px solid #1e293b",
        paddingBottom: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, letterSpacing: "-0.05em", color: "#6366f1" }}>SolLens</h1>
            <span style={{
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.25rem 0.5rem",
              borderRadius: "9999px",
              border: "1px solid rgba(99, 102, 241, 0.3)"
            }}>v0.1.0-alpha</span>
          </div>
          <p style={{ margin: "0.25rem 0 0 0", color: "#9ca3af", fontSize: "0.9rem" }}>
            Solana Expression Engine & Compiler Environment
          </p>
        </div>
        <div>
          <button
            onClick={() => handleRun()}
            disabled={isLoading || !wasm}
            style={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: isLoading || !wasm ? "not-allowed" : "pointer",
              opacity: isLoading || !wasm ? 0.6 : 1,
              transition: "background-color 0.2s",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
            }}
            onMouseOver={(e) => {
              if (wasm) e.currentTarget.style.backgroundColor = "#4f46e5";
            }}
            onMouseOut={(e) => {
              if (wasm) e.currentTarget.style.backgroundColor = "#6366f1";
            }}
          >
            {isLoading ? "Loading Engine..." : "Run Expression (Ctrl + Enter)"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        flex: 1
      }}>
        {/* Left: Editor & Examples */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{
            backgroundColor: "#15171e",
            borderRadius: "0.75rem",
            border: "1px solid #1e293b",
            overflow: "hidden",
            height: "400px"
          }}>
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={input}
              theme="vs-dark"
              onChange={(val) => setInput(val || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                cursorBlinking: "smooth",
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>

          {/* Quick Examples */}
          <div>
            <h3 style={{ fontSize: "1rem", color: "#9ca3af", marginBottom: "0.75rem" }}>Try Examples</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button onClick={() => loadExample('echo("hello")')} style={btnStyle}>echo()</button>
              <button onClick={() => loadExample('upper("solana")')} style={btnStyle}>upper()</button>
              <button onClick={() => loadExample('sha256("hello")')} style={btnStyle}>sha256()</button>
              <button onClick={() => loadExample('lamports(1.5)')} style={btnStyle}>lamports()</button>
              <button onClick={() => loadExample('rent(128)')} style={btnStyle}>rent()</button>
              <button onClick={() => loadExample('sha25("hello")')} style={errBtnStyle}>Invalid Function Suggestion</button>
              <button onClick={() => loadExample('sha256()')} style={errBtnStyle}>Arg Count Mismatch</button>
            </div>
          </div>
        </section>

        {/* Right: Results / Diagnostics Output */}
        <section style={{
          backgroundColor: "#15171e",
          borderRadius: "0.75rem",
          border: "1px solid #1e293b",
          padding: "2rem",
          display: "flex",
          flexDirection: "column"
        }}>
          <h2 style={{ fontSize: "1.25rem", color: "#9ca3af", marginTop: 0, marginBottom: "1.5rem" }}>Output Console</h2>

          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Result Type:</span>
                <span style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(16, 185, 129, 0.3)"
                }}>{result.type}</span>
              </div>
              <div style={{
                backgroundColor: "#0d0e12",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                border: "1px solid #1e293b",
                fontFamily: "monospace",
                fontSize: "1.1rem",
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
                color: "#10b981"
              }}>
                {formatValue(result)}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                border: "1px solid rgba(239, 68, 68, 0.3)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px"
                  }}>{error.severity}</span>
                  <strong style={{ color: "#f87171" }}>Compilation Error</strong>
                </div>
                <div style={{
                  fontFamily: "monospace",
                  color: "#fca5a5",
                  marginBottom: "1rem",
                  fontSize: "1rem"
                }}>
                  {error.message}
                </div>
                {error.help && (
                  <div style={{
                    fontSize: "0.9rem",
                    color: "#9ca3af",
                    borderTop: "1px solid rgba(239, 68, 68, 0.2)",
                    paddingTop: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem"
                  }}>
                    <strong style={{ color: "#818cf8" }}>Help Recommendation:</strong>
                    <span>{error.help}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && !error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "#6b7280",
              fontSize: "0.95rem"
            }}>
              Ready to evaluate. Type an expression and click Run.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: "0.375rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "all 0.2s"
};

const errBtnStyle: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.05)",
  color: "#fca5a5",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  borderRadius: "0.375rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "all 0.2s"
};
