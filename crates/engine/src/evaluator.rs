use parser::ast::{Expr, ExprKind, BinOp};
use crate::value::Value;
use crate::error::EngineError;
use crate::registry::Registry;
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;

pub fn evaluate_expr(expr: &Expr, registry: &Registry) -> Result<Value, EngineError> {
    match &expr.kind {
        ExprKind::Number(n) => Ok(Value::Number(*n)),

        ExprKind::Decimal(d) => {
            let dec = d.parse::<Decimal>().map_err(|_| {
                EngineError::RuntimeError {
                    message: format!("Invalid decimal literal: {}", d),
                    span: expr.span,
                }
            })?;
            Ok(Value::Decimal(dec))
        }

        ExprKind::String(s) => Ok(Value::String(s.clone())),

        ExprKind::Bool(b) => Ok(Value::Bool(*b)),

        ExprKind::Identifier(name) => {
            // Bare identifiers are treated as string values for now.
            Ok(Value::String(name.clone()))
        }

        ExprKind::Call { function, args } => {
            let mut evaluated_args = Vec::with_capacity(args.len());
            for arg in args {
                evaluated_args.push(evaluate_expr(arg, registry)?);
            }
            registry.call(function, evaluated_args, expr.span)
        }

        ExprKind::Binary { op, left, right } => {
            let left_val = evaluate_expr(left, registry)?;
            let right_val = evaluate_expr(right, registry)?;
            evaluate_binary(*op, left_val, right_val, expr.span)
        }
    }
}

fn evaluate_binary(op: BinOp, left: Value, right: Value, span: parser::span::Span) -> Result<Value, EngineError> {
    match (&left, &right) {
        (Value::Number(a), Value::Number(b)) => {
            let result = match op {
                BinOp::Add => a.checked_add(*b),
                BinOp::Sub => a.checked_sub(*b),
                BinOp::Mul => a.checked_mul(*b),
                BinOp::Div => {
                    if *b == 0 {
                        return Err(EngineError::RuntimeError {
                            message: "Division by zero".to_string(),
                            span,
                        });
                    }
                    a.checked_div(*b)
                }
            };
            match result {
                Some(r) => Ok(Value::Number(r)),
                None => Err(EngineError::RuntimeError {
                    message: "Arithmetic overflow".to_string(),
                    span,
                }),
            }
        }
        (Value::Decimal(a), Value::Decimal(b)) => {
            let result = match op {
                BinOp::Add => Some(*a + *b),
                BinOp::Sub => Some(*a - *b),
                BinOp::Mul => Some(*a * *b),
                BinOp::Div => {
                    if b.is_zero() {
                        return Err(EngineError::RuntimeError {
                            message: "Division by zero".to_string(),
                            span,
                        });
                    }
                    Some(*a / *b)
                }
            };
            match result {
                Some(r) => Ok(Value::Decimal(r)),
                None => Err(EngineError::RuntimeError {
                    message: "Arithmetic error".to_string(),
                    span,
                }),
            }
        }
        (Value::Number(a), Value::Decimal(b)) => {
            let a_dec = Decimal::from_u64(*a).unwrap_or_default();
            evaluate_binary(op, Value::Decimal(a_dec), Value::Decimal(*b), span)
        }
        (Value::Decimal(a), Value::Number(b)) => {
            let b_dec = Decimal::from_u64(*b).unwrap_or_default();
            evaluate_binary(op, Value::Decimal(*a), Value::Decimal(b_dec), span)
        }
        _ => {
            let op_str = match op {
                BinOp::Add => "+",
                BinOp::Sub => "-",
                BinOp::Mul => "*",
                BinOp::Div => "/",
            };
            Err(EngineError::RuntimeError {
                message: format!("Cannot apply '{}' to these types", op_str),
                span,
            })
        }
    }
}
