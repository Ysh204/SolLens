pub mod span;
pub mod diagnostic;
pub mod token;
pub mod lexer;
pub mod ast;
pub mod parser;
pub mod types;

use diagnostic::Diagnostic;
use ast::Expr;
use lexer::Lexer;
use parser::Parser;

pub fn parse(input: &str) -> Result<Expr, Diagnostic> {
    let tokens = Lexer::new(input).tokenize()?;
    Parser::new(tokens).parse()
}
