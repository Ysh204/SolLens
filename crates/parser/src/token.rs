use crate::span::Span;

#[derive(Debug, Clone, PartialEq)]
pub enum TokenKind {
    Identifier(String),
    String(String),
    Number(u64),
    Decimal(String),
    Bool(bool),
    LParen,
    RParen,
    Comma,
    Plus,
    Minus,
    Star,
    Slash,
    EOF,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}

impl Token {
    pub fn new(kind: TokenKind, span: Span) -> Self {
        Self { kind, span }
    }
}
