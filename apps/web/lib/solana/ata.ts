import type { SuccessValue } from "../types";
import { unwrapBool, unwrapBytes, unwrapObject, unwrapString } from "../engine/values";

export interface AtaResult {
  ata: string;
  wallet: string;
  mint: string;
  tokenProgram: string;
  associatedTokenProgram: string;
  bytes: Uint8Array;
  isOnCurve: boolean;
}

export function buildAtaExpression(
  walletInput: string,
  mintInput: string,
  tokenProgramInput?: string,
): string {
  const wallet = walletInput.trim();
  const mint = mintInput.trim();
  const tokenProgram = tokenProgramInput?.trim();

  if (tokenProgram) {
    return `ata(${JSON.stringify(wallet)}, ${JSON.stringify(mint)}, ${JSON.stringify(tokenProgram)})`;
  }
  return `ata(${JSON.stringify(wallet)}, ${JSON.stringify(mint)})`;
}

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) {
      return value;
    }
  }
  throw new Error(`ATA result is missing fields: ${names.join(" / ")}`);
}

export function ataResultFromEngine(result: SuccessValue): AtaResult {
  const obj = unwrapObject(result);
  return {
    ata: unwrapString(pickField(obj, "ata")),
    wallet: unwrapString(pickField(obj, "wallet")),
    mint: unwrapString(pickField(obj, "mint")),
    tokenProgram: unwrapString(pickField(obj, "token_program", "tokenProgram")),
    associatedTokenProgram: unwrapString(
      pickField(obj, "associated_token_program", "associatedTokenProgram"),
    ),
    bytes: unwrapBytes(pickField(obj, "bytes")),
    isOnCurve: unwrapBool(pickField(obj, "is_on_curve", "isOnCurve")),
  };
}

export function deriveAtaFromEngine(
  evaluate: (input: string) => SuccessValue,
  walletInput: string,
  mintInput: string,
  tokenProgramInput?: string,
): AtaResult {
  const expr = buildAtaExpression(walletInput, mintInput, tokenProgramInput);
  const result = evaluate(expr);
  return ataResultFromEngine(result);
}
