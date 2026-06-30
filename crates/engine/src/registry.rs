use std::collections::HashMap;
use crate::value::Value;
use crate::error::EngineError;
use parser::span::Span;
use runtime::RuntimeValue;

/// The type of function stored in the registry.
/// Takes a list of evaluated Values and returns a Value or an error string.
type NativeFunction = fn(Vec<RuntimeValue>) -> Result<RuntimeValue, String>;

pub struct Registry {
    functions: HashMap<String, NativeFunction>,
}

impl Registry {
    pub fn new() -> Self {
        let mut reg = Self {
            functions: HashMap::new(),
        };
        reg.register_builtins();
        reg
    }

    /// Register a single function by name.
    pub fn register(&mut self, name: &str, f: NativeFunction) {
        self.functions.insert(name.to_string(), f);
    }

    /// Look up a function by name. Returns an error with suggestions if not found.
    pub fn get(&self, name: &str, span: Span) -> Result<&NativeFunction, EngineError> {
        match self.functions.get(name) {
            Some(f) => Ok(f),
            None => {
                let suggestions = self.suggest(name);
                Err(EngineError::UnknownFunction {
                    name: name.to_string(),
                    span,
                    suggestions,
                })
            }
        }
    }

    /// Call a registered function with evaluated argument Values.
    pub fn call(&self, name: &str, args: Vec<Value>, span: Span) -> Result<Value, EngineError> {
        let f = self.get(name, span)?;

        let runtime_args: Vec<RuntimeValue> = args
            .into_iter()
            .map(|v| v.into_runtime())
            .collect();

        match f(runtime_args) {
            Ok(rv) => Ok(Value::from_runtime(rv)),
            Err(msg) => Err(EngineError::RuntimeError {
                message: msg,
                span,
            }),
        }
    }

    /// Provide "did you mean" suggestions via edit distance.
    fn suggest(&self, name: &str) -> Vec<String> {
        let mut candidates: Vec<(String, usize)> = self
            .functions
            .keys()
            .filter_map(|key| {
                let dist = edit_distance(name, key);
                if dist <= 3 {
                    Some((key.clone(), dist))
                } else {
                    None
                }
            })
            .collect();

        candidates.sort_by_key(|(_, d)| *d);
        candidates.into_iter().take(3).map(|(k, _)| k).collect()
    }

    /// Register engine-native utility functions.
    fn register_builtins(&mut self) {
        self.register("echo", builtin_echo);
        self.register("upper", builtin_upper);

        // Register runtime (Solana) functions via the pluggable hook.
        runtime::solana::register_functions(|name, f| {
            self.register(name, f);
        });
    }

    /// Returns a sorted list of all registered function names.
    pub fn function_names(&self) -> Vec<String> {
        let mut names: Vec<String> = self.functions.keys().cloned().collect();
        names.sort();
        names
    }
}

// ── Built-in functions ──────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

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
