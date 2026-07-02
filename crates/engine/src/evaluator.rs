use parser::ast::{BinOp, Expr, ExprKind};
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;

use crate::error::EngineError;
use crate::registry::Registry;
use crate::value::Value;

pub fn evaluate_expr(expr: &Expr, registry: &Registry) -> Result<Value, EngineError> {
    match &expr.kind {
        ExprKind::Number(n) => Ok(Value::Number(*n)),

        ExprKind::Decimal(d) => {
            let dec = d.parse::<Decimal>().map_err(|_| EngineError::RuntimeError {
                message: format!("Invalid decimal literal: {}", d),
                span: expr.span,
            })?;
            Ok(Value::Decimal(dec))
        }

        ExprKind::String(s) => Ok(Value::String(s.clone())),

        ExprKind::Bool(b) => Ok(Value::Bool(*b)),

        ExprKind::Identifier(name) => Ok(Value::String(name.clone())),

        ExprKind::Array(items) => {
            let mut values = Vec::with_capacity(items.len());
            for item in items {
                values.push(evaluate_expr(item, registry)?);
            }
            Ok(Value::Array(values))
        }

        ExprKind::Member { object, property } => {
            let obj = evaluate_expr(object, registry)?;
            match obj {
                Value::Object(map) => map.get(property).cloned().ok_or_else(|| {
                    EngineError::RuntimeError {
                        message: format!("Object has no property '{}'", property),
                        span: expr.span,
                    }
                }),
                _ => Err(EngineError::RuntimeError {
                    message: format!("Cannot access property '{}' on {}", property, obj.get_type()),
                    span: expr.span,
                }),
            }
        }

        ExprKind::Index { object, index } => {
            let target = evaluate_expr(object, registry)?;
            let index_value = evaluate_expr(index, registry)?;
            match (target, index_value) {
                (Value::Array(items), Value::Number(i)) => {
                    items.into_iter().nth(i as usize).ok_or_else(|| EngineError::RuntimeError {
                        message: format!("Array index {} is out of bounds", i),
                        span: expr.span,
                    })
                }
                (Value::Object(map), Value::String(key)) => {
                    map.get(&key).cloned().ok_or_else(|| EngineError::RuntimeError {
                        message: format!("Object has no property '{}'", key),
                        span: expr.span,
                    })
                }
                (Value::Object(_), other) => Err(EngineError::RuntimeError {
                    message: format!(
                        "Object index must be a string key, got {}",
                        other.get_type()
                    ),
                    span: expr.span,
                }),
                (other, _) => Err(EngineError::RuntimeError {
                    message: format!("Cannot index into {}", other.get_type()),
                    span: expr.span,
                }),
            }
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

fn evaluate_binary(
    op: BinOp,
    left: Value,
    right: Value,
    span: parser::span::Span,
) -> Result<Value, EngineError> {
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
