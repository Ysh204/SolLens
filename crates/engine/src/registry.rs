use std::collections::HashMap;

use parser::span::Span;
use runtime::{FunctionRegistry, RuntimeValue};

use crate::error::EngineError;
use crate::value::Value;

type BuiltinFunction = fn(Vec<RuntimeValue>) -> Result<RuntimeValue, String>;

pub struct Registry {
    builtins: HashMap<String, BuiltinFunction>,
    runtime: FunctionRegistry,
}

impl Registry {
    pub fn new() -> Self {
        let mut reg = Self {
            builtins: HashMap::new(),
            runtime: FunctionRegistry::default(),
        };
        reg.builtins.insert("echo".to_string(), builtin_echo);
        reg.builtins.insert("upper".to_string(), builtin_upper);
        reg.builtins.insert("transaction".to_string(), builtin_transaction);
        reg
    }

    pub fn call(&self, name: &str, args: Vec<Value>, span: Span) -> Result<Value, EngineError> {
        let runtime_args: Vec<RuntimeValue> = args.into_iter().map(|v| v.into_runtime()).collect();

        if let Some(f) = self.builtins.get(name) {
            return match f(runtime_args) {
                Ok(rv) => Ok(Value::from_runtime(rv)),
                Err(msg) => Err(EngineError::RuntimeError { message: msg, span }),
            };
        }

        if let Some(f) = self.runtime.get(name) {
            return match f(runtime_args) {
                Ok(rv) => Ok(Value::from_runtime(rv)),
                Err(msg) => Err(EngineError::RuntimeError { message: msg, span }),
            };
        }

        let suggestions = self.suggest(name);
        Err(EngineError::UnknownFunction {
            name: name.to_string(),
            span,
            suggestions,
        })
    }

    pub fn function_names(&self) -> Vec<String> {
        let mut names: Vec<String> = self.runtime.function_names();
        names.push("echo".to_string());
        names.push("upper".to_string());
        names.push("transaction".to_string());
        names.sort();
        names.dedup();
        names
    }

    pub fn function_catalog(&self) -> Vec<runtime::registry::FunctionMetadata> {
        let mut catalog = self.runtime.all_metadata();
        catalog.push(runtime::registry::meta(
            "transaction",
            "Fetch and decode a Solana transaction by its signature from RPC.",
            "Solana",
            vec![runtime::registry::param(
                "signature",
                parser::types::Type::Signature,
                "Transaction signature (base58)",
            )],
            parser::types::Type::Object,
            vec![r#"transaction("5VERv8NMvzbJMEkJfz…")"#],
        ));
        catalog
    }

    fn suggest(&self, name: &str) -> Vec<String> {
        let mut candidates: Vec<(String, usize)> = self
            .function_names()
            .into_iter()
            .filter_map(|key| {
                let dist = edit_distance(name, &key);
                if dist <= 3 {
                    Some((key, dist))
                } else {
                    None
                }
            })
            .collect();

        candidates.sort_by_key(|(_, d)| *d);
        candidates.into_iter().take(3).map(|(k, _)| k).collect()
    }
}

fn builtin_echo(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("echo expects exactly 1 argument, got {}", args.len()));
    }
    Ok(args.into_iter().next().unwrap())
}

fn builtin_upper(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("upper expects exactly 1 argument, got {}", args.len()));
    }
    match &args[0] {
        RuntimeValue::String(s) => Ok(RuntimeValue::String(s.to_uppercase())),
        _ => Err("upper expects a String argument".to_string()),
    }
}

fn builtin_transaction(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    if args.len() != 1 {
        return Err(format!("transaction expects exactly 1 argument, got {}", args.len()));
    }
    let sig = match &args[0] {
        RuntimeValue::String(s) | RuntimeValue::Signature(s) => s.clone(),
        _ => return Err("transaction expects a Signature or String argument".to_string()),
    };

    match crate::engine::get_transaction_data(&sig) {
        Some(val) => Ok(val.into_runtime()),
        None => Err(format!(
            "Transaction '{}' not found in cache. Make sure it is fetched first.",
            sig
        )),
    }
}

fn edit_distance(a: &str, b: &str) -> usize {
    let a_len = a.len();
    let b_len = b.len();
    let mut matrix = vec![vec![0usize; b_len + 1]; a_len + 1];

    for i in 0..=a_len {
        matrix[i][0] = i;
    }
    for j in 0..=b_len {
        matrix[0][j] = j;
    }
    for (i, ca) in a.chars().enumerate() {
        for (j, cb) in b.chars().enumerate() {
            let cost = if ca == cb { 0 } else { 1 };
            matrix[i + 1][j + 1] = (matrix[i][j + 1] + 1)
                .min(matrix[i + 1][j] + 1)
                .min(matrix[i][j] + cost);
        }
    }
    matrix[a_len][b_len]
}
