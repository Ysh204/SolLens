# SolLens

> **The programmable toolbox for Solana developers.**

**SolLens** is an interactive development environment and expression language for Solana.

Instead of switching between CLI tools, online calculators, explorers, documentation, and one-off Rust scripts, SolLens brings everything into a single developer experience.

Write expressions such as:

```text
sha256("hello")

lamports(1.5)

rent(128)

account_discriminator("Vault")

pda("vault", wallet, program)
```

and get instant, structured results.

---

## Vision

Modern Solana development often requires juggling multiple tools:

* Solana CLI
* Anchor CLI
* Solana Explorer
* Solscan
* Base58 converters
* Rent calculators
* PDA scripts
* Rust snippets
* TypeScript snippets
* Documentation

SolLens aims to replace this fragmented workflow with a unified environment built specifically for Solana developers.

Think of it as:

* **CyberChef** for Solana
* **Wolfram Alpha** for blockchain developers
* **Raycast** for Solana engineering
* **A programmable REPL for Solana**

---

# Features

## Expression Language

Every operation is an expression.

```text
echo("hello")

upper("solana")

sha256("hello")

lamports(1.5)

rent(128)
```

Future releases will support:

```text
pda(...)

ata(...)

account_size(...)

decode(...)

idl(...)

simulate(...)
```

---

## Interactive Playground

* Monaco-powered editor
* Syntax highlighting
* Compiler diagnostics
* Inline error markers
* Keyboard-first workflow
* Instant evaluation

---

## Compiler-Grade Diagnostics

Instead of generic errors:

```text
Unknown function
```

SolLens provides contextual diagnostics:

```text
Unknown function: sha25

Did you mean:

sha256
```

Errors include:

* precise source spans
* inline editor highlights
* suggestions
* structured diagnostics

---

## Solana Runtime

Current runtime includes:

* SHA-256 hashing
* SOL ↔ Lamports conversion
* Rent calculations

Future runtime modules include:

* PDA derivation
* ATA generation
* Anchor discriminators
* SPL Token helpers
* Borsh encoding
* IDL parsing
* Transaction decoding
* Account inspection
* Event decoding

---

# Architecture

```text
               Next.js

                  │

                  ▼

        WebAssembly Bindings

                  │

                  ▼

          Expression Engine

                  │

        ┌─────────┴─────────┐

        ▼                   ▼

     Parser             Registry

        │                   │

        └─────────┬─────────┘

                  ▼

               Runtime

                  │

              Solana APIs
```

Every feature flows through the same evaluation pipeline.

---

# Why SolLens?

Instead of writing this:

```rust
let hash = sha256(b"hello");
```

or opening multiple tools...

you simply type:

```text
sha256("hello")
```

and get the result immediately.

---

# Tech Stack

### Frontend

* Next.js
* React
* Monaco Editor
* Tailwind CSS
* Turborepo
* pnpm

### Core Engine

* Rust
* Pratt Parser
* Custom AST
* Expression Evaluator
* Function Registry
* Compiler Diagnostics

### Runtime

* Rust
* rust_decimal
* sha2
* Solana SDK *(planned)*
* Anchor *(planned)*

### Interoperability

* WebAssembly
* wasm-bindgen

---

# Monorepo Structure

```text
sollens/
├── apps/
│   └── web/
│
├── crates/
│   ├── bindings/
│   ├── engine/
│   ├── parser/
│   └── runtime/
│
├── packages/
│   ├── config/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
```

---

# Current Status

## Implemented

* Expression parser
* Pratt parser foundation
* AST
* Runtime registry
* Compiler diagnostics
* Monaco integration
* WebAssembly bindings
* SHA-256
* Lamports conversion
* Rent calculator

---

## Roadmap

### Phase 1 ✅

* Project initialization
* Monorepo
* Rust workspace
* WebAssembly
* Next.js integration

### Phase 2 ✅

* Pratt parser
* Expression engine
* Diagnostics
* Runtime registry
* Monaco editor

### Phase 3

* Base58 tools
* Public key utilities
* Anchor discriminators
* ATA calculator
* PDA derivation

### Phase 4

* Borsh playground
* IDL explorer
* Account layout inspector
* Transaction decoder
* Event decoder

### Phase 5

* RPC playground
* Transaction simulator
* Compute analyzer
* Workspace support
* Shareable expressions

### Phase 6

* Plugin system
* AI debugging assistant
* VS Code extension
* CLI

---

# Design Principles

SolLens follows a few core principles:

### Programmable

Everything should be expressible through the language.

---

### Fast

The evaluation engine runs in Rust and compiles to WebAssembly for near-native performance.

---

### Local First

Most functionality runs entirely in your browser.

No backend required.

---

### Extensible

The runtime is designed around function registration, making it easy to add new modules and capabilities.

---

### Developer Experience

Every decision prioritizes developer productivity:

* keyboard-first
* autocomplete
* diagnostics
* discoverability
* minimal friction

---

# Example

```text
sha256("hello")
```

↓

```text
0x2cf24dba5fb0a30e26e83b2ac5b9e29e...
```

---

```text
lamports(1.5)
```

↓

```text
1500000000
```

---

```text
rent(128)
```

↓

```text
1781760
```

---

# Contributing

Contributions are welcome.

Whether you're interested in:

* parser development
* Solana runtime features
* UI/UX
* documentation
* testing
* performance
* developer tooling

we'd love your help.

Before opening a pull request:

1. Run formatting and linting.
2. Ensure all tests pass.
3. Keep changes focused and well documented.

---

# Long-Term Vision

The long-term goal is for SolLens to become the standard developer toolbox for the Solana ecosystem.

Not just another calculator.

Not another explorer.

Not another IDE.

But a programmable environment where developers can inspect, encode, decode, debug, simulate, and understand every aspect of Solana from one place.

---

## License

MIT

---

Built with ❤️ in Rust for the Solana ecosystem.
