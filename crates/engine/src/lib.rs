pub mod value;
pub mod error;
pub mod registry;
pub mod evaluator;
pub mod engine;

pub use engine::evaluate;
pub use value::Value;
pub use error::EngineError;

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
        assert_eq!(result.to_string(), "11111111111111111111111111111111");
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
    fn instruction_discriminator_initialize() {
        use sha2::{Digest, Sha256};
        let result = evaluate(r#"instruction_discriminator("initialize")"#).unwrap();
        let expected = format!("0x{}", hex::encode(&Sha256::digest(b"global:initialize")[..8]));
        assert_eq!(result.to_string(), expected);
    }
}
