import type { SuccessValue } from "../../types";
import {
  unwrapArray,
  unwrapNumber,
  unwrapObject,
  unwrapOptionalString,
  unwrapString,
} from "../../engine/values";

export interface EngineHexDumpLine {
  offset: number;
  hex: string;
  ascii: string;
}

export interface EngineDiscriminator {
  hex: string;
  possibleAccount?: string;
  possibleInstruction?: string;
  possibleEvent?: string;
}

function pickField(obj: Record<string, SuccessValue>, ...names: string[]): SuccessValue {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) return value;
  }
  throw new Error(`Result is missing fields: ${names.join(" / ")}`);
}

function optionalField(
  obj: Record<string, SuccessValue>,
  ...names: string[]
): SuccessValue | undefined {
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined) return value;
  }
  return undefined;
}

export function hexDumpFromEngine(value: SuccessValue): EngineHexDumpLine[] {
  return unwrapArray(value).map((lineVal) => {
    const line = unwrapObject(lineVal);
    return {
      offset: unwrapNumber(pickField(line, "offset")),
      hex: unwrapString(pickField(line, "hex")),
      ascii: unwrapString(pickField(line, "ascii")),
    };
  });
}

export function discriminatorFromEngine(value: SuccessValue): EngineDiscriminator {
  const disc = unwrapObject(value);
  return {
    hex: unwrapString(pickField(disc, "hex")),
    possibleAccount: unwrapOptionalString(optionalField(disc, "possible_account", "possibleAccount")),
    possibleInstruction: unwrapOptionalString(
      optionalField(disc, "possible_instruction", "possibleInstruction"),
    ),
    possibleEvent: unwrapOptionalString(optionalField(disc, "possible_event", "possibleEvent")),
  };
}

export function borshFieldsFromEngine(value: SuccessValue): {
  schema: string;
  fields: Array<{ name: string; type: string; value: string; offset: number; size: number }>;
  error?: string;
} {
  const borsh = unwrapObject(value);
  const fields = unwrapArray(pickField(borsh, "fields")).map((fieldVal) => {
    const field = unwrapObject(fieldVal);
    return {
      name: unwrapString(pickField(field, "name")),
      type: unwrapString(pickField(field, "type")),
      value: unwrapString(pickField(field, "value")),
      offset: unwrapNumber(pickField(field, "offset")),
      size: unwrapNumber(pickField(field, "size")),
    };
  });

  return {
    schema: unwrapString(pickField(borsh, "schema")),
    fields,
    error: unwrapOptionalString(optionalField(borsh, "error")),
  };
}

export function buildDecodeAccountExpression(
  input: string,
  mode: string,
  schema?: string,
): string {
  const data = JSON.stringify(input.trim());
  const modeArg = JSON.stringify(mode);
  if (schema?.trim()) {
    return `decode_account(${data}, ${modeArg}, ${JSON.stringify(schema.trim())})`;
  }
  return `decode_account(${data}, ${modeArg})`;
}

export function buildDecodeInstructionExpression(input: string): string {
  return `decode_instruction(${JSON.stringify(input.trim())})`;
}

export function buildDecodeEventsExpression(input: string): string {
  return `decode_events(${JSON.stringify(input)})`;
}
