use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;
use crate::value::Value;
use crate::registry::Registry;
use crate::evaluator::evaluate_expr;
use parser::diagnostic::Diagnostic;

static TRANSACTION_CACHE: LazyLock<Mutex<HashMap<String, Value>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub fn set_transaction_data(sig: &str, val: Value) {
    if let Ok(mut cache) = TRANSACTION_CACHE.lock() {
        cache.insert(sig.to_string(), val);
    }
}

pub fn get_transaction_data(sig: &str) -> Option<Value> {
    if let Ok(cache) = TRANSACTION_CACHE.lock() {
        cache.get(sig).cloned()
    } else {
        None
    }
}

pub fn evaluate(input: &str) -> Result<Value, Diagnostic> {
    let ast = parser::parse(input).map_err(|d| d)?;
    let registry = Registry::new();
    evaluate_expr(&ast, &registry).map_err(|e| e.into_diagnostic())
}

pub fn function_catalog() -> Vec<runtime::registry::FunctionMetadata> {
    Registry::new().function_catalog()
}
