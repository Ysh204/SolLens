import type { SuccessValue } from "../../types";
import { unwrapArray, unwrapNumber, unwrapObject, unwrapString } from "../../engine/values";
import { buildDecodeEventsExpression, discriminatorFromEngine } from "./engine";

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

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) return value;
  }
  throw new Error(`Event decode result is missing fields: ${names.join(" / ")}`);
}

function eventResultFromEngine(result: SuccessValue): EventDecodeResult {
  const obj = unwrapObject(result);
  const events = unwrapArray(pickField(obj, "events")).map((eventVal) => {
    const event = unwrapObject(eventVal);
    const decoded: DecodedEvent = {
      index: unwrapNumber(pickField(event, "index")),
      rawBase64: unwrapString(pickField(event, "raw_base64", "rawBase64")),
      hex: unwrapString(pickField(event, "hex")),
      logLine: unwrapString(pickField(event, "log_line", "logLine")),
    };

    const program = event.program;
    if (program) {
      decoded.program = unwrapString(program);
    }

    if (event.discriminator) {
      const disc = discriminatorFromEngine(event.discriminator);
      decoded.discriminator = {
        hex: disc.hex,
        possibleEvent: disc.possibleEvent,
      };
    }

    const dataHex = event.data_hex ?? event.dataHex;
    if (dataHex) {
      decoded.dataHex = unwrapString(dataHex);
    }

    return decoded;
  });

  return {
    events,
    totalLogLines: unwrapNumber(pickField(obj, "total_log_lines", "totalLogLines")),
    programDataLines: unwrapNumber(pickField(obj, "program_data_lines", "programDataLines")),
  };
}

export async function decodeEventLogs(input: string): Promise<EventDecodeResult> {
  const { getEngineClient, evaluateWithClient } = await import("../../engine/client");
  const client = await getEngineClient();
  const expr = buildDecodeEventsExpression(input);
  const { result, error } = evaluateWithClient(client, expr);
  if (error) throw new Error(error.message);
  if (!result) throw new Error("No result from engine");
  return eventResultFromEngine(result);
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
