import type { Diagnostic, SuccessValue } from "../types";
import {
  formatEngineResult,
  unwrapArray,
  unwrapBool,
  unwrapBytes,
  unwrapNumber,
  unwrapObject,
  unwrapString,
} from "./values";

export interface FunctionMetadata {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    expected_type: string;
    optional: boolean;
    description: string;
  }>;
  return_type: string;
  examples: string[];
  errors: string[];
}

export interface EngineClient {
  evaluate: (input: string) => SuccessValue;
  listFunctions: () => string[];
  functionCatalog: () => FunctionMetadata[];
}

let clientPromise: Promise<EngineClient> | null = null;

async function loadClient(): Promise<EngineClient> {
  const mod = await import("@sollens/bindings");
  return {
    evaluate: mod.evaluate,
    listFunctions: mod.list_functions,
    functionCatalog: mod.function_catalog,
  };
}

export async function getEngineClient(): Promise<EngineClient> {
  if (!clientPromise) {
    clientPromise = loadClient();
  }
  return clientPromise;
}

export function evaluateWithClient(
  client: EngineClient,
  input: string,
): { result?: SuccessValue; error?: Diagnostic } {
  try {
    const result = client.evaluate(input);
    return { result };
  } catch (err) {
    return { error: err as Diagnostic };
  }
}

export { formatEngineResult, unwrapArray, unwrapBool, unwrapBytes, unwrapNumber, unwrapObject, unwrapString };
