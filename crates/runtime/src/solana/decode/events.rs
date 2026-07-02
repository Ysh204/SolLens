use std::collections::HashMap;

use crate::RuntimeValue;
use super::super::functions::helpers::anchor_discriminator;
use super::hex::bytes_to_hex_string;

const KNOWN_EVENTS: &[&str] = &[
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

pub fn decode_event_logs(input: &str) -> Result<HashMap<String, RuntimeValue>, String> {
    let lines: Vec<&str> = input
        .split(['\r', '\n'])
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();

    let mut events = Vec::new();
    let mut program_data_lines = 0u64;
    let mut current_program: Option<String> = None;

    for line in &lines {
        if let Some(program) = parse_program_invoke(line) {
            current_program = Some(program);
        }

        let Some(raw_base64) = parse_program_data(line) else {
            continue;
        };

        program_data_lines += 1;
        let bytes = match base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD,
            raw_base64,
        ) {
            Ok(b) => b,
            Err(_) => continue,
        };

        let mut event = HashMap::new();
        event.insert("index".into(), RuntimeValue::Number(events.len() as u64));
        if let Some(program) = &current_program {
            event.insert("program".into(), RuntimeValue::Pubkey(program.clone()));
        }
        event.insert(
            "raw_base64".into(),
            RuntimeValue::String(raw_base64.to_string()),
        );
        event.insert(
            "hex".into(),
            RuntimeValue::String(bytes_to_hex_string(&bytes)),
        );
        event.insert("log_line".into(), RuntimeValue::String((*line).to_string()));

        if bytes.len() >= 8 {
            let disc = &bytes[..8];
            let data = &bytes[8..];
            let possible = match_event_discriminator(disc);

            let mut disc_obj = HashMap::new();
            disc_obj.insert("hex".into(), RuntimeValue::String(bytes_to_hex_string(disc)));
            if let Some(name) = possible {
                disc_obj.insert("possible_event".into(), RuntimeValue::String(name));
            }
            event.insert("discriminator".into(), RuntimeValue::Object(disc_obj));
            event.insert(
                "data_hex".into(),
                RuntimeValue::String(bytes_to_hex_string(data)),
            );
        }

        events.push(RuntimeValue::Object(event));
    }

    let mut result = HashMap::new();
    result.insert("events".into(), RuntimeValue::Array(events));
    result.insert(
        "total_log_lines".into(),
        RuntimeValue::Number(lines.len() as u64),
    );
    result.insert(
        "program_data_lines".into(),
        RuntimeValue::Number(program_data_lines),
    );
    Ok(result)
}

fn parse_program_data(line: &str) -> Option<&str> {
    line.strip_prefix("Program data: ")
}

fn parse_program_invoke(line: &str) -> Option<String> {
    let rest = line.strip_prefix("Program ")?;
    let end = rest.find(" invoke [")?;
    let program = &rest[..end];
    if program.len() < 32 || program.len() > 44 {
        return None;
    }
    if program.chars().all(is_base58_char) {
        Some(program.to_string())
    } else {
        None
    }
}

fn is_base58_char(c: char) -> bool {
    matches!(
        c,
        '1'..='9'
            | 'A'..='H'
            | 'J'..='N'
            | 'P'..='Z'
            | 'a'..='k'
            | 'm'..='z'
    )
}

fn match_event_discriminator(disc: &[u8]) -> Option<String> {
    KNOWN_EVENTS
        .iter()
        .find(|name| anchor_discriminator("event", name) == disc)
        .map(|s| (*s).to_string())
}
