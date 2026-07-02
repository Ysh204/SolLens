import bs58 from "bs58";
import { bytesToHex, parseInstructionData, anchorDiscriminator } from "../bytes";

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

const KNOWN_INSTRUCTIONS = [
  "initialize",
  "transfer",
  "mint",
  "burn",
  "swap",
  "deposit",
  "withdraw",
  "close",
  "update",
];

async function matchInstructionDiscriminator(disc: Uint8Array): Promise<string | undefined> {
  for (const name of KNOWN_INSTRUCTIONS) {
    const expected = await anchorDiscriminator("global", name);
    if (expected.every((b, i) => b === disc[i])) return name;
  }
  return undefined;
}

export async function decodeInstructionData(input: string): Promise<InstructionDecodeResult> {
  const data = parseInstructionData(input);
  const result: InstructionDecodeResult = {
    byteLength: data.length,
    hex: bytesToHex(data),
  };

  if (data.length >= 8) {
    const disc = data.slice(0, 8);
    const remaining = data.slice(8);
    result.discriminator = {
      hex: bytesToHex(disc),
      possibleInstruction: await matchInstructionDiscriminator(disc),
    };
    result.remainingHex = bytesToHex(remaining);
  }

  if (data.length > 8) {
    result.u8Args = [];
    for (let i = 8; i < Math.min(data.length, 24); i++) {
      result.u8Args.push({ offset: i, value: data[i] ?? 0 });
    }
  }

  return result;
}

export function formatInstructionPreview(data: Uint8Array): string {
  if (data.length <= 16) return bytesToHex(data);
  return `${bytesToHex(data.slice(0, 8))}… (${data.length} bytes)`;
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
  if (base64) return bytesToHex(base64);
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed.replace(/^0x/i, "")}`;
}

export function instructionToBase58(hex: string): string {
  const data = parseInstructionData(hex);
  return bs58.encode(data);
}
