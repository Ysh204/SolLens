pub mod functions;

use crate::RuntimeFunction;

pub fn register_functions<F>(mut register_fn: F)
where
    F: FnMut(&str, RuntimeFunction),
{
    register_fn("sha256", functions::hash::sha256_fn);
    register_fn("rent", functions::rent::rent_fn);
    register_fn("lamports", functions::lamports::lamports_fn);
}
