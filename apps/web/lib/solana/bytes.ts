import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

export function hexToBytes(input: string): Uint8Array {
  const cleaned = input.trim().replace(/^0x/i, "").replace(/\s+/g, "");
  if (!cleaned) return new Uint8Array(0);
  if (cleaned.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error("Invalid hex characters");
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array, prefix = true): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return prefix ? `0x${hex}` : hex;
}

export function parsePubkey(input: string): PublicKey {
  const trimmed = input.trim();
  try {
    return new PublicKey(trimmed);
  } catch {
    throw new Error(`Invalid public key: ${trimmed}`);
  }
}

export function parseAccountData(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Account data is empty");

  if (/^(0x)?[0-9a-fA-F\s]+$/.test(trimmed)) {
    return hexToBytes(trimmed);
  }

  try {
    return bs58.decode(trimmed);
  } catch {
    throw new Error("Expected base58 account data or hex (0x…)");
  }
}

export function parseInstructionData(input: string): Uint8Array {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Instruction data is empty");
  return hexToBytes(trimmed);
}

export interface HexDumpLine {
  offset: number;
  hex: string;
  ascii: string;
}

export function hexDump(bytes: Uint8Array, bytesPerLine = 16): HexDumpLine[] {
  const lines: HexDumpLine[] = [];
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    const chunk = bytes.slice(i, i + bytesPerLine);
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");
    lines.push({ offset: i, hex, ascii });
  }
  return lines;
}
