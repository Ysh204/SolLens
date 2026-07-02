import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction,
  type ParsedInstruction,
} from "@solana/web3.js";
import { RPC_ENDPOINT } from "../../constants";
import { bytesToHex } from "../bytes";

export interface DecodedInstruction {
  index: number;
  programId: string;
  programName?: string;
  type: "parsed" | "partial";
  name?: string;
  data?: string;
  dataHex?: string;
  accounts: string[];
  info?: Record<string, unknown>;
}

export interface TransactionDecodeResult {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  computeUnits?: number;
  status: "success" | "failed";
  err?: string;
  instructions: DecodedInstruction[];
  logs: string[];
  accountKeys: string[];
}

const PROGRAM_NAMES: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token Program",
  "ComputeBudget111111111111111111111111111111": "Compute Budget",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": "Metaplex Metadata",
};

function getProgramName(programId: string): string | undefined {
  return PROGRAM_NAMES[programId];
}

function decodePartialInstruction(
  ix: PartiallyDecodedInstruction,
  index: number,
): DecodedInstruction {
  return {
    index,
    programId: ix.programId.toBase58(),
    programName: getProgramName(ix.programId.toBase58()),
    type: "partial",
    data: ix.data,
    dataHex: bytesToHex(Uint8Array.from(Buffer.from(ix.data, "base64"))),
    accounts: ix.accounts.map((a) => a.toBase58()),
  };
}

function decodeParsedInstruction(ix: ParsedInstruction, index: number): DecodedInstruction {
  return {
    index,
    programId: ix.programId.toBase58(),
    programName: getProgramName(ix.programId.toBase58()),
    type: "parsed",
    name: ix.parsed.type,
    info: ix.parsed.info as Record<string, unknown>,
    accounts: [],
  };
}

function extractComputeUnits(meta: ParsedTransactionWithMeta["meta"]): number | undefined {
  if (!meta?.logMessages) return undefined;
  for (const log of meta.logMessages) {
    const match = log.match(/consumed (\d+) of \d+ compute units/);
    if (match?.[1]) return parseInt(match[1], 10);
  }
  return undefined;
}

export async function decodeTransaction(signature: string): Promise<TransactionDecodeResult> {
  const trimmed = signature.trim();
  if (!trimmed) throw new Error("Transaction signature is required");

  try {
    new PublicKey(trimmed);
  } catch {
    throw new Error("Invalid transaction signature");
  }

  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const tx = await connection.getParsedTransaction(trimmed, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) throw new Error("Transaction not found. Check signature and network.");

  const instructions: DecodedInstruction[] = tx.transaction.message.instructions.map((ix, i) => {
    if ("parsed" in ix) return decodeParsedInstruction(ix, i);
    return decodePartialInstruction(ix, i);
  });

  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey.toBase58(),
  );

  return {
    signature: trimmed,
    slot: tx.slot,
    blockTime: tx.blockTime ?? null,
    fee: tx.meta?.fee ?? 0,
    computeUnits: extractComputeUnits(tx.meta),
    status: tx.meta?.err ? "failed" : "success",
    err: tx.meta?.err ? JSON.stringify(tx.meta.err) : undefined,
    instructions,
    logs: tx.meta?.logMessages ?? [],
    accountKeys,
  };
}

export function formatLamports(lamports: number): string {
  return `${lamports.toLocaleString()} lamports (${(lamports / 1e9).toFixed(9)} SOL)`;
}

export function formatTimestamp(unix: number | null): string {
  if (!unix) return "Unknown";
  return new Date(unix * 1000).toISOString();
}
