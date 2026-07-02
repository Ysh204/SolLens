use std::collections::HashMap;

use crate::RuntimeValue;
use super::helpers::value_to_string;
use crate::solana::decode::decode_account_data;

pub fn decode_account_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.is_empty() || args.len() > 3 {
        return Err(format!(
            "decode_account expects 1–3 arguments, got {}",
            args.len()
        ));
    }

    let input = value_to_string(&args[0])?;
    let mode = if args.len() >= 2 {
        value_to_string(&args[1])?
    } else {
        "anchor".to_string()
    };
    let schema = if args.len() == 3 {
        Some(value_to_string(&args[2])?)
    } else {
        None
    };

    let result = decode_account_data(&input, &mode, schema.as_deref())?;
    Ok(RuntimeValue::Object(result))
}

/// Alias: account(data, mode?, schema?) — decode raw account bytes.
pub fn account_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    decode_account_fn(args)
}

pub fn decode_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() < 2 {
        return Err(format!("decode expects at least 2 arguments, got {}", args.len()));
    }

    let input = value_to_string(&args[0])?;
    let kind = value_to_string(&args[1])?.to_ascii_lowercase();

    match kind.as_str() {
        "account" => {
            let mode = if args.len() >= 3 {
                value_to_string(&args[2])?
            } else {
                "anchor".to_string()
            };
            let schema = if args.len() == 4 {
                Some(value_to_string(&args[3])?)
            } else {
                None
            };
            Ok(RuntimeValue::Object(decode_account_data(
                &input,
                &mode,
                schema.as_deref(),
            )?))
        }
        "instruction" | "ix" => Ok(RuntimeValue::Object(
            crate::solana::decode::decode_instruction_data(&input)?,
        )),
        "events" | "event" | "logs" => Ok(RuntimeValue::Object(
            crate::solana::decode::decode_event_logs(&input)?,
        )),
        other => Err(format!(
            "decode kind must be account, instruction, or events — got '{other}'"
        )),
    }
}

pub fn hex_dump_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("hex_dump expects exactly 1 argument, got {}", args.len()));
    }

    let data = match &args[0] {
        RuntimeValue::Bytes(b) => b.clone(),
        RuntimeValue::String(s) => crate::solana::decode::parse_raw_data(s)?,
        _ => return Err("hex_dump expects Bytes or String data".to_string()),
    };

    let mut result = HashMap::new();
    result.insert(
        "dump".into(),
        RuntimeValue::Array(crate::solana::decode::hex::hex_dump_lines(&data, 16)),
    );
    result.insert("byte_length".into(), RuntimeValue::Number(data.len() as u64));
    Ok(RuntimeValue::Object(result))
}
