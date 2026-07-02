use std::collections::HashMap;

use crate::RuntimeValue;
use super::super::functions::helpers::anchor_discriminator;
use super::borsh::decode_borsh_fields;
use super::hex::{bytes_to_hex_string, hex_dump_lines};
use super::parse_raw_data;

const KNOWN_ACCOUNTS: &[&str] = &[
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

pub fn decode_account_data(
    input: &str,
    mode: &str,
    borsh_schema: Option<&str>,
) -> Result<HashMap<String, RuntimeValue>, String> {
    let data = parse_raw_data(input)?;
    let mode = normalize_mode(mode);

    let mut result = HashMap::new();
    result.insert("mode".into(), RuntimeValue::String(mode.to_string()));
    result.insert("byte_length".into(), RuntimeValue::Number(data.len() as u64));
    result.insert("hex".into(), RuntimeValue::String(bytes_to_hex_string(&data)));
    result.insert(
        "dump".into(),
        RuntimeValue::Array(hex_dump_lines(&data, 16)),
    );

    if mode == "anchor" && data.len() >= 8 {
        let disc = &data[..8];
        let possible = match_account_discriminator(disc);
        let mut disc_obj = HashMap::new();
        disc_obj.insert("hex".into(), RuntimeValue::String(bytes_to_hex_string(disc)));
        if let Some(name) = possible {
            disc_obj.insert("possible_account".into(), RuntimeValue::String(name));
        }
        result.insert("discriminator".into(), RuntimeValue::Object(disc_obj));
    }

    if mode == "borsh" {
        if let Some(schema) = borsh_schema.filter(|s| !s.trim().is_empty()) {
            match decode_borsh_fields(&data, schema) {
                Ok(borsh) => {
                    result.insert("borsh".into(), RuntimeValue::Object(borsh));
                }
                Err(err) => {
                    let mut borsh = HashMap::new();
                    borsh.insert("schema".into(), RuntimeValue::String(schema.to_string()));
                    borsh.insert("fields".into(), RuntimeValue::Array(vec![]));
                    borsh.insert("error".into(), RuntimeValue::String(err));
                    result.insert("borsh".into(), RuntimeValue::Object(borsh));
                }
            }
        }
    }

    Ok(result)
}

fn normalize_mode(mode: &str) -> &str {
    match mode.trim().to_ascii_lowercase().as_str() {
        "borsh" => "borsh",
        "raw" => "raw",
        _ => "anchor",
    }
}

fn match_account_discriminator(disc: &[u8]) -> Option<String> {
    KNOWN_ACCOUNTS
        .iter()
        .find(|name| anchor_discriminator("account", name) == disc)
        .map(|s| (*s).to_string())
}
