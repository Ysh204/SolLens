use std::collections::HashMap;

use crate::RuntimeValue;
use super::super::functions::helpers::anchor_discriminator;
use super::hex::bytes_to_hex_string;
use super::parse_instruction_input;

const KNOWN_INSTRUCTIONS: &[&str] = &[
    "initialize",
    "transfer",
    "mint",
    "burn",
    "swap",
    "deposit",
    "withdraw",
    "close",
    "update",
];

pub fn decode_instruction_data(input: &str) -> Result<HashMap<String, RuntimeValue>, String> {
    let data = parse_instruction_input(input)?;

    let mut result = HashMap::new();
    result.insert("byte_length".into(), RuntimeValue::Number(data.len() as u64));
    result.insert("hex".into(), RuntimeValue::String(bytes_to_hex_string(&data)));

    if data.len() >= 8 {
        let disc = &data[..8];
        let remaining = &data[8..];
        let possible = match_instruction_discriminator(disc);

        let mut disc_obj = HashMap::new();
        disc_obj.insert("hex".into(), RuntimeValue::String(bytes_to_hex_string(disc)));
        if let Some(name) = possible {
            disc_obj.insert("possible_instruction".into(), RuntimeValue::String(name));
        }
        result.insert("discriminator".into(), RuntimeValue::Object(disc_obj));
        result.insert(
            "remaining_hex".into(),
            RuntimeValue::String(bytes_to_hex_string(remaining)),
        );
    }

    if data.len() > 8 {
        let u8_args: Vec<RuntimeValue> = (8..data.len().min(24))
            .map(|offset| {
                let mut item = HashMap::new();
                item.insert("offset".into(), RuntimeValue::Number(offset as u64));
                item.insert(
                    "value".into(),
                    RuntimeValue::Number(data[offset] as u64),
                );
                RuntimeValue::Object(item)
            })
            .collect();
        result.insert("u8_args".into(), RuntimeValue::Array(u8_args));
    }

    Ok(result)
}

fn match_instruction_discriminator(disc: &[u8]) -> Option<String> {
    KNOWN_INSTRUCTIONS
        .iter()
        .find(|name| anchor_discriminator("global", name) == disc)
        .map(|s| (*s).to_string())
}
