"use client";

import { useEffect, useState } from "react";
import type { Diagnostic, SuccessValue } from "../lib/types";

interface WasmModule {
  evaluate: (input: string) => SuccessValue;
}

export function useWasm() {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("@sollens/bindings")
      .then((mod) => {
        setWasm(mod as WasmModule);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load WASM engine");
        setIsLoading(false);
      });
  }, []);

  function evaluate(input: string): { result?: SuccessValue; error?: Diagnostic } {
    if (!wasm) {
      return {
        error: {
          severity: "Error",
          message: "Engine not ready",
          span: { start: 0, end: 0 },
        },
      };
    }
    try {
      const result = wasm.evaluate(input);
      return { result };
    } catch (err) {
      return { error: err as Diagnostic };
    }
  }

  return { wasm, isLoading, loadError: error, evaluate, isReady: !!wasm && !isLoading };
}

export function formatValue(res: SuccessValue): string {
  if (res.type === "Bytes" && Array.isArray(res.value)) {
    return (
      "0x" +
      (res.value as number[]).map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  }
  if (res.type === "Number" && typeof res.value === "number") {
    return res.value.toLocaleString("en-US");
  }
  return String(res.value);
}

export function formatResult(result: SuccessValue): string {
  return `[${result.type}] ${formatValue(result)}`;
}
