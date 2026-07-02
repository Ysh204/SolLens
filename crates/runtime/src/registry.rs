use std::collections::HashMap;

use parser::types::Type;
use serde::Serialize;

use crate::RuntimeFunction;

#[derive(Debug, Clone, Serialize)]
pub struct ParamMetadata {
    pub name: String,
    pub expected_type: Type,
    pub optional: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct FunctionMetadata {
    pub name: String,
    pub description: String,
    pub category: String,
    pub parameters: Vec<ParamMetadata>,
    pub return_type: Type,
    pub examples: Vec<String>,
    pub errors: Vec<String>,
}

pub struct FunctionRegistry {
    functions: HashMap<String, (RuntimeFunction, FunctionMetadata)>,
}

impl FunctionRegistry {
    pub fn new() -> Self {
        Self {
            functions: HashMap::new(),
        }
    }

    pub fn register(&mut self, metadata: FunctionMetadata, func: RuntimeFunction) {
        self.functions.insert(metadata.name.clone(), (func, metadata));
    }

    pub fn get(&self, name: &str) -> Option<&RuntimeFunction> {
        self.functions.get(name).map(|(f, _)| f)
    }

    pub fn metadata(&self, name: &str) -> Option<&FunctionMetadata> {
        self.functions.get(name).map(|(_, m)| m)
    }

    pub fn all_metadata(&self) -> Vec<FunctionMetadata> {
        let mut items: Vec<_> = self.functions.values().map(|(_, m)| m.clone()).collect();
        items.sort_by(|a, b| a.name.cmp(&b.name));
        items
    }

    pub fn function_names(&self) -> Vec<String> {
        let mut names: Vec<_> = self.functions.keys().cloned().collect();
        names.sort();
        names
    }
}

impl Default for FunctionRegistry {
    fn default() -> Self {
        let mut reg = Self::new();
        crate::solana::register_all(&mut reg);
        reg
    }
}

pub fn param(
    name: &str,
    expected_type: Type,
    description: &str,
) -> ParamMetadata {
    ParamMetadata {
        name: name.to_string(),
        expected_type,
        optional: false,
        description: description.to_string(),
    }
}

pub fn optional_param(
    name: &str,
    expected_type: Type,
    description: &str,
) -> ParamMetadata {
    ParamMetadata {
        name: name.to_string(),
        expected_type,
        optional: true,
        description: description.to_string(),
    }
}

pub fn meta(
    name: &str,
    description: &str,
    category: &str,
    parameters: Vec<ParamMetadata>,
    return_type: Type,
    examples: Vec<&str>,
) -> FunctionMetadata {
    FunctionMetadata {
        name: name.to_string(),
        description: description.to_string(),
        category: category.to_string(),
        parameters,
        return_type,
        examples: examples.into_iter().map(String::from).collect(),
        errors: Vec::new(),
    }
}
