use crate::span::Span;
use crate::token::{Token, TokenKind};
use crate::diagnostic::Diagnostic;

pub struct Lexer<'a> {
    input: &'a str,
    chars: std::iter::Peekable<std::str::CharIndices<'a>>,
    len: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(input: &'a str) -> Self {
        Self {
            input,
            chars: input.char_indices().peekable(),
            len: input.len(),
        }
    }

    pub fn tokenize(mut self) -> Result<Vec<Token>, Diagnostic> {
        let mut tokens = Vec::new();
        loop {
            let token = self.next_token()?;
            let is_eof = token.kind == TokenKind::EOF;
            tokens.push(token);
            if is_eof {
                break;
            }
        }
        Ok(tokens)
    }

    fn peek_pos(&mut self) -> usize {
        self.chars.peek().map(|(i, _)| *i).unwrap_or(self.len)
    }

    fn next_char(&mut self) -> Option<(usize, char)> {
        self.chars.next()
    }

    fn peek_char(&mut self) -> Option<&char> {
        self.chars.peek().map(|(_, c)| c)
    }

    fn skip_whitespace(&mut self) {
        while let Some(&c) = self.peek_char() {
            if c.is_whitespace() {
                self.next_char();
            } else {
                break;
            }
        }
    }

    fn next_token(&mut self) -> Result<Token, Diagnostic> {
        self.skip_whitespace();
        let _start = self.peek_pos();

        let (idx, c) = match self.next_char() {
            None => return Ok(Token::new(TokenKind::EOF, Span::new(self.len, self.len))),
            Some(x) => x,
        };

        match c {
            '(' => Ok(Token::new(TokenKind::LParen, Span::new(idx, idx + 1))),
            ')' => Ok(Token::new(TokenKind::RParen, Span::new(idx, idx + 1))),
            '[' => Ok(Token::new(TokenKind::LBracket, Span::new(idx, idx + 1))),
            ']' => Ok(Token::new(TokenKind::RBracket, Span::new(idx, idx + 1))),
            ',' => Ok(Token::new(TokenKind::Comma, Span::new(idx, idx + 1))),
            '.' => Ok(Token::new(TokenKind::Dot, Span::new(idx, idx + 1))),
            '+' => Ok(Token::new(TokenKind::Plus, Span::new(idx, idx + 1))),
            '-' => Ok(Token::new(TokenKind::Minus, Span::new(idx, idx + 1))),
            '*' => Ok(Token::new(TokenKind::Star, Span::new(idx, idx + 1))),
            '/' => Ok(Token::new(TokenKind::Slash, Span::new(idx, idx + 1))),
            '"' | '\'' => self.read_string(idx, c),
            _ if c.is_ascii_digit() => self.read_number(idx),
            _ if is_ident_start(c) => self.read_identifier(idx),
            _ => Err(Diagnostic::error(
                format!("Unexpected character: '{}'", c),
                Span::new(idx, idx + 1),
            )),
        }
    }

    fn read_string(&mut self, start: usize, quote_char: char) -> Result<Token, Diagnostic> {
        let mut s = String::new();
        while let Some((idx, c)) = self.next_char() {
            if c == quote_char {
                let end = idx + 1;
                return Ok(Token::new(TokenKind::String(s), Span::new(start, end)));
            }
            s.push(c);
        }
        Err(Diagnostic::error(
            "Unterminated string literal".to_string(),
            Span::new(start, self.len),
        ))
    }

    fn read_number(&mut self, start: usize) -> Result<Token, Diagnostic> {
        let mut num_str = self.input[start..start+1].to_string();
        let mut is_decimal = false;

        while let Some(&c) = self.peek_char() {
            if c.is_ascii_digit() {
                num_str.push(c);
                self.next_char();
            } else if c == '.' && !is_decimal {
                let mut temp_chars = self.chars.clone();
                temp_chars.next(); // Consume '.'
                if temp_chars.peek().map(|(_, next_c)| next_c.is_ascii_digit()).unwrap_or(false) {
                    is_decimal = true;
                    num_str.push('.');
                    self.next_char(); // Consume '.'
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        let end = self.peek_pos();
        if is_decimal {
            Ok(Token::new(TokenKind::Decimal(num_str), Span::new(start, end)))
        } else {
            match num_str.parse::<u64>() {
                Ok(val) => Ok(Token::new(TokenKind::Number(val), Span::new(start, end))),
                Err(_) => Ok(Token::new(TokenKind::Decimal(num_str), Span::new(start, end))),
            }
        }
    }

    fn read_identifier(&mut self, start: usize) -> Result<Token, Diagnostic> {
        let mut ident = self.input[start..start+1].to_string();
        while let Some(&c) = self.peek_char() {
            if is_ident_char(c) {
                ident.push(c);
                self.next_char();
            } else {
                break;
            }
        }
        let end = self.peek_pos();
        match ident.as_str() {
            "true" => Ok(Token::new(TokenKind::Bool(true), Span::new(start, end))),
            "false" => Ok(Token::new(TokenKind::Bool(false), Span::new(start, end))),
            _ => Ok(Token::new(TokenKind::Identifier(ident), Span::new(start, end))),
        }
    }
}

fn is_ident_start(c: char) -> bool {
    c.is_alphabetic() || c == '_' || c == '$'
}

fn is_ident_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_' || c == '$'
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn brackets_emit_bracket_tokens() {
        let tokens = Lexer::new("[]").tokenize().unwrap();
        assert_eq!(tokens[0].kind, TokenKind::LBracket);
        assert_eq!(tokens[1].kind, TokenKind::RBracket);
    }
}
