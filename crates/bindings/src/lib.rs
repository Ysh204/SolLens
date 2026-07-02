use wasm_bindgen::prelude::*;
use serde::Serialize;

fn to_js_value<T: Serialize + ?Sized>(value: &T) -> Result<JsValue, JsValue> {
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    value.serialize(&serializer).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Evaluate a SolLens expression. Returns a typed Value on success, throws Diagnostic on error.
#[wasm_bindgen]
pub fn evaluate(input: &str) -> Result<JsValue, JsValue> {
    match engine::evaluate(input) {
        Ok(val) => to_js_value(&val),
        Err(diagnostic) => {
            let js_diag = to_js_value(&diagnostic)?;
            Err(js_diag)
        }
    }
}

/// Return metadata for all registered Solana/runtime functions (for autocomplete & docs).
#[wasm_bindgen]
pub fn function_catalog() -> Result<JsValue, JsValue> {
    let catalog = engine::function_catalog();
    to_js_value(&catalog)
}

/// Return sorted function names available in the expression engine.
#[wasm_bindgen]
pub fn list_functions() -> Result<JsValue, JsValue> {
    let names = engine::list_functions();
    to_js_value(&names)
}

/// Cache a transaction's parsed details in the engine so transaction("...") expressions can read it.
#[wasm_bindgen]
pub fn set_transaction_data(sig: &str, value: JsValue) -> Result<(), JsValue> {
    let val: engine::Value = serde_wasm_bindgen::from_value(value)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    engine::set_transaction_data(sig, val);
    Ok(())
}

