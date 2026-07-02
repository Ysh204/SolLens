import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { parsePubkey } from "./bytes";

export interface AtaResult {
  ata: string;
  wallet: string;
  mint: string;
  tokenProgram: string;
  associatedTokenProgram: string;
  bytes: Uint8Array;
  isOnCurve: boolean;
}

export function deriveAta(
  walletInput: string,
  mintInput: string,
  tokenProgramInput?: string,
): AtaResult {
  const wallet = parsePubkey(walletInput);
  const mint = parsePubkey(mintInput);
  const tokenProgram = tokenProgramInput
    ? parsePubkey(tokenProgramInput)
    : TOKEN_PROGRAM_ID;

  const ata = getAssociatedTokenAddressSync(mint, wallet, false, tokenProgram, ASSOCIATED_TOKEN_PROGRAM_ID);

  return {
    ata: ata.toBase58(),
    wallet: wallet.toBase58(),
    mint: mint.toBase58(),
    tokenProgram: tokenProgram.toBase58(),
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
    bytes: ata.toBytes(),
    isOnCurve: PublicKey.isOnCurve(ata.toBytes()),
  };
}
