import type { SuccessValue } from "../../types";
import { unwrapNumber, unwrapObject, unwrapString } from "../../engine/values";
import {
  borshFieldsFromEngine,
  buildDecodeAccountExpression,
  discriminatorFromEngine,
  hexDumpFromEngine,
} from "./engine";

export type AccountDecodeMode = "anchor" | "borsh" | "raw";

export interface AccountDecodeResult {
  mode: AccountDecodeMode;
  byteLength: number;
  hex: string;
  dump: ReturnType<typeof hexDumpFromEngine>;
  discriminator?: {
    hex: string;
    possibleAccount?: string;
  };
  borsh?: {
    schema: string;
    fields: Array<{ name: string; type: string; value: string; offset: number; size: number }>;
    error?: string;
  };
}

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) return value;
  }
  throw new Error(`Account decode result is missing fields: ${names.join(" / ")}`);
}

function accountResultFromEngine(result: SuccessValue): AccountDecodeResult {
  const obj = unwrapObject(result);
  const decoded: AccountDecodeResult = {
    mode: unwrapString(pickField(obj, "mode")) as AccountDecodeMode,
    byteLength: unwrapNumber(pickField(obj, "byte_length", "byteLength")),
    hex: unwrapString(pickField(obj, "hex")),
    dump: hexDumpFromEngine(pickField(obj, "dump")),
  };

  const discVal = obj.discriminator;
  if (discVal) {
    const disc = discriminatorFromEngine(discVal);
    decoded.discriminator = {
      hex: disc.hex,
      possibleAccount: disc.possibleAccount,
    };
  }

  if (obj.borsh) {
    decoded.borsh = borshFieldsFromEngine(obj.borsh);
  }

  return decoded;
}

export async function decodeAccountData(
  input: string,
  mode: AccountDecodeMode,
  borshSchema?: string,
): Promise<AccountDecodeResult> {
  const { getEngineClient, evaluateWithClient } = await import("../../engine/client");
  const client = await getEngineClient();
  const expr = buildDecodeAccountExpression(input, mode, borshSchema);
  const { result, error } = evaluateWithClient(client, expr);
  if (error) throw new Error(error.message);
  if (!result) throw new Error("No result from engine");
  return accountResultFromEngine(result);
}
