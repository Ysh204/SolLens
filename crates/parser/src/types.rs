use serde::Serialize;
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Type {
    Number,
    Decimal,
    Bool,
    Bytes,
    String,
    Array,
    Object,
    Null,
}

impl fmt::Display for Type {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Type::Number => write!(f, "Number"),
            Type::Decimal => write!(f, "Decimal"),
            Type::Bool => write!(f, "Bool"),
            Type::Bytes => write!(f, "Bytes"),
            Type::String => write!(f, "String"),
            Type::Array => write!(f, "Array"),
            Type::Object => write!(f, "Object"),
            Type::Null => write!(f, "Null"),
        }
    }
}
