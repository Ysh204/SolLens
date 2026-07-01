use crate::RuntimeValue;
use super::helpers::{anchor_discriminator, expect_one_arg, value_to_string};

pub fn account_discriminator_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let name = value_to_string(expect_one_arg(&args, "account_discriminator")?)?;
    Ok(RuntimeValue::Bytes(anchor_discriminator("account", &name)))
}

pub fn instruction_discriminator_fn(args: Vec<RuntimeValue>) -> Result<RuntimeValue, String> {
    let name = value_to_string(expect_one_arg(&args, "instruction_discriminator")?)?;
    Ok(RuntimeValue::Bytes(anchor_discriminator("global", &name)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Digest, Sha256};

    #[test]
    fn vault_account_discriminator() {
        let result = account_discriminator_fn(vec![RuntimeValue::String("Vault".to_string())]).unwrap();
        let expected = Sha256::digest(b"account:Vault")[..8].to_vec();
        assert_eq!(result, RuntimeValue::Bytes(expected));
    }

    #[test]
    fn initialize_instruction_discriminator() {
        let result =
            instruction_discriminator_fn(vec![RuntimeValue::String("initialize".to_string())]).unwrap();
        let expected = Sha256::digest(b"global:initialize")[..8].to_vec();
        assert_eq!(result, RuntimeValue::Bytes(expected));
    }
}
