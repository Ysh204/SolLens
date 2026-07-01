import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

// ── Ensure Rust env is set ──────────────────────────────────────────
// Turbo/pnpm may not fully propagate env vars from the parent build
// script, so we set CARGO_HOME, RUSTUP_HOME, and PATH ourselves.
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const rustupHome = process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");
const cargoBin = join(cargoHome, "bin");

process.env.CARGO_HOME = cargoHome;
process.env.RUSTUP_HOME = rustupHome;
if (!process.env.PATH?.includes(cargoBin)) {
  process.env.PATH = [cargoBin, process.env.PATH ?? ""].join(":");
}

function run(command, args) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Ensure the default toolchain is set (may not persist across Vercel phases).
run("rustup", ["default", "stable"]);

// Build WASM. Toolchain installed by scripts/vercel-install.mjs in CI.
run("wasm-pack", ["build", "--release", "--target", "bundler", "--out-dir", "pkg"]);