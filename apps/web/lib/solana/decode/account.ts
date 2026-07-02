import bs58 from "bs58";
import { bytesToHex, hexDump, parseAccountData, anchorDiscriminator } from "../bytes";

export type AccountDecodeMode = "anchor" | "borsh" | "raw";

export interface AccountDecodeResult {
  mode: AccountDecodeMode;
  byteLength: number;
  hex: string;
  dump: ReturnType<typeof hexDump>;
  discriminator?: {
    hex: string;
    possibleAccount?: string;
  };
  borsh?: {
    schema: string;
    fields: Array<{ name: string; type: string; value: string; offset: number; size: number }>;
    error?: string;
  };
}

const KNOWN_ACCOUNTS = [
  "GlobalState",
  "Vault",
  "User",
  "Config",
  "Pool",
  "Market",
  "Position",
  "Stake",
  "Metadata",
];

async function matchAccountDiscriminator(disc: Uint8Array): Promise<string | undefined> {
  for (const name of KNOWN_ACCOUNTS) {
    const expected = await anchorDiscriminator("account", name);
    if (expected.every((b, i) => b === disc[i])) return name;
  }
  return undefined;
}

function readU8(data: Uint8Array, offset: number): number {
  return data[offset] ?? 0;
}

function readU16(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 2);
  return view.getUint16(0, true);
}

function readU32(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getUint32(0, true);
}

function readU64(data: Uint8Array, offset: number): bigint {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  return view.getBigUint64(0, true);
}

function readI64(data: Uint8Array, offset: number): bigint {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  return view.getBigInt64(0, true);
}

function readBool(data: Uint8Array, offset: number): boolean {
  return readU8(data, offset) !== 0;
}

function readPubkey(data: Uint8Array, offset: number): string {
  const slice = data.slice(offset, offset + 32);
  return bs58.encode(slice);
}

function decodeBorshFields(
  data: Uint8Array,
  schemaJson: string,
): AccountDecodeResult["borsh"] {
  let schema: Array<{ name: string; type: string }>;
  try {
    schema = JSON.parse(schemaJson) as Array<{ name: string; type: string }>;
    if (!Array.isArray(schema)) throw new Error("Schema must be a JSON array");
  } catch (err) {
    return {
      schema: schemaJson,
      fields: [],
      error: err instanceof Error ? err.message : "Invalid schema JSON",
    };
  }

  const fields: NonNullable<AccountDecodeResult["borsh"]>["fields"] = [];
  let offset = 0;

  for (const field of schema) {
    if (offset >= data.length) {
      fields.push({
        name: field.name,
        type: field.type,
        value: "(truncated)",
        offset,
        size: 0,
      });
      break;
    }

    try {
      switch (field.type) {
        case "u8": {
          const v = readU8(data, offset);
          fields.push({ name: field.name, type: field.type, value: String(v), offset, size: 1 });
          offset += 1;
          break;
        }
        case "u16": {
          const v = readU16(data, offset);
          fields.push({ name: field.name, type: field.type, value: String(v), offset, size: 2 });
          offset += 2;
          break;
        }
        case "u32": {
          const v = readU32(data, offset);
          fields.push({ name: field.name, type: field.type, value: String(v), offset, size: 4 });
          offset += 4;
          break;
        }
        case "u64": {
          const v = readU64(data, offset);
          fields.push({ name: field.name, type: field.type, value: v.toString(), offset, size: 8 });
          offset += 8;
          break;
        }
        case "i64": {
          const v = readI64(data, offset);
          fields.push({ name: field.name, type: field.type, value: v.toString(), offset, size: 8 });
          offset += 8;
          break;
        }
        case "bool": {
          const v = readBool(data, offset);
          fields.push({ name: field.name, type: field.type, value: String(v), offset, size: 1 });
          offset += 1;
          break;
        }
        case "pubkey": {
          const v = readPubkey(data, offset);
          fields.push({ name: field.name, type: field.type, value: v, offset, size: 32 });
          offset += 32;
          break;
        }
        default:
          fields.push({
            name: field.name,
            type: field.type,
            value: `(unsupported type: ${field.type})`,
            offset,
            size: 0,
          });
      }
    } catch (err) {
      fields.push({
        name: field.name,
        type: field.type,
        value: err instanceof Error ? err.message : "Decode error",
        offset,
        size: 0,
      });
      break;
    }
  }

  return { schema: schemaJson, fields };
}

export async function decodeAccountData(
  input: string,
  mode: AccountDecodeMode,
  borshSchema?: string,
): Promise<AccountDecodeResult> {
  const data = parseAccountData(input);
  const result: AccountDecodeResult = {
    mode,
    byteLength: data.length,
    hex: bytesToHex(data),
    dump: hexDump(data),
  };

  if (mode === "anchor" && data.length >= 8) {
    const disc = data.slice(0, 8);
    result.discriminator = {
      hex: bytesToHex(disc),
      possibleAccount: await matchAccountDiscriminator(disc),
    };
  }

  if (mode === "borsh" && borshSchema?.trim()) {
    result.borsh = decodeBorshFields(data, borshSchema);
  }

  return result;
}
