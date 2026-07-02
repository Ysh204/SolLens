import { PublicKey } from "@solana/web3.js";
import { bytesToHex, hexToBytes, parsePubkey } from "./bytes";

export type SeedKind = "utf8" | "pubkey" | "bytes";

export interface ParsedSeed {
  raw: string;
  kind: SeedKind;
  bytes: Uint8Array;
  label: string;
}

export interface PdaResult {
  pda: string;
  bump: number;
  seeds: ParsedSeed[];
  bytes: Uint8Array;
}

function parseSeed(raw: string): ParsedSeed {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Seed cannot be empty");

  if (/^(0x)?[0-9a-fA-F\s]+$/.test(trimmed) && trimmed.length > 2) {
    const bytes = hexToBytes(trimmed);
    return {
      raw: trimmed,
      kind: "bytes",
      bytes,
      label: `bytes(${bytes.length})`,
    };
  }

  if (trimmed.length >= 32 && trimmed.length <= 44) {
    try {
      const pubkey = parsePubkey(trimmed);
      return {
        raw: trimmed,
        kind: "pubkey",
        bytes: pubkey.toBytes(),
        label: "pubkey",
      };
    } catch {
      // fall through to utf8
    }
  }

  const bytes = new TextEncoder().encode(trimmed);
  return {
    raw: trimmed,
    kind: "utf8",
    bytes,
    label: `"${trimmed}"`,
  };
}

export function parseSeedsInput(input: string): ParsedSeed[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Seeds JSON must be an array");
      return parsed.map((item) => parseSeed(String(item)));
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error("Invalid JSON array for seeds");
      }
      throw err;
    }
  }

  return trimmed
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseSeed);
}

export function derivePda(seedsInput: string, programIdInput: string): PdaResult {
  const seeds = parseSeedsInput(seedsInput);
  if (seeds.length === 0) throw new Error("At least one seed is required");

  const programId = parsePubkey(programIdInput);
  const seedBuffers = seeds.map((s) => Buffer.from(s.bytes));

  const [pda, bump] = PublicKey.findProgramAddressSync(seedBuffers, programId);

  return {
    pda: pda.toBase58(),
    bump,
    seeds,
    bytes: pda.toBytes(),
  };
}

export function formatSeedBytes(seed: ParsedSeed): string {
  if (seed.kind === "pubkey") {
    try {
      return new PublicKey(seed.bytes).toBase58();
    } catch {
      return bytesToHex(seed.bytes);
    }
  }
  if (seed.kind === "utf8") {
    return `"${seed.raw}" → ${bytesToHex(seed.bytes)}`;
  }
  return bytesToHex(seed.bytes);
}

/** Visual chain: program + seeds → PDA */
export function buildSeedChain(seeds: ParsedSeed[], programId: string, pda: string, bump: number) {
  return [
    ...seeds.map((seed, i) => ({
      id: `seed-${i}`,
      type: "seed" as const,
      title: `Seed ${i + 1}`,
      subtitle: seed.label,
      detail: formatSeedBytes(seed),
      byteLength: seed.bytes.length,
    })),
    {
      id: "program",
      type: "program" as const,
      title: "Program ID",
      subtitle: programId.slice(0, 4) + "…" + programId.slice(-4),
      detail: programId,
      byteLength: 32,
    },
    {
      id: "bump",
      type: "bump" as const,
      title: "Canonical Bump",
      subtitle: `[${bump}]`,
      detail: `Seeds + bump byte ${bump} produce an off-curve address`,
      byteLength: 1,
    },
    {
      id: "pda",
      type: "result" as const,
      title: "PDA",
      subtitle: pda.slice(0, 4) + "…" + pda.slice(-4),
      detail: pda,
      byteLength: 32,
    },
  ];
}

export function tryParseSeedsJson(input: string): string[] | null {
  try {
    const parsed = JSON.parse(input.trim());
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    return null;
  }
  return null;
}

export function encodeSeedPreview(raw: string): string {
  try {
    return formatSeedBytes(parseSeed(raw));
  } catch {
    return raw;
  }
}
