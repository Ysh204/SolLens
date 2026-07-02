use crate::RuntimeValue;
use super::helpers::value_to_string;
use crate::solana::decode::decode_event_logs;

pub fn decode_events_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!(
            "decode_events expects exactly 1 argument, got {}",
            args.len()
        ));
    }

    let input = value_to_string(&args[0])?;
    let result = decode_event_logs(&input)?;
    Ok(RuntimeValue::Object(result))
}
