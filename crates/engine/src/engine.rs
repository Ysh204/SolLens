use crate::value::Value;
use crate::registry::Registry;
use crate::evaluator::evaluate_expr;
use parser::diagnostic::Diagnostic;

/// The top-level evaluation driver.
///
/// Parses the input expression and evaluates it against the default registry.
pub fn evaluate(input: &str) -> Result<Value, Diagnostic> {
    let ast = parser::parse(input).map_err(|d| d)?;
    let registry = Registry::new();
    evaluate_expr(&ast, &registry).map_err(|e| e.into_diagnostic())
}
