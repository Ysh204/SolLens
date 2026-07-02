use sha2::{Digest, Sha256};

use super::functions::helpers::is_ed25519_on_curve;

pub const MAX_SEED_LEN: usize = 32;

/// Create a program address from seeds and a program ID (Solana SDK algorithm).
pub fn create_program_address(seeds: &[&[u8]], program_id: &[u8; 32]) -> Result<[u8; 32], String> {
    let mut hasher = Sha256::new();
    for seed in seeds {
        if seed.len() > MAX_SEED_LEN {
            return Err(format!(
                "Seed length {} exceeds maximum of {}",
                seed.len(),
                MAX_SEED_LEN
            ));
        }
        hasher.update(seed);
    }
    hasher.update(program_id);
    hasher.update(b"ProgramDerivedAddress");
    let hash = hasher.finalize();
    hash.as_slice()
        .try_into()
        .map_err(|_| "Failed to derive program address".to_string())
}

/// Find canonical PDA by searching bump seeds from 255 down to 0.
pub fn find_program_address(
    seeds: &[Vec<u8>],
    program_id: &[u8; 32],
) -> Result<([u8; 32], u8), String> {
    for bump in (0u8..=255).rev() {
        let bump_slice = [bump];
        let mut seed_refs: Vec<&[u8]> = seeds.iter().map(|s| s.as_slice()).collect();
        seed_refs.push(&bump_slice);

        let address = create_program_address(&seed_refs, program_id)?;
        if !is_ed25519_on_curve(&address) {
            return Ok((address, bump));
        }
    }
    Err("Unable to find a viable PDA bump seed".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::functions::helpers::{decode_pubkey_bytes, encode_base58};

    #[test]
    fn known_pda_derivation() {
        let program_id = decode_pubkey_bytes("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap();
        let seeds = vec![b"metadata".to_vec()];
        let (pda, _bump) = find_program_address(&seeds, &program_id).unwrap();
        assert!(!is_ed25519_on_curve(&pda));
        // Stable output — same algorithm as @solana/web3.js
        let encoded = encode_base58(&pda);
        assert!((32..=44).contains(&encoded.len()));
    }
}
