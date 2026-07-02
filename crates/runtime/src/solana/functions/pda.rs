use std::collections::HashMap;

use crate::RuntimeValue;
use super::helpers::{
    decode_pubkey_bytes, encode_base58, parse_seed_value,
    value_to_string,
};
use crate::solana::pda_core::find_program_address;

pub fn pda_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 2 {
        return Err(format!("pda expects exactly 2 arguments, got {}", args.len()));
    }

    let seeds_array = match &args[0] {
        RuntimeValue::Array(items) => items,
        _ => return Err("pda expects an Array of seeds as the first argument".to_string()),
    };

    if seeds_array.is_empty() {
        return Err("At least one seed is required".to_string());
    }

    let program_input = value_to_string(&args[1])?;
    let program_id = decode_pubkey_bytes(&program_input)?;

    let mut parsed_seeds: Vec<Vec<u8>> = Vec::with_capacity(seeds_array.len());
    let mut seed_objects: Vec<RuntimeValue> = Vec::with_capacity(seeds_array.len());

    for (i, seed_val) in seeds_array.iter().enumerate() {
        let (bytes, label, kind) = parse_seed_value(seed_val)?;
        parsed_seeds.push(bytes.clone());
        seed_objects.push(RuntimeValue::Object({
            let mut m = HashMap::new();
            m.insert("index".into(), RuntimeValue::Number(i as u64));
            m.insert("kind".into(), RuntimeValue::String(kind.to_string()));
            m.insert("label".into(), RuntimeValue::String(label));
            m.insert("bytes".into(), RuntimeValue::Bytes(bytes));
            m
        }));
    }

    let (pda_bytes, bump) = find_program_address(&parsed_seeds, &program_id)?;

    let mut result = HashMap::new();
    result.insert("pda".into(), RuntimeValue::Pubkey(encode_base58(&pda_bytes)));
    result.insert("bump".into(), RuntimeValue::Number(bump as u64));
    result.insert("program_id".into(), RuntimeValue::Pubkey(program_input));
    result.insert("bytes".into(), RuntimeValue::Bytes(pda_bytes.to_vec()));
    result.insert("seeds".into(), RuntimeValue::Array(seed_objects));

    Ok(RuntimeValue::Object(result))
}
