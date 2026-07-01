use crate::RuntimeValue;
use super::helpers::{expect_one_arg, value_to_byte_vec, value_to_string, decode_base58, encode_base58};

pub fn base58_encode_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let arg = expect_one_arg(&args, "base58_encode")?;
    let bytes = value_to_byte_vec(arg)?;
    Ok(RuntimeValue::String(encode_base58(&bytes)))
}

pub fn base58_decode_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let input = value_to_string(expect_one_arg(&args, "base58_decode")?)?;
    let bytes = decode_base58(&input)?;
    Ok(RuntimeValue::Bytes(bytes))
}

pub fn is_base58_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let input = value_to_string(expect_one_arg(&args, "is_base58")?)?;
    Ok(RuntimeValue::Bool(decode_base58(&input).is_ok()))
}

pub fn bytes_to_base58_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let arg = expect_one_arg(&args, "bytes_to_base58")?;
    let bytes = match arg {
        RuntimeValue::Bytes(b) => b.clone(),
        _ => return Err("bytes_to_base58 expects a Bytes argument".to_string()),
    };
    Ok(RuntimeValue::String(encode_base58(&bytes)))
}
