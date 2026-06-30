use crate::RuntimeValue;
use rust_decimal::Decimal;
use rust_decimal::prelude::{FromPrimitive, ToPrimitive};

pub fn lamports_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("lamports expects exactly 1 argument, got {}", args.len()));
    }

    let decimal_val = match &args[0] {
        RuntimeValue::Decimal(d) => *d,
        RuntimeValue::Number(n) => Decimal::from_u64(*n).unwrap_or_default(),
        _ => return Err("lamports expects a Decimal or Number argument".to_string()),
    };

    let multiplier = Decimal::from_u64(1_000_000_000).unwrap();
    let result = decimal_val * multiplier;

    let lamports = result.to_u64()
        .ok_or_else(|| "Lamports calculation overflowed u64".to_string())?;

    Ok(RuntimeValue::Number(lamports))
}
