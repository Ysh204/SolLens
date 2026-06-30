use crate::RuntimeValue;

pub fn rent_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("rent expects exactly 1 argument, got {}", args.len()));
    }

    let data_len = match &args[0] {
        RuntimeValue::Number(n) => *n as usize,
        _ => return Err("rent expects a Number argument (data size in bytes)".to_string()),
    };

    let lamports = (data_len + 128) as u64 * 3480 * 2;

    Ok(RuntimeValue::Number(lamports))
}
