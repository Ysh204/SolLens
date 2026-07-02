use crate::RuntimeValue;
use super::helpers::{
    decode_pubkey_bytes, encode_base58, expect_one_arg, is_ed25519_on_curve, value_to_string,
};

pub fn pubkey_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let input = value_to_string(expect_one_arg(&args, "pubkey")?)?;
    let bytes = decode_pubkey_bytes(&input)?;
    Ok(RuntimeValue::Pubkey(encode_base58(&bytes)))
}

pub fn is_on_curve_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let input = value_to_string(expect_one_arg(&args, "is_on_curve")?)?;
    let bytes = decode_pubkey_bytes(&input)?;
    Ok(RuntimeValue::Bool(is_ed25519_on_curve(&bytes)))
}

pub fn bytes_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let input = value_to_string(expect_one_arg(&args, "bytes")?)?;
    let bytes = decode_pubkey_bytes(&input)?;
    Ok(RuntimeValue::Bytes(bytes.to_vec()))
}

pub fn pubkey_from_bytes_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let arg = expect_one_arg(&args, "pubkey_from_bytes")?;
    let raw = match arg {
        RuntimeValue::Bytes(b) => b.clone(),
        _ => return Err("pubkey_from_bytes expects a Bytes argument".to_string()),
    };
    let bytes: [u8; 32] = raw
        .try_into()
        .map_err(|v: Vec<u8>| format!("pubkey must be 32 bytes, got {}", v.len()))?;
    Ok(RuntimeValue::Pubkey(encode_base58(&bytes)))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SYSTEM_PROGRAM: &str = "11111111111111111111111111111111";

    #[test]
    fn system_program_is_on_curve() {
        let result =
            is_on_curve_fn(vec![RuntimeValue::String(SYSTEM_PROGRAM.to_string())]).unwrap();
        assert_eq!(result, RuntimeValue::Bool(true));
    }

    #[test]
    fn pubkey_roundtrip() {
        let encoded = pubkey_fn(vec![RuntimeValue::String(SYSTEM_PROGRAM.to_string())]).unwrap();
        let decoded = bytes_fn(vec![encoded.clone()]).unwrap();
        let restored = pubkey_from_bytes_fn(vec![decoded]).unwrap();
        assert_eq!(restored, encoded);
    }
}
