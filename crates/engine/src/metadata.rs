use serde::Serialize;
use parser::types::Type;

#[derive(Debug, Clone, Serialize)]
pub struct ParamMetadata {
    pub name: String,
    pub expected_type: Type,
}

#[derive(Debug, Clone, Serialize)]
pub struct FunctionMetadata {
    pub name: String,
    pub description: String,
    pub category: String,
    pub parameters: Vec<ParamMetadata>,
    pub examples: Vec<String>,
}
