"use client";

import { useEffect, useState } from "react";
import type { Diagnostic, SuccessValue } from "../lib/types";
import { formatEngineResult, type FunctionMetadata } from "../lib/engine/client";

interface WasmModule {
  evaluate: (input: string) => SuccessValue;
  list_functions: () => string[];
  function_catalog: () => FunctionMetadata[];
  set_transaction_data?: (sig: string, val: SuccessValue) => void;
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

  async function evaluateAsync(input: string): Promise<{ result?: SuccessValue; error?: Diagnostic }> {
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
      // Find all transaction("...") or transaction('...') signatures
      const matches = input.matchAll(/transaction\s*\(\s*["']([^"']+)["']\s*\)/g);
      const signatures = Array.from(matches)
        .map((m) => m[1])
        .filter((sig): sig is string => Boolean(sig));

      if (signatures.length > 0) {
        const { decodeTransaction } = await import("../lib/solana/decode/transaction");
        const { wrapJsonToEngineValue } = await import("../lib/engine/values");
        
        for (const sig of signatures) {
          const txData = await decodeTransaction(sig);
          const engineVal = wrapJsonToEngineValue(txData);
          if (wasm.set_transaction_data) {
            wasm.set_transaction_data(sig, engineVal);
          }
        }
      }

      const result = wasm.evaluate(input);
      return { result };
    } catch (err) {
      return { error: err as Diagnostic };
    }
  }

  function listFunctions(): string[] {
    return wasm?.list_functions() ?? [];
  }

  function functionCatalog(): FunctionMetadata[] {
    return wasm?.function_catalog() ?? [];
  }

  return {
    wasm,
    isLoading,
    loadError: error,
    evaluate,
    evaluateAsync,
    listFunctions,
    functionCatalog,
    isReady: !!wasm && !isLoading,
  };
}

export function formatResult(result: SuccessValue): string {
  return formatEngineResult(result);
}
