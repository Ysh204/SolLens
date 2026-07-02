use crate::RuntimeValue;
use super::helpers::value_to_string;
use crate::solana::decode::decode_instruction_data;

pub fn decode_instruction_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!(
            "decode_instruction expects exactly 1 argument, got {}",
            args.len()
        ));
    }

    let input = value_to_string(&args[0])?;
    let result = decode_instruction_data(&input)?;
    Ok(RuntimeValue::Object(result))
}
