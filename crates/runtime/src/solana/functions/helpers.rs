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
