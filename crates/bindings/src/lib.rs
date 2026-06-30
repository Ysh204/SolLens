use wasm_bindgen::prelude::*;

/// The single public API exposed to JavaScript.
///
/// On success, returns the evaluated Value as a native JS object.
/// On error, throws a JS error containing the Diagnostic object.
#[wasm_bindgen]
pub fn evaluate(input: &str) -> Result<JsValue, JsValue> {
    match engine::evaluate(input) {
        Ok(val) => serde_wasm_bindgen::to_value(&val)
            .map_err(|e| JsValue::from_str(&e.to_string())),
        Err(diagnostic) => {
            let js_diag = serde_wasm_bindgen::to_value(&diagnostic)
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
            Err(js_diag)
        }
    }
}
