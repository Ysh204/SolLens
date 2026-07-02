use std::collections::HashMap;

use crate::RuntimeValue;

pub fn bytes_to_hex_string(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}

pub fn hex_dump_lines(bytes: &[u8], bytes_per_line: usize) -> Vec<RuntimeValue> {
    let mut lines = Vec::new();
    for (i, chunk) in bytes.chunks(bytes_per_line).enumerate() {
        let offset = i * bytes_per_line;
        let hex = chunk
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<Vec<_>>()
            .join(" ");
        let ascii = chunk
            .iter()
            .map(|&b| {
                if (32..=126).contains(&b) {
                    b as char
                } else {
                    '.'
                }
            })
            .collect::<String>();

        let mut line = HashMap::new();
        line.insert("offset".into(), RuntimeValue::Number(offset as u64));
        line.insert("hex".into(), RuntimeValue::String(hex));
        line.insert("ascii".into(), RuntimeValue::String(ascii));
        lines.push(RuntimeValue::Object(line));
    }
    lines
}
