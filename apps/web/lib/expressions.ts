export interface ExpressionExample {
  label: string;
  expr: string;
}

export interface ExpressionGroup {
  label: string;
  examples: ExpressionExample[];
}

/** Live demo expressions run automatically when WASM loads */
export const DEMO_EXPRESSIONS = [
  'sha256("hello")',
  "lamports(1.5)",
  "rent(128)",
  "lamports(1.5) * 2",
  "1 + 2",
] as const;

/** Clickable examples grouped by category */
export const EXPRESSION_GROUPS: ExpressionGroup[] = [
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
    label: "Strings",
    examples: [
      { label: "Echo", expr: 'echo("hello")' },
      { label: "Upper", expr: 'upper("solana")' },
    ],
  },
  {
    label: "Arithmetic",
    examples: [
      { label: "1 + 2", expr: "1 + 2" },
      { label: "Lamports × 2", expr: "lamports(1.5) * 2" },
      { label: "Rent + 5000", expr: "rent(128) + 5000" },
    ],
  },
  {
    label: "Errors",
    examples: [
      { label: "Unknown fn", expr: 'sha25("hello")' },
      { label: "Wrong args", expr: "sha256()" },
    ],
  },
];

/** Functions currently implemented in the Rust engine */
export const ENGINE_FUNCTIONS = [
  { name: "echo", sig: "echo(x)", desc: "Return any value" },
  { name: "upper", sig: 'upper("text")', desc: "Uppercase a string" },
  { name: "sha256", sig: 'sha256("text")', desc: "SHA-256 hash → bytes" },
  { name: "lamports", sig: "lamports(1.5)", desc: "SOL → lamports (u64)" },
  { name: "rent", sig: "rent(128)", desc: "Rent-exempt minimum lamports" },
] as const;

export const HELP_TEXT = `Universal Expression Engine (Rust WASM)

Functions:
  echo(x)              Return any value
  upper("text")        Uppercase a string
  sha256("text")       SHA-256 hash → bytes
  lamports(1.5)        Convert SOL to lamports
  rent(128)            Rent-exempt minimum for bytes

Arithmetic:
  1 + 2                +  -  *  /
  lamports(1.5) * 2    Compose any expression
  rent(128) + 5000     Mix functions and math

Commands:
  help                 Show this message
  clear                Clear terminal output
  about                About SolLens`;
