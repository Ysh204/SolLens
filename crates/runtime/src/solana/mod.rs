pub mod decode;
pub mod functions;
pub mod pda_core;

use crate::registry::{meta, optional_param, param, FunctionRegistry};
use parser::types::Type;

pub fn register_all(reg: &mut FunctionRegistry) {
    reg.register(
        meta(
            "sha256",
            "Compute SHA-256 hash of input bytes or UTF-8 string.",
            "Crypto",
            vec![param("input", Type::String, "String or bytes to hash")],
            Type::Bytes,
            vec![
                "sha256(\"hello\")",
            ],
        ),
        functions::hash::sha256_fn,
    );

    reg.register(
        meta(
            "rent",
            "Minimum lamports for rent-exempt account of given size.",
            "Solana",
            vec![param("bytes", Type::Number, "Account data size in bytes")],
            Type::Number,
            vec![
                "rent(128)",
            ],
        ),
        functions::rent::rent_fn,
    );

    reg.register(
        meta(
            "lamports",
            "Convert SOL (decimal) to lamports (u64).",
            "Solana",
            vec![param("sol", Type::Decimal, "Amount in SOL")],
            Type::Number,
            vec![
                "lamports(1.5)",
            ],
        ),
        functions::lamports::lamports_fn,
    );

    reg.register(
        meta(
            "base58_encode",
            "Encode UTF-8 string or bytes to base58.",
            "Base58",
            vec![param("input", Type::String, "Text to encode")],
            Type::String,
            vec![
                "base58_encode(\"hello\")",
            ],
        ),
        functions::base58::base58_encode_fn,
    );

    reg.register(
        meta(
            "base58_decode",
            "Decode base58 string to bytes.",
            "Base58",
            vec![param("input", Type::String, "Base58-encoded string")],
            Type::Bytes,
            vec![
                "base58_decode(\"Cn8eVZg\")",
            ],
        ),
        functions::base58::base58_decode_fn,
    );

    reg.register(
        meta(
            "is_base58",
            "Returns true if the input is valid base58.",
            "Base58",
            vec![param("input", Type::String, "String to validate")],
            Type::Bool,
            vec![
                "is_base58(\"Cn8eVZg\")",
            ],
        ),
        functions::base58::is_base58_fn,
    );

    reg.register(
        meta(
            "bytes_to_base58",
            "Encode a Bytes value as base58.",
            "Base58",
            vec![param("bytes", Type::Bytes, "Raw bytes")],
            Type::String,
            vec![
                "bytes_to_base58(sha256(\"hello\"))",
            ],
        ),
        functions::base58::bytes_to_base58_fn,
    );

    reg.register(
        meta(
            "pubkey",
            "Validate and normalize a Solana public key.",
            "Pubkey",
            vec![param("input", Type::String, "Base58-encoded 32-byte public key")],
            Type::Pubkey,
            vec![
                "pubkey(\"11111111111111111111111111111111\")",
            ],
        ),
        functions::pubkey::pubkey_fn,
    );

    reg.register(
        meta(
            "is_on_curve",
            "Check if a public key lies on the Ed25519 curve.",
            "Pubkey",
            vec![param("input", Type::Pubkey, "Public key to check")],
            Type::Bool,
            vec![
                "is_on_curve(\"11111111111111111111111111111111\")",
            ],
        ),
        functions::pubkey::is_on_curve_fn,
    );

    reg.register(
        meta(
            "bytes",
            "Convert a public key string to raw 32 bytes.",
            "Pubkey",
            vec![param("input", Type::Pubkey, "Public key")],
            Type::Bytes,
            vec![
                "bytes(\"11111111111111111111111111111111\")",
            ],
        ),
        functions::pubkey::bytes_fn,
    );

    reg.register(
        meta(
            "pubkey_from_bytes",
            "Convert 32 raw bytes to a base58 public key.",
            "Pubkey",
            vec![param("bytes", Type::Bytes, "32-byte public key")],
            Type::Pubkey,
            vec![
                "pubkey_from_bytes(bytes(\"11111111111111111111111111111111\"))",
            ],
        ),
        functions::pubkey::pubkey_from_bytes_fn,
    );

    reg.register(
        meta(
            "account_discriminator",
            "Anchor account discriminator: sha256(\"account:{name}\")[0..8].",
            "Anchor",
            vec![param("name", Type::String, "Account struct name")],
            Type::Bytes,
            vec![
                "account_discriminator(\"Vault\")",
            ],
        ),
        functions::discriminator::account_discriminator_fn,
    );

    reg.register(
        meta(
            "instruction_discriminator",
            "Anchor instruction discriminator: sha256(\"global:{name}\")[0..8].",
            "Anchor",
            vec![param("name", Type::String, "Instruction name")],
            Type::Bytes,
            vec![
                "instruction_discriminator(\"initialize\")",
            ],
        ),
        functions::discriminator::instruction_discriminator_fn,
    );

    reg.register(
        meta(
            "pda",
            "Derive a Program Derived Address from seeds and a program ID.",
            "Solana",
            vec![
                param(
                    "seeds",
                    Type::Array,
                    "Array of seed strings, pubkeys, or hex bytes",
                ),
                param("program_id", Type::Pubkey, "Program public key (base58)"),
            ],
            Type::Object,
            vec![
                r#"pda(["vault", "11111111111111111111111111111111"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")"#,
            ],
        ),
        functions::pda::pda_fn,
    );

    reg.register(
        meta(
            "ata",
            "Derive the Associated Token Account for a wallet and mint.",
            "Solana",
            vec![
                param("wallet", Type::Pubkey, "Owner wallet public key"),
                param("mint", Type::Pubkey, "Token mint public key"),
                optional_param(
                    "token_program",
                    Type::Pubkey,
                    "SPL Token program (defaults to Tokenkeg…)",
                ),
            ],
            Type::Object,
            vec![
                r#"ata("11111111111111111111111111111111", "So11111111111111111111111111111111111111112")"#,
            ],
        ),
        functions::ata::ata_fn,
    );

    reg.register(
        meta(
            "decode_account",
            "Decode raw account data (base58 or hex) with Anchor, Borsh, or raw hex dump.",
            "Decode",
            vec![
                param("data", Type::String, "Base58 or hex account data"),
                optional_param("mode", Type::String, "anchor | borsh | raw (default anchor)"),
                optional_param("schema", Type::String, "Borsh schema JSON array for borsh mode"),
            ],
            Type::Account,
            vec![r#"decode_account("…", "anchor")"#],
        ),
        functions::decode_account::decode_account_fn,
    );

    reg.register(
        meta(
            "account",
            "Alias for decode_account — decode raw account bytes.",
            "Decode",
            vec![
                param("data", Type::String, "Base58 or hex account data"),
                optional_param("mode", Type::String, "anchor | borsh | raw"),
                optional_param("schema", Type::String, "Borsh schema JSON"),
            ],
            Type::Account,
            vec![r#"account("…", "anchor")"#],
        ),
        functions::decode_account::account_fn,
    );

    reg.register(
        meta(
            "decode_instruction",
            "Decode instruction bytes (hex or base64) with Anchor discriminator hints.",
            "Decode",
            vec![param("data", Type::String, "Hex (0x…) or base64 instruction data")],
            Type::Instruction,
            vec![r#"decode_instruction("0xa9059cbb…")"#],
        ),
        functions::decode_instruction::decode_instruction_fn,
    );

    reg.register(
        meta(
            "decode_events",
            "Parse Anchor program logs and decode Program data: event payloads.",
            "Decode",
            vec![param("logs", Type::String, "Transaction log text")],
            Type::Object,
            vec![r#"decode_events("Program data: …")"#],
        ),
        functions::decode_events::decode_events_fn,
    );

    reg.register(
        meta(
            "decode",
            "Unified decode router: decode(data, kind, …) where kind is account | instruction | events.",
            "Decode",
            vec![
                param("data", Type::String, "Input data or logs"),
                param("kind", Type::String, "account | instruction | events"),
            ],
            Type::Object,
            vec![
                r#"decode("0x…", "instruction")"#,
                r#"decode("…", "account", "anchor")"#,
            ],
        ),
        functions::decode_account::decode_fn,
    );

    reg.register(
        meta(
            "hex_dump",
            "Format bytes as a hex dump with ASCII column.",
            "Decode",
            vec![param("data", Type::Bytes, "Raw bytes or hex/base58 string")],
            Type::Object,
            vec![r#"hex_dump(sha256("hello"))"#],
        ),
        functions::decode_account::hex_dump_fn,
    );
}
