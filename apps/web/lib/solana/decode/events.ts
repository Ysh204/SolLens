import { bytesToHex, anchorDiscriminator } from "../bytes";

export interface DecodedEvent {
  index: number;
  program?: string;
  rawBase64: string;
  hex: string;
  discriminator?: {
    hex: string;
    possibleEvent?: string;
  };
  dataHex?: string;
  logLine: string;
}

export interface EventDecodeResult {
  events: DecodedEvent[];
  totalLogLines: number;
  programDataLines: number;
}

const KNOWN_EVENTS = [
  "DepositEvent",
  "WithdrawEvent",
  "SwapEvent",
  "TransferEvent",
  "InitializeEvent",
  "CloseEvent",
  "UpdateEvent",
  "MintEvent",
  "BurnEvent",
];

const PROGRAM_DATA_RE = /^Program data: (.+)$/;
const PROGRAM_LOG_RE = /^Program ([1-9A-HJ-NP-Za-km-z]{32,44}) invoke \[(\d+)\]/;

async function matchEventDiscriminator(disc: Uint8Array): Promise<string | undefined> {
  for (const name of KNOWN_EVENTS) {
    const expected = await anchorDiscriminator("event", name);
    if (expected.every((b, i) => b === disc[i])) return name;
  }
  return undefined;
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));
}

export async function decodeEventLogs(input: string): Promise<EventDecodeResult> {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const events: DecodedEvent[] = [];
  let programDataLines = 0;
  let currentProgram: string | undefined;

  for (const line of lines) {
    const invokeMatch = line.match(PROGRAM_LOG_RE);
    if (invokeMatch?.[1]) {
      currentProgram = invokeMatch[1];
    }

    const dataMatch = line.match(PROGRAM_DATA_RE);
    if (!dataMatch?.[1]) continue;

    programDataLines++;
    const rawBase64 = dataMatch[1];
    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(rawBase64);
    } catch {
      continue;
    }

    const event: DecodedEvent = {
      index: events.length,
      program: currentProgram,
      rawBase64,
      hex: bytesToHex(bytes),
      logLine: line,
    };

    if (bytes.length >= 8) {
      const disc = bytes.slice(0, 8);
      const data = bytes.slice(8);
      event.discriminator = {
        hex: bytesToHex(disc),
        possibleEvent: await matchEventDiscriminator(disc),
      };
      event.dataHex = bytesToHex(data);
    }

    events.push(event);
  }

  return {
    events,
    totalLogLines: lines.length,
    programDataLines,
  };
}

export const EXAMPLE_EVENT_LOGS = `Program 11111111111111111111111111111111 invoke [1]
Program log: Instruction: Transfer
Program 11111111111111111111111111111111 consumed 150 of 200000 compute units
Program 11111111111111111111111111111111 success`;

export const EXAMPLE_INSTRUCTION_HEX = "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000064";

export const EXAMPLE_BORSH_SCHEMA = `[
  { "name": "discriminator", "type": "u64" },
  { "name": "authority", "type": "pubkey" },
  { "name": "amount", "type": "u64" }
]`;
