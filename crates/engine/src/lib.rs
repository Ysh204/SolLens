pub mod value;
pub mod error;
pub mod registry;
pub mod evaluator;
pub mod engine;

pub use engine::{evaluate, function_catalog, set_transaction_data, get_transaction_data};
pub use registry::Registry;
pub use value::Value;
pub use error::EngineError;

pub fn list_functions() -> Vec<String> {
    Registry::new().function_names()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn milestone_1_echo() {
        let result = evaluate(r#"echo("hello")"#).unwrap();
        assert_eq!(result.to_string(), "hello");
    }

    #[test]
    fn milestone_2_upper() {
        let result = evaluate(r#"upper("hello")"#).unwrap();
        assert_eq!(result.to_string(), "HELLO");
    }

    #[test]
    fn milestone_3_sha256() {
        let result = evaluate(r#"sha256("hello")"#).unwrap();
        assert_eq!(
            result.to_string(),
            "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }

    #[test]
    fn milestone_4_lamports() {
        let result = evaluate("lamports(1.5)").unwrap();
        assert_eq!(result.to_string(), "1500000000");
    }

    #[test]
    fn milestone_5_rent() {
        let result = evaluate("rent(128)").unwrap();
        assert_eq!(result.to_string(), "1781760");
    }

    #[test]
    fn unknown_function_suggests() {
        let err = evaluate("sha25(\"hello\")").unwrap_err();
        assert!(err.message.contains("Unknown function"));
        assert!(err.help.unwrap().contains("sha256"));
    }

    #[test]
    fn binary_arithmetic() {
        let result = evaluate("2 + 3").unwrap();
        assert_eq!(result.to_string(), "5");

        let result = evaluate("10 * 5").unwrap();
        assert_eq!(result.to_string(), "50");
    }

    #[test]
    fn number_literal() {
        let result = evaluate("42").unwrap();
        assert_eq!(result.to_string(), "42");
    }

    #[test]
    fn string_literal() {
        let result = evaluate(r#""hello world""#).unwrap();
        assert_eq!(result.to_string(), "hello world");
    }

    #[test]
    fn array_index_access() {
        let result = evaluate(r#"["vault", "mint"][1]"#).unwrap();
        assert_eq!(result.to_string(), "mint");
    }

    #[test]
    fn object_index_access_on_pda() {
        let result = evaluate(r#"pda(["vault"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")["bump"]"#).unwrap();
        assert_eq!(result.to_string(), "254");
    }

    #[test]
    fn print_function_list_includes_solana_functions() {
        let functions = list_functions();
        println!("{}", functions.join(", "));
        assert!(functions.contains(&"pda".to_string()));
        assert!(functions.contains(&"ata".to_string()));
    }

    #[test]
    fn base58_encode_string() {
        let result = evaluate(r#"base58_encode("hello")"#).unwrap();
        assert_eq!(result.to_string(), "Cn8eVZg");
    }

    #[test]
    fn base58_decode_roundtrip() {
        let result = evaluate(r#"base58_decode("Cn8eVZg")"#).unwrap();
        assert_eq!(result.to_string(), "0x68656c6c6f");
    }

    #[test]
    fn is_base58_valid() {
        let result = evaluate(r#"is_base58("Cn8eVZg")"#).unwrap();
        assert_eq!(result.to_string(), "true");
    }

    #[test]
    fn pubkey_system_program() {
        let result = evaluate(r#"pubkey("11111111111111111111111111111111")"#).unwrap();
        match result {
            Value::Pubkey(s) => {
                assert_eq!(s, "11111111111111111111111111111111");
            }
            _ => panic!("expected Pubkey"),
        }
    }

    #[test]
    fn is_on_curve_system_program() {
        let result = evaluate(r#"is_on_curve("11111111111111111111111111111111")"#).unwrap();
        assert_eq!(result.to_string(), "true");
    }

    #[test]
    fn account_discriminator_vault() {
        use sha2::{Digest, Sha256};
        let result = evaluate(r#"account_discriminator("Vault")"#).unwrap();
        let expected = format!("0x{}", hex::encode(&Sha256::digest(b"account:Vault")[..8]));
        assert_eq!(result.to_string(), expected);
    }

    #[test]
    fn pda_vault_example() {
        let result = evaluate(
            r#"pda(["vault", "11111111111111111111111111111111"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")"#,
        )
        .unwrap();
        match result {
            Value::Object(map) => {
                assert!(map.contains_key("pda"));
                assert!(map.contains_key("bump"));
            }
            _ => panic!("expected Object from pda()"),
        }
    }

    #[test]
    fn ata_wsol_example() {
        let result = evaluate(
            r#"ata("11111111111111111111111111111111", "So11111111111111111111111111111111111111112")"#,
        )
        .unwrap();
        match result {
            Value::Object(map) => {
                assert!(map.contains_key("ata"));
            }
            _ => panic!("expected Object from ata()"),
        }
    }

    #[test]
    fn member_access_on_pda() {
        let result = evaluate(
            r#"pda(["vault"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").bump"#,
        )
        .unwrap();
        assert!(matches!(result, Value::Number(_)));
    }

    #[test]
    fn decode_instruction_hex() {
        let result = evaluate(r#"decode_instruction("0xa9059cbb0000000000000000000000000000000000000000000000000000000000000064")"#)
            .unwrap();
        match result {
            Value::Object(map) => {
                assert!(map.contains_key("hex"));
                assert!(map.contains_key("discriminator"));
            }
            _ => panic!("expected Object from decode_instruction()"),
        }
    }

    #[test]
    fn decode_account_anchor_mode() {
        let disc = evaluate(r#"account_discriminator("Vault")"#).unwrap();
        let disc_hex = match disc {
            Value::Bytes(b) => format!("0x{}", hex::encode(b)),
            _ => panic!("expected bytes"),
        };
        let padded = format!("{disc_hex}{}", "00".repeat(24));
        let result = evaluate(&format!(r#"decode_account("{padded}", "anchor")"#)).unwrap();
        match result {
            Value::Object(map) => {
                assert!(map.contains_key("dump"));
                assert!(map.contains_key("discriminator"));
            }
            _ => panic!("expected Object"),
        }
    }

    #[test]
    fn decode_events_empty_logs() {
        let result = evaluate(r#"decode_events("Program log: hello")"#).unwrap();
        match result {
            Value::Object(map) => {
                assert_eq!(map.get("program_data_lines"), Some(&Value::Number(0)));
            }
            _ => panic!("expected Object"),
        }
    }

    #[test]
    fn decode_router_instruction() {
        let result = evaluate(r#"decode("0xa9059cbb", "instruction")"#).unwrap();
        assert!(matches!(result, Value::Object(_)));
    }

    #[test]
    fn function_catalog_includes_decode_functions() {
        let catalog = function_catalog();
        let names: Vec<_> = catalog.iter().map(|m| m.name.as_str()).collect();
        assert!(names.contains(&"decode_account"));
        assert!(names.contains(&"decode_instruction"));
        assert!(names.contains(&"decode_events"));
    }
}
