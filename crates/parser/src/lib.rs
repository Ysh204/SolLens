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

#[cfg(test)]
mod tests {
    use super::*;
    use ast::ExprKind;

    #[test]
    fn parse_array_literal() {
        let expr = parse(r#"["vault", "11111111111111111111111111111111"]"#).unwrap();
        match expr.kind {
            ExprKind::Array(items) => assert_eq!(items.len(), 2),
            _ => panic!("expected array"),
        }
    }

    #[test]
    fn parse_member_access() {
        let expr = parse(r#"pda(["vault"], "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").bump"#).unwrap();
        match expr.kind {
            ExprKind::Member { property, .. } => assert_eq!(property, "bump"),
            _ => panic!("expected member access"),
        }
    }

    #[test]
    fn parse_index_access() {
        let expr = parse(r#"["vault", "mint"][1]"#).unwrap();
        match expr.kind {
            ExprKind::Index { .. } => {}
            _ => panic!("expected index access"),
        }
    }

    #[test]
    fn parse_empty_array_succeeds() {
        let expr = parse("[]").unwrap();
        match expr.kind {
            ExprKind::Array(items) => assert!(items.is_empty()),
            _ => panic!("expected array"),
        }
    }

    #[test]
    fn parse_single_item_array_succeeds() {
        let expr = parse("[1]").unwrap();
        match expr.kind {
            ExprKind::Array(items) => assert_eq!(items.len(), 1),
            _ => panic!("expected array"),
        }
    }

    #[test]
    fn parse_string_array_succeeds() {
        let expr = parse(r#"["vault"]"#).unwrap();
        match expr.kind {
            ExprKind::Array(items) => assert_eq!(items.len(), 1),
            _ => panic!("expected array"),
        }
    }
}
