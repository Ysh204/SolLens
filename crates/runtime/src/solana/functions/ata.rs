use std::collections::HashMap;

use crate::RuntimeValue;
use super::helpers::{
    decode_pubkey_bytes, encode_base58, is_ed25519_on_curve, value_to_string,
};
use crate::solana::pda_core::find_program_address;

const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

pub fn ata_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.is_empty() || args.len() > 3 {
        return Err(format!("ata expects 2–3 arguments, got {}", args.len()));
    }

    let wallet_input = value_to_string(&args[0])?;
    let mint_input = value_to_string(&args[1])?;
    let token_program_input = if args.len() == 3 {
        value_to_string(&args[2])?
    } else {
        TOKEN_PROGRAM_ID.to_string()
    };

    let wallet = decode_pubkey_bytes(&wallet_input)?;
    let mint = decode_pubkey_bytes(&mint_input)?;
    let token_program = decode_pubkey_bytes(&token_program_input)?;
    let ata_program = decode_pubkey_bytes(ASSOCIATED_TOKEN_PROGRAM_ID)?;

    let seeds = vec![
        wallet.to_vec(),
        token_program.to_vec(),
        mint.to_vec(),
    ];

    let (ata_bytes, _bump) = find_program_address(&seeds, &ata_program)?;

    let mut result = HashMap::new();
    result.insert("ata".into(), RuntimeValue::Pubkey(encode_base58(&ata_bytes)));
    result.insert("wallet".into(), RuntimeValue::Pubkey(wallet_input));
    result.insert("mint".into(), RuntimeValue::Pubkey(mint_input));
    result.insert(
        "token_program".into(),
        RuntimeValue::Pubkey(token_program_input),
    );
    result.insert(
        "associated_token_program".into(),
        RuntimeValue::Pubkey(ASSOCIATED_TOKEN_PROGRAM_ID.to_string()),
    );
    result.insert("bytes".into(), RuntimeValue::Bytes(ata_bytes.to_vec()));
    result.insert(
        "is_on_curve".into(),
        RuntimeValue::Bool(is_ed25519_on_curve(&ata_bytes)),
    );

    Ok(RuntimeValue::Object(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derive_wsol_ata() {
        let result = ata_fn(vec![
            RuntimeValue::String("11111111111111111111111111111111".into()),
            RuntimeValue::String("So11111111111111111111111111111111111111112".into()),
        ])
        .unwrap();

        match result {
            RuntimeValue::Object(map) => {
                let ata = match map.get("ata").unwrap() {
                    RuntimeValue::Pubkey(s) => s.clone(),
                    RuntimeValue::String(s) => s.clone(),
                    _ => panic!("expected pubkey"),
                };
                assert!(!ata.is_empty());
                assert_eq!(
                    map.get("is_on_curve"),
                    Some(&RuntimeValue::Bool(false))
                );
            }
            _ => panic!("expected object"),
        }
    }
}
