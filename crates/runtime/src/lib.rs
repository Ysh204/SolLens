pub mod registry;
pub mod solana;

pub use registry::FunctionRegistry;

use rust_decimal::Decimal;
use std::collections::HashMap;

/// RuntimeValue is the common value type shared between the runtime functions
/// and the engine. It is intentionally decoupled from engine::Value so that
/// runtime implementations don't depend on the engine crate.
#[derive(Debug, Clone, PartialEq)]
pub enum RuntimeValue {
    Number(u64),
    Decimal(Decimal),
    Bool(bool),
    String(String),
    Bytes(Vec<u8>),
    Array(Vec<RuntimeValue>),
    Object(HashMap<String, RuntimeValue>),
    /// Validated base58-encoded 32-byte public key.
    Pubkey(String),
    /// Transaction signature (base58).
    Signature(String),
    Null,
}

pub type RuntimeFunction = fn(Vec<RuntimeValue>) -> Result<RuntimeValue, String>;
