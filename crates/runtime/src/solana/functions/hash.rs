use sha2::{Sha256, Digest};
use crate::RuntimeValue;

pub fn sha256_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("sha256 expects exactly 1 argument, got {}", args.len()));
    }

    let bytes = match &args[0] {
        RuntimeValue::String(s) => s.as_bytes().to_vec(),
        RuntimeValue::Bytes(b) => b.clone(),
        _ => return Err("sha256 expects a String or Bytes argument".to_string()),
    };

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let result = hasher.finalize();

    Ok(RuntimeValue::Bytes(result.to_vec()))
}
