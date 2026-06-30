use parser::diagnostic::{Diagnostic, Severity};
use parser::span::Span;

#[derive(Debug, Clone)]
pub enum EngineError {
    Parse(Diagnostic),
    UnknownFunction {
        name: String,
        span: Span,
        suggestions: Vec<String>,
    },
    InvalidArgumentCount {
        function: String,
        expected: usize,
        received: usize,
        span: Span,
    },
    InvalidArgumentType {
        function: String,
        expected: parser::types::Type,
        received: parser::types::Type,
        span: Span,
    },
    RuntimeError {
        message: String,
        span: Span,
    },
}

impl EngineError {
    pub fn into_diagnostic(self) -> Diagnostic {
        match self {
            EngineError::Parse(d) => d,
            EngineError::UnknownFunction { name, span, suggestions } => {
                let help = if suggestions.is_empty() {
                    None
                } else {
                    Some(format!("Did you mean: {}?", suggestions.join(", ")))
                };
                Diagnostic {
                    severity: Severity::Error,
                    message: format!("Unknown function: {}", name),
                    span,
                    help,
                }
            }
            EngineError::InvalidArgumentCount { function, expected, received, span } => {
                Diagnostic {
                    severity: Severity::Error,
                    message: format!(
                        "{} expects {} argument{}, got {}",
                        function,
                        expected,
                        if expected == 1 { "" } else { "s" },
                        received,
                    ),
                    span,
                    help: None,
                }
            }
            EngineError::InvalidArgumentType { function, expected, received, span } => {
                Diagnostic {
                    severity: Severity::Error,
                    message: format!(
                        "Type mismatch in {}: expected {}, received {}",
                        function, expected, received,
                    ),
                    span,
                    help: None,
                }
            }
            EngineError::RuntimeError { message, span } => {
                Diagnostic {
                    severity: Severity::Error,
                    message,
                    span,
                    help: None,
                }
            }
        }
    }
}
