import type { SuccessValue } from "../types";
import { EngineError, unwrapArray, unwrapBytes, unwrapNumber, unwrapObject, unwrapString } from "../engine/values";

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

function normalizeSeedsExpression(seedsInput: string): string {
  const trimmed = seedsInput.trim();
  if (!trimmed) return "[]";
  if (trimmed.startsWith("[")) return trimmed;

  const items = trimmed
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => JSON.stringify(s));

  return `[${items.join(", ")}]`;
}

export function buildPdaExpression(seedsInput: string, programIdInput: string): string {
  const seedsExpr = normalizeSeedsExpression(seedsInput);
  const programId = programIdInput.trim();
  return `pda(${seedsExpr}, ${JSON.stringify(programId)})`;
}

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) {
      return value;
    }
  }
  throw new Error(`PDA result is missing fields: ${names.join(" / ")}`);
}

export function pdaResultFromEngine(result: SuccessValue): PdaResult {
  const obj = unwrapObject(result);
  const seeds = unwrapArray(pickField(obj, "seeds", "seed_objects", "seedObjects")).map((seedVal) => {
    const seed = unwrapObject(seedVal);
    const kind = unwrapString(seed.kind) as SeedKind;
    const label = unwrapString(seed.label);
    const bytes = unwrapBytes(seed.bytes);
    return {
      raw: kind === "utf8" ? label.replace(/^"|"$/g, "") : label,
      kind,
      bytes,
      label,
    };
  });

  return {
    pda: unwrapString(pickField(obj, "pda")),
    bump: unwrapNumber(pickField(obj, "bump")),
    seeds,
    bytes: unwrapBytes(pickField(obj, "bytes")),
  };
}

export function derivePdaFromEngine(
  evaluate: (input: string) => SuccessValue,
  seedsInput: string,
  programIdInput: string,
): PdaResult {
  const expr = buildPdaExpression(seedsInput, programIdInput);
  const result = evaluate(expr);
  return pdaResultFromEngine(result);
}

export function formatSeedBytes(seed: ParsedSeed): string {
  if (seed.kind === "pubkey") {
    return seed.label;
  }
  if (seed.kind === "utf8") {
    return `${seed.label} → 0x${Array.from(seed.bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return `0x${Array.from(seed.bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
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
  return raw;
}
