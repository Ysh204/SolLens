pub mod functions;

use crate::RuntimeFunction;

pub fn register_functions<F>(mut register_fn: F)
where
    F: FnMut(&str, RuntimeFunction),
{
    register_fn("sha256", functions::hash::sha256_fn);
    register_fn("rent", functions::rent::rent_fn);
    register_fn("lamports", functions::lamports::lamports_fn);

    register_fn("base58_encode", functions::base58::base58_encode_fn);
    register_fn("base58_decode", functions::base58::base58_decode_fn);
    register_fn("is_base58", functions::base58::is_base58_fn);
    register_fn("bytes_to_base58", functions::base58::bytes_to_base58_fn);

    register_fn("pubkey", functions::pubkey::pubkey_fn);
    register_fn("is_on_curve", functions::pubkey::is_on_curve_fn);
    register_fn("bytes", functions::pubkey::bytes_fn);
    register_fn("pubkey_from_bytes", functions::pubkey::pubkey_from_bytes_fn);

    register_fn("account_discriminator", functions::discriminator::account_discriminator_fn);
    register_fn(
        "instruction_discriminator",
        functions::discriminator::instruction_discriminator_fn,
    );
}
