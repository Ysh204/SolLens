use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum Value {
    Number(u64),
    Decimal(Decimal),
    Bool(bool),
    String(String),
    Bytes(Vec<u8>),
    Array(Vec<Value>),
    Object(HashMap<String, Value>),
    Pubkey(String),
    Signature(String),
    Null,
}

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::Number(n) => write!(f, "{}", n),
            Value::Decimal(d) => write!(f, "{}", d),
            Value::Bool(b) => write!(f, "{}", b),
            Value::String(s) => write!(f, "{}", s),
            Value::Pubkey(s) | Value::Signature(s) => write!(f, "{}", s),
            Value::Bytes(b) => write!(f, "0x{}", hex::encode(b)),
            Value::Array(arr) => {
                write!(f, "[")?;
                for (i, v) in arr.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    write!(f, "{}", v)?;
                }
                write!(f, "]")
            }
            Value::Object(map) => {
                write!(f, "{{")?;
                for (i, (k, v)) in map.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    write!(f, "\"{}\": {}", k, v)?;
                }
                write!(f, "}}")
            }
            Value::Null => write!(f, "null"),
        }
    }
}

impl Value {
    pub fn from_runtime(rv: runtime::RuntimeValue) -> Self {
        match rv {
            runtime::RuntimeValue::Number(n) => Value::Number(n),
            runtime::RuntimeValue::Decimal(d) => Value::Decimal(d),
            runtime::RuntimeValue::Bool(b) => Value::Bool(b),
            runtime::RuntimeValue::String(s) => Value::String(s),
            runtime::RuntimeValue::Bytes(b) => Value::Bytes(b),
            runtime::RuntimeValue::Array(arr) => {
                Value::Array(arr.into_iter().map(Value::from_runtime).collect())
            }
            runtime::RuntimeValue::Object(map) => Value::Object(
                map.into_iter()
                    .map(|(k, v)| (k, Value::from_runtime(v)))
                    .collect(),
            ),
            runtime::RuntimeValue::Pubkey(s) => Value::Pubkey(s),
            runtime::RuntimeValue::Signature(s) => Value::Signature(s),
            runtime::RuntimeValue::Null => Value::Null,
        }
    }

    pub fn into_runtime(self) -> runtime::RuntimeValue {
        match self {
            Value::Number(n) => runtime::RuntimeValue::Number(n),
            Value::Decimal(d) => runtime::RuntimeValue::Decimal(d),
            Value::Bool(b) => runtime::RuntimeValue::Bool(b),
            Value::String(s) => runtime::RuntimeValue::String(s),
            Value::Bytes(b) => runtime::RuntimeValue::Bytes(b),
            Value::Array(arr) => runtime::RuntimeValue::Array(
                arr.into_iter().map(Value::into_runtime).collect(),
            ),
            Value::Object(map) => runtime::RuntimeValue::Object(
                map.into_iter()
                    .map(|(k, v)| (k, v.into_runtime()))
                    .collect(),
            ),
            Value::Pubkey(s) => runtime::RuntimeValue::Pubkey(s),
            Value::Signature(s) => runtime::RuntimeValue::Signature(s),
            Value::Null => runtime::RuntimeValue::Null,
        }
    }

    pub fn get_type(&self) -> parser::types::Type {
        match self {
            Value::Number(_) => parser::types::Type::Number,
            Value::Decimal(_) => parser::types::Type::Decimal,
            Value::Bool(_) => parser::types::Type::Bool,
            Value::String(_) => parser::types::Type::String,
            Value::Bytes(_) => parser::types::Type::Bytes,
            Value::Array(_) => parser::types::Type::Array,
            Value::Object(_) => parser::types::Type::Object,
            Value::Pubkey(_) => parser::types::Type::Pubkey,
            Value::Signature(_) => parser::types::Type::Signature,
            Value::Null => parser::types::Type::Null,
        }
    }
}
