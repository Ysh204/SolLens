import bs58 from "bs58";
import type { SuccessValue } from "../../types";
import { unwrapArray, unwrapNumber, unwrapObject, unwrapString } from "../../engine/values";
import {
  buildDecodeInstructionExpression,
  discriminatorFromEngine,
} from "./engine";

export interface InstructionDecodeResult {
  byteLength: number;
  hex: string;
  discriminator?: {
    hex: string;
    possibleInstruction?: string;
  };
  remainingHex?: string;
  u8Args?: Array<{ offset: number; value: number }>;
}

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) return value;
  }
  throw new Error(`Instruction decode result is missing fields: ${names.join(" / ")}`);
}

function instructionResultFromEngine(result: SuccessValue): InstructionDecodeResult {
  const obj = unwrapObject(result);
  const decoded: InstructionDecodeResult = {
    byteLength: unwrapNumber(pickField(obj, "byte_length", "byteLength")),
    hex: unwrapString(pickField(obj, "hex")),
  };

  if (obj.discriminator) {
    const disc = discriminatorFromEngine(obj.discriminator);
    decoded.discriminator = {
      hex: disc.hex,
      possibleInstruction: disc.possibleInstruction,
    };
  }

  const remaining = obj.remaining_hex ?? obj.remainingHex;
  if (remaining) {
    decoded.remainingHex = unwrapString(remaining);
  }

  const u8Args = obj.u8_args ?? obj.u8Args;
  if (u8Args) {
    decoded.u8Args = unwrapArray(u8Args).map((item) => {
      const row = unwrapObject(item);
      return {
        offset: unwrapNumber(pickField(row, "offset")),
        value: unwrapNumber(pickField(row, "value")),
      };
    });
  }

  return decoded;
}

export async function decodeInstructionData(input: string): Promise<InstructionDecodeResult> {
  const { getEngineClient, evaluateWithClient } = await import("../../engine/client");
  const client = await getEngineClient();
  const expr = buildDecodeInstructionExpression(input);
  const { result, error } = evaluateWithClient(client, expr);
  if (error) throw new Error(error.message);
  if (!result) throw new Error("No result from engine");
  return instructionResultFromEngine(result);
}

export function formatInstructionPreview(data: Uint8Array): string {
  if (data.length <= 16) {
    return `0x${Array.from(data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  const head = data.slice(0, 8);
  return `0x${Array.from(head)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}… (${data.length} bytes)`;
}

export function tryDecodeBase64Instruction(input: string): Uint8Array | null {
  const trimmed = input.trim();
  try {
    return Uint8Array.from(atob(trimmed), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export function normalizeInstructionInput(input: string): string {
  const trimmed = input.trim();
  const base64 = tryDecodeBase64Instruction(trimmed);
  if (base64) {
    return `0x${Array.from(base64)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed.replace(/^0x/i, "")}`;
}

export function instructionToBase58(hex: string): string {
  const cleaned = hex.trim().replace(/^0x/i, "");
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bs58.encode(bytes);
}
