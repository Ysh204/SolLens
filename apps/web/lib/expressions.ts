export interface ExpressionExample {
  label: string;
  expr: string;
}

export interface ExpressionGroup {
  label: string;
  examples: ExpressionExample[];
}

/** Clickable examples grouped by category */
export const EXPRESSION_GROUPS: ExpressionGroup[] = [
  {
    label: "Base58",
    examples: [
      { label: "Encode", expr: 'base58_encode("hello")' },
      { label: "Decode", expr: 'base58_decode("Cn8eVZg")' },
      { label: "Is Base58?", expr: 'is_base58("Cn8eVZg")' },
      { label: "Bytes → Base58", expr: 'bytes_to_base58(sha256("hello"))' },
    ],
  },
  {
    label: "Pubkey",
    examples: [
      { label: "Pubkey", expr: 'pubkey("11111111111111111111111111111111")' },
      { label: "On curve?", expr: 'is_on_curve("11111111111111111111111111111111")' },
      { label: "To bytes", expr: 'bytes("11111111111111111111111111111111")' },
      {
        label: "From bytes",
        expr: 'pubkey_from_bytes(bytes("11111111111111111111111111111111"))',
      },
    ],
  },
  {
    label: "Anchor",
    examples: [
      { label: "Account", expr: 'account_discriminator("Vault")' },
      { label: "Instruction", expr: 'instruction_discriminator("initialize")' },
    ],
  },
  {
    label: "Crypto",
    examples: [{ label: "SHA256", expr: 'sha256("hello")' }],
  },
  {
    label: "Solana",
    examples: [
      { label: "Lamports", expr: "lamports(1.5)" },
      { label: "Rent", expr: "rent(128)" },
    ],
  },
  {
    label: "Arithmetic",
    examples: [
      { label: "1 + 2", expr: "1 + 2" },
      { label: "Lamports × 2", expr: "lamports(1.5) * 2" },
    ],
  },
  {
    label: "Errors",
    examples: [
      { label: "Unknown fn", expr: 'sha25("hello")' },
      { label: "Bad pubkey", expr: 'pubkey("not-a-pubkey")' },
    ],
  },
];

/** Functions currently implemented in the Rust engine */
export const ENGINE_FUNCTIONS = [
  { name: "base58_encode", sig: 'base58_encode("text")', desc: "Encode bytes → base58" },
  { name: "base58_decode", sig: 'base58_decode("…")', desc: "Decode base58 → bytes" },
  { name: "is_base58", sig: 'is_base58("…")', desc: "Check valid base58" },
  { name: "bytes_to_base58", sig: "bytes_to_base58(bytes)", desc: "Bytes → base58 string" },
  { name: "pubkey", sig: 'pubkey("…")', desc: "Validate & normalize pubkey" },
  { name: "is_on_curve", sig: 'is_on_curve("…")', desc: "Ed25519 on-curve check" },
  { name: "bytes", sig: 'bytes("…")', desc: "Pubkey string → 32 bytes" },
  { name: "pubkey_from_bytes", sig: "pubkey_from_bytes(bytes)", desc: "32 bytes → pubkey" },
  { name: "account_discriminator", sig: 'account_discriminator("Vault")', desc: "Anchor account disc." },
  { name: "instruction_discriminator", sig: 'instruction_discriminator("initialize")', desc: "Anchor ix disc." },
  { name: "sha256", sig: 'sha256("text")', desc: "SHA-256 hash → bytes" },
  { name: "lamports", sig: "lamports(1.5)", desc: "SOL → lamports (u64)" },
  { name: "rent", sig: "rent(128)", desc: "Rent-exempt minimum lamports" },
] as const;

export const HELP_TEXT = `Universal Expression Engine (Rust WASM)

Base58:
  base58_encode("hello")              Encode UTF-8 / bytes → base58
  base58_decode("Cn8eVZg")            Decode base58 → bytes
  is_base58("…")                      true if valid base58
  bytes_to_base58(sha256("hello"))    Bytes value → base58

Public Key:
  pubkey("11111…111")                 Validate 32-byte pubkey
  is_on_curve("11111…111")            Ed25519 on-curve check
  bytes("11111…111")                  Pubkey → raw bytes
  pubkey_from_bytes(bytes("…"))       32 bytes → base58 pubkey

Anchor Discriminators:
  account_discriminator("Vault")      sha256("account:Vault")[0..8]
  instruction_discriminator("init")   sha256("global:init")[0..8]

Solana & Crypto:
  sha256("text")    lamports(1.5)    rent(128)

Arithmetic:
  1 + 2    lamports(1.5) * 2    rent(128) + 5000

Commands:
  help    clear    about`;
