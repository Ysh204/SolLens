use crate::RuntimeValue;

pub fn expect_one_arg<'a>(args: &'a [RuntimeValue], name: &str) -> Result<&'a RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("{name} expects exactly 1 argument, got {}", args.len()));
    }
    Ok(&args[0])
}

pub fn value_to_byte_vec(arg: &RuntimeValue) -> Result<Vec<u8>, String> {
    match arg {
        RuntimeValue::String(s) => Ok(s.as_bytes().to_vec()),
        RuntimeValue::Bytes(b) => Ok(b.clone()),
        _ => Err("expected a String or Bytes argument".to_string()),
    }
}

pub fn value_to_string(arg: &RuntimeValue) -> Result<String, String> {
    match arg {
        RuntimeValue::String(s) => Ok(s.clone()),
        RuntimeValue::Pubkey(s) => Ok(s.clone()),
        RuntimeValue::Signature(s) => Ok(s.clone()),
        _ => Err("expected a String argument".to_string()),
    }
}

pub fn decode_base58(input: &str) -> Result<Vec<u8>, String> {
    bs58::decode(input)
        .into_vec()
        .map_err(|e| format!("invalid base58: {e}"))
}

pub fn decode_pubkey_bytes(input: &str) -> Result<[u8; 32], String> {
    let decoded = decode_base58(input)?;
    decoded
        .try_into()
        .map_err(|v: Vec<u8>| format!("pubkey must be 32 bytes, got {}", v.len()))
}

pub fn encode_base58(bytes: &[u8]) -> String {
    bs58::encode(bytes).into_string()
}

pub fn is_ed25519_on_curve(bytes: &[u8; 32]) -> bool {
    curve25519_dalek::edwards::CompressedEdwardsY(*bytes)
        .decompress()
        .is_some()
}

pub fn anchor_discriminator(namespace: &str, name: &str) -> Vec<u8> {
    use sha2::{Digest, Sha256};
    let preimage = format!("{namespace}:{name}");
    let hash = Sha256::digest(preimage.as_bytes());
    hash[..8].to_vec()
}

/// Parse a seed value from an expression array element.
/// Supports UTF-8 strings, base58 pubkeys, and hex byte literals.
pub fn parse_seed_value(value: &RuntimeValue) -> Result<(Vec<u8>, String, &'static str), String> {
    match value {
        RuntimeValue::String(s) => parse_seed_string(s),
        RuntimeValue::Bytes(b) => Ok((b.clone(), format!("bytes({})", b.len()), "bytes")),
        RuntimeValue::Pubkey(s) => {
            let bytes = decode_pubkey_bytes(s)?;
            Ok((bytes.to_vec(), s.clone(), "pubkey"))
        }
        _ => Err("seed must be a String, Pubkey, or Bytes value".to_string()),
    }
}

fn parse_seed_string(raw: &str) -> Result<(Vec<u8>, String, &'static str), String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err("Seed cannot be empty".to_string());
    }

    // Pubkey: 32–44 char base58
    if trimmed.len() >= 32 && trimmed.len() <= 44 {
        if let Ok(bytes) = decode_pubkey_bytes(trimmed) {
            return Ok((bytes.to_vec(), trimmed.to_string(), "pubkey"));
        }
    }

    // Hex bytes: 0x... or bare hex
    if looks_like_hex(trimmed) {
        let bytes = decode_hex(trimmed)?;
        let desc = format!("bytes({})", bytes.len());
        return Ok((bytes, desc, "bytes"));
    }

    // Default: UTF-8
    let bytes = trimmed.as_bytes().to_vec();
    Ok((bytes, format!("\"{}\"", trimmed), "utf8"))
}

fn looks_like_hex(s: &str) -> bool {
    let cleaned = s.strip_prefix("0x").unwrap_or(s).replace(' ', "");
    cleaned.len() > 2 && cleaned.chars().all(|c| c.is_ascii_hexdigit())
}

pub fn decode_hex(input: &str) -> Result<Vec<u8>, String> {
    let cleaned: String = input
        .strip_prefix("0x")
        .or_else(|| input.strip_prefix("0X"))
        .unwrap_or(input)
        .chars()
        .filter(|c| !c.is_whitespace())
        .collect();

    if cleaned.is_empty() || !cleaned.len().is_multiple_of(2) {
        return Err(format!("Invalid hex: {input}"));
    }

    hex::decode(&cleaned).map_err(|e| format!("Invalid hex: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_utf8_seed() {
        let (bytes, label, kind) =
            parse_seed_value(&RuntimeValue::String("vault".into())).unwrap();
        assert_eq!(bytes, b"vault");
        assert_eq!(kind, "utf8");
        assert!(label.contains("vault"));
    }

    #[test]
    fn parse_pubkey_seed() {
        let (bytes, _, kind) = parse_seed_value(&RuntimeValue::String(
            "11111111111111111111111111111111".into(),
        ))
        .unwrap();
        assert_eq!(bytes.len(), 32);
        assert_eq!(kind, "pubkey");
    }
}
