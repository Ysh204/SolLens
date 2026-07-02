use std::collections::HashMap;

use crate::RuntimeValue;
use super::super::functions::helpers::encode_base58;

#[derive(Debug, Clone)]
struct SchemaField {
    name: String,
    field_type: String,
}

pub fn decode_borsh_fields(
    data: &[u8],
    schema_json: &str,
) -> Result<HashMap<String, RuntimeValue>, String> {
    let schema = parse_schema(schema_json)?;
    let mut fields = Vec::new();
    let mut offset = 0usize;

    for field in schema {
        if offset >= data.len() {
            fields.push(field_result(
                &field.name,
                &field.field_type,
                "(truncated)",
                offset,
                0,
            ));
            break;
        }

        match field.field_type.as_str() {
            "u8" => {
                let value = data[offset];
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    1,
                ));
                offset += 1;
            }
            "u16" => {
                if offset + 2 > data.len() {
                    break;
                }
                let value = u16::from_le_bytes([data[offset], data[offset + 1]]);
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    2,
                ));
                offset += 2;
            }
            "u32" => {
                if offset + 4 > data.len() {
                    break;
                }
                let value = u32::from_le_bytes([
                    data[offset],
                    data[offset + 1],
                    data[offset + 2],
                    data[offset + 3],
                ]);
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    4,
                ));
                offset += 4;
            }
            "u64" => {
                if offset + 8 > data.len() {
                    break;
                }
                let value = u64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    8,
                ));
                offset += 8;
            }
            "i64" => {
                if offset + 8 > data.len() {
                    break;
                }
                let value = i64::from_le_bytes(data[offset..offset + 8].try_into().unwrap());
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    8,
                ));
                offset += 8;
            }
            "bool" => {
                let value = data[offset] != 0;
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value.to_string(),
                    offset,
                    1,
                ));
                offset += 1;
            }
            "pubkey" => {
                if offset + 32 > data.len() {
                    break;
                }
                let slice = &data[offset..offset + 32];
                let value = encode_base58(slice);
                fields.push(field_result(
                    &field.name,
                    &field.field_type,
                    &value,
                    offset,
                    32,
                ));
                offset += 32;
            }
            other => {
                fields.push(field_result(
                    &field.name,
                    other,
                    &format!("(unsupported type: {other})"),
                    offset,
                    0,
                ));
            }
        }
    }

    let mut result = HashMap::new();
    result.insert("schema".into(), RuntimeValue::String(schema_json.to_string()));
    result.insert("fields".into(), RuntimeValue::Array(fields));
    Ok(result)
}

fn field_result(
    name: &str,
    field_type: &str,
    value: &str,
    offset: usize,
    size: usize,
) -> RuntimeValue {
    let mut map = HashMap::new();
    map.insert("name".into(), RuntimeValue::String(name.to_string()));
    map.insert("type".into(), RuntimeValue::String(field_type.to_string()));
    map.insert("value".into(), RuntimeValue::String(value.to_string()));
    map.insert("offset".into(), RuntimeValue::Number(offset as u64));
    map.insert("size".into(), RuntimeValue::Number(size as u64));
    RuntimeValue::Object(map)
}

fn parse_schema(schema_json: &str) -> Result<Vec<SchemaField>, String> {
    let parsed: serde_json::Value = serde_json::from_str(schema_json)
        .map_err(|e| format!("Invalid schema JSON: {e}"))?;

    let items = parsed
        .as_array()
        .ok_or_else(|| "Schema must be a JSON array".to_string())?;

    let mut fields = Vec::with_capacity(items.len());
    for item in items {
        let obj = item
            .as_object()
            .ok_or_else(|| "Schema entries must be objects".to_string())?;
        let name = obj
            .get("name")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Schema field missing 'name'".to_string())?
            .to_string();
        let field_type = obj
            .get("type")
            .and_then(|v| v.as_str())
            .ok_or_else(|| format!("Schema field '{name}' missing 'type'"))?
            .to_string();
        fields.push(SchemaField { name, field_type });
    }

    Ok(fields)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decode_u64_and_pubkey() {
        let schema = r#"[{"name":"amount","type":"u64"},{"name":"owner","type":"pubkey"}]"#;
        let mut data = vec![0u8; 40];
        data[0..8].copy_from_slice(&100u64.to_le_bytes());
        data[8..40].fill(1);

        let result = decode_borsh_fields(&data, schema).unwrap();
        let fields = match result.get("fields").unwrap() {
            RuntimeValue::Array(items) => items,
            _ => panic!("expected array"),
        };
        assert_eq!(fields.len(), 2);
    }
}
