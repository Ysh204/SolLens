use crate::token::{Token, TokenKind};
use crate::ast::{Expr, ExprKind, BinOp};
use crate::diagnostic::Diagnostic;

pub struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Precedence {
    Lowest = 0,
    Sum = 1,
    Product = 2,
}

impl Parser {
    pub fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, pos: 0 }
    }

    pub fn parse(mut self) -> Result<Expr, Diagnostic> {
        let expr = self.parse_expr(Precedence::Lowest)?;
        if !self.is_eof() {
            let next_tok = self.peek_token();
            return Err(Diagnostic::error(
                format!("Unexpected token: expected EOF, found {:?}", next_tok.kind),
                next_tok.span,
            ));
        }
        Ok(expr)
    }

    fn is_eof(&self) -> bool {
        self.pos >= self.tokens.len() || self.peek_token().kind == TokenKind::EOF
    }

    fn peek_token(&self) -> &Token {
        if self.pos >= self.tokens.len() {
            &self.tokens[self.tokens.len() - 1]
        } else {
            &self.tokens[self.pos]
        }
    }

    fn consume_token(&mut self) -> Token {
        let tok = self.peek_token().clone();
        if self.pos < self.tokens.len() {
            self.pos += 1;
        }
        tok
    }

    fn parse_expr(&mut self, precedence: Precedence) -> Result<Expr, Diagnostic> {
        let mut left = self.parse_prefix()?;

        while !self.is_eof() {
            let next_precedence = self.peek_precedence();
            if precedence >= next_precedence {
                break;
            }
            left = self.parse_infix(left, next_precedence)?;
        }

        Ok(left)
    }

    fn parse_prefix(&mut self) -> Result<Expr, Diagnostic> {
        let token = self.consume_token();
        match token.kind {
            TokenKind::Number(n) => Ok(Expr::new(ExprKind::Number(n), token.span)),
            TokenKind::Decimal(d) => Ok(Expr::new(ExprKind::Decimal(d), token.span)),
            TokenKind::String(s) => Ok(Expr::new(ExprKind::String(s), token.span)),
            TokenKind::Bool(b) => Ok(Expr::new(ExprKind::Bool(b), token.span)),
            TokenKind::Identifier(ident) => {
                if self.peek_token().kind == TokenKind::LParen {
                    self.consume_token(); // Consume LParen
                    let mut args = Vec::new();
                    if self.peek_token().kind != TokenKind::RParen {
                        loop {
                            let arg = self.parse_expr(Precedence::Lowest)?;
                            args.push(arg);
                            if self.peek_token().kind == TokenKind::Comma {
                                self.consume_token();
                            } else {
                                break;
                            }
                        }
                    }
                    let rparen = self.consume_token();
                    if rparen.kind != TokenKind::RParen {
                        return Err(Diagnostic::error(
                            "Expected ')' to close function call arguments".to_string(),
                            rparen.span,
                        ));
                    }
                    let span = token.span.union(rparen.span);
                    Ok(Expr::new(ExprKind::Call { function: ident, args }, span))
                } else {
                    Ok(Expr::new(ExprKind::Identifier(ident), token.span))
                }
            }
            TokenKind::LParen => {
                let expr = self.parse_expr(Precedence::Lowest)?;
                let rparen = self.consume_token();
                if rparen.kind != TokenKind::RParen {
                    return Err(Diagnostic::error(
                        "Expected ')'".to_string(),
                        rparen.span,
                    ));
                }
                Ok(Expr::new(expr.kind, token.span.union(rparen.span)))
            }
            _ => Err(Diagnostic::error(
                format!("Unexpected token: expected expression, found {:?}", token.kind),
                token.span,
            )),
        }
    }

    fn peek_precedence(&self) -> Precedence {
        match self.peek_token().kind {
            TokenKind::Plus | TokenKind::Minus => Precedence::Sum,
            TokenKind::Star | TokenKind::Slash => Precedence::Product,
            _ => Precedence::Lowest,
        }
    }

    fn parse_infix(&mut self, left: Expr, precedence: Precedence) -> Result<Expr, Diagnostic> {
        let op_tok = self.consume_token();
        let op = match op_tok.kind {
            TokenKind::Plus => BinOp::Add,
            TokenKind::Minus => BinOp::Sub,
            TokenKind::Star => BinOp::Mul,
            TokenKind::Slash => BinOp::Div,
            _ => return Err(Diagnostic::error(
                format!("Unexpected operator: {:?}", op_tok.kind),
                op_tok.span,
            )),
        };

        let right = self.parse_expr(precedence)?;
        let span = left.span.union(right.span);

        Ok(Expr::new(
            ExprKind::Binary {
                op,
                left: Box::new(left),
                right: Box::new(right),
            },
            span,
        ))
    }
}
