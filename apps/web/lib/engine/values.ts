import type { SuccessValue } from "../types";

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

function assertValue(value: SuccessValue | null | undefined, expected: string): SuccessValue {
  if (!value || typeof value.type !== "string") {
    throw new EngineError(`Expected ${expected}, got undefined`);
  }
  return value;
}

export function unwrapObject(value: SuccessValue): Record<string, SuccessValue> {
  value = assertValue(value, "Object");
  if (value.type !== "Object" || typeof value.value !== "object" || value.value === null) {
    throw new EngineError(`Expected Object, got ${value.type}`);
  }
  return value.value as Record<string, SuccessValue>;
}

export function unwrapArray(value: SuccessValue): SuccessValue[] {
  value = assertValue(value, "Array");
  if (value.type !== "Array" || !Array.isArray(value.value)) {
    throw new EngineError(`Expected Array, got ${value.type}`);
  }
  return value.value as SuccessValue[];
}

export function unwrapString(value: SuccessValue): string {
  value = assertValue(value, "String-like value");
  if (
    (value.type === "String" || value.type === "Pubkey" || value.type === "Signature") &&
    typeof value.value === "string"
  ) {
    return value.value;
  }
  throw new EngineError(`Expected String-like value, got ${value.type}`);
}

export function unwrapNumber(value: SuccessValue): number {
  value = assertValue(value, "Number");
  if (value.type === "Number" && typeof value.value === "number") {
    return value.value;
  }
  throw new EngineError(`Expected Number, got ${value.type}`);
}

export function unwrapBool(value: SuccessValue): boolean {
  value = assertValue(value, "Bool");
  if (value.type === "Bool" && typeof value.value === "boolean") {
    return value.value;
  }
  throw new EngineError(`Expected Bool, got ${value.type}`);
}

export function unwrapOptionalString(value: SuccessValue | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return unwrapString(value);
  } catch {
    return undefined;
  }
}

export function unwrapBytes(value: SuccessValue): Uint8Array {
  value = assertValue(value, "Bytes");
  if (value.type === "Bytes" && Array.isArray(value.value)) {
    return Uint8Array.from(value.value as number[]);
  }
  throw new EngineError(`Expected Bytes, got ${value.type}`);
}

export function formatEngineValue(value: SuccessValue, indent = 0): string {
  if (!value || typeof value.type !== "string") {
    const pad = "  ".repeat(indent);
    return `${pad}<undefined>`;
  }

  const pad = "  ".repeat(indent);

  switch (value.type) {
    case "Object": {
      const obj = unwrapObject(value);
      const lines = Object.entries(obj).map(
        ([key, child]) => `${pad}  ${key}: ${formatEngineValue(child, indent + 1).trimStart()}`,
      );
      return `${pad}{\n${lines.join("\n")}\n${pad}}`;
    }
    case "Array": {
      const items = unwrapArray(value).map((item) => formatEngineValue(item, indent + 1));
      return `${pad}[\n${items.map((i) => `${pad}  ${i.trimStart()}`).join("\n")}\n${pad}]`;
    }
    case "Bytes":
      return `${pad}0x${Array.from(unwrapBytes(value))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
    case "Number":
      return `${pad}${unwrapNumber(value).toLocaleString("en-US")}`;
    case "Pubkey":
    case "Signature":
    case "String":
      return `${pad}${unwrapString(value)}`;
    case "Bool":
      return `${pad}${unwrapBool(value)}`;
    default:
      return `${pad}${String(value.value)}`;
  }
}

export function formatEngineResult(value: SuccessValue): string {
  if (!value || typeof value.type !== "string") {
    return "[Undefined]\n<undefined>";
  }
  return `[${value.type}]\n${formatEngineValue(value)}`;
}

export function wrapJsonToEngineValue(val: any): SuccessValue {
  if (val === null || val === undefined) {
    return { type: "Null", value: null };
  }
  if (typeof val === "boolean") {
    return { type: "Bool", value: val };
  }
  if (typeof val === "number") {
    return { type: "Number", value: val };
  }
  if (typeof val === "string") {
    if (val.length === 88 && !val.includes(" ")) {
      return { type: "Signature", value: val };
    }
    if (val.length >= 32 && val.length <= 44 && !val.includes(" ")) {
      return { type: "Pubkey", value: val };
    }
    return { type: "String", value: val };
  }
  if (val instanceof Uint8Array || ArrayBuffer.isView(val)) {
    return { type: "Bytes", value: Array.from(val as any) };
  }
  if (Array.isArray(val)) {
    return { type: "Array", value: val.map(wrapJsonToEngineValue) };
  }
  if (typeof val === "object") {
    const obj: Record<string, SuccessValue> = {};
    for (const [k, v] of Object.entries(val)) {
      obj[k] = wrapJsonToEngineValue(v);
    }
    return { type: "Object", value: obj };
  }
  return { type: "Null", value: null };
}
