pub mod account;
pub mod borsh;
pub mod events;
pub mod hex;
pub mod instruction;

pub use account::decode_account_data;
pub use events::decode_event_logs;
pub use instruction::decode_instruction_data;

use super::functions::helpers::{decode_base58, decode_hex};

/// Parse account or instruction input: hex (0x…) or base58.
pub fn parse_raw_data(input: &str) -> Result<Vec<u8>, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Data is empty".to_string());
    }

    let hex_candidate = trimmed
        .strip_prefix("0x")
        .or_else(|| trimmed.strip_prefix("0X"))
        .unwrap_or(trimmed);

    if looks_like_hex(hex_candidate) {
        return decode_hex(trimmed);
    }

    decode_base58(trimmed).map_err(|_| "Expected base58 data or hex (0x…)".to_string())
}

/// Parse instruction input: hex, or standard base64 payload.
pub fn parse_instruction_input(input: &str) -> Result<Vec<u8>, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Instruction data is empty".to_string());
    }

    if trimmed.starts_with("0x") || trimmed.starts_with("0X") || looks_like_hex(trimmed) {
        return decode_hex(trimmed);
    }

    if let Ok(bytes) = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        trimmed,
    ) {
        return Ok(bytes);
    }

    decode_hex(trimmed)
}

fn looks_like_hex(s: &str) -> bool {
    let cleaned: String = s.chars().filter(|c| !c.is_whitespace()).collect();
    cleaned.len() > 2 && cleaned.chars().all(|c| c.is_ascii_hexdigit())
}
