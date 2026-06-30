use serde::Serialize;
use crate::span::Span;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Clone, Serialize)]
pub struct Diagnostic {
    pub severity: Severity,
    pub message: String,
    pub span: Span,
    pub help: Option<String>,
}

impl Diagnostic {
    pub fn error(message: String, span: Span) -> Self {
        Self {
            severity: Severity::Error,
            message,
            span,
            help: None,
        }
    }

    pub fn with_help(mut self, help: String) -> Self {
        self.help = Some(help);
        self
    }
}
