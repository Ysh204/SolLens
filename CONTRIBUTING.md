# Contributing to SolLens

SolLens is an open-source developer platform for the Solana ecosystem. Whether you're fixing a bug, improving documentation, adding a new runtime function, or enhancing the UI, your contributions are welcome.

## Before You Start

* Search existing issues before opening a new one.
* If you're planning a large feature, open a discussion or issue first so we can agree on the design.
* Keep pull requests focused on a single topic.

## Development Setup

### Prerequisites

* Node.js 22+
* pnpm
* Rust (stable)
* wasm-pack

### Install dependencies

```bash
pnpm install
cargo check
```

### Start development

```bash
pnpm dev
```

### Run checks

```bash
pnpm lint
pnpm check-types
cargo fmt
cargo clippy
cargo test
```

All checks should pass before opening a pull request.

## Coding Guidelines

### Rust

* Follow `rustfmt`.
* Ensure `cargo clippy` reports no warnings.
* Prefer small, composable modules.
* Add unit tests for new functionality.

### TypeScript

* Use strict typing.
* Avoid `any` unless absolutely necessary.
* Keep components focused and reusable.

## Commit Messages

We follow Conventional Commits.

Examples:

```text
feat(parser): add Pratt parser support

feat(runtime): implement pda()

fix(engine): improve diagnostics

docs: update README
```

## Pull Requests

Please ensure that your pull request:

* Has a clear title.
* Includes a description of the change.
* Includes tests when applicable.
* Updates documentation if needed.
* Keeps unrelated changes out of the PR.

## Reporting Bugs

When reporting bugs, please include:

* SolLens version
* Operating system
* Browser (if applicable)
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots or logs if available

## Feature Requests

Feature requests are encouraged. Please explain:

* The problem you're trying to solve
* Your proposed solution
* Possible alternatives
* Additional context

## Project Philosophy

SolLens aims to be:

* Fast
* Reliable
* Local-first
* Developer-friendly
* Well documented
* Extensible

When contributing, please keep these principles in mind.

