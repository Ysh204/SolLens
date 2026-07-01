import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const rustupHome = process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");
const cargoBin = join(cargoHome, "bin");

// Set env vars so every child process inherits them.
process.env.CARGO_HOME = cargoHome;
process.env.RUSTUP_HOME = rustupHome;
process.env.PATH = [cargoBin, process.env.PATH ?? ""].join(":");

function run(command, args) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
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

// ── Rust toolchain ──────────────────────────────────────────────────
run("rustup", ["toolchain", "install", "stable", "--profile", "minimal", "--no-self-update"]);
run("rustup", ["default", "stable"]);
run("rustup", ["target", "add", "wasm32-unknown-unknown"]);

// Verify
run("rustup", ["show"]);
run("cargo", ["--version"]);
run("rustc", ["--version"]);

// ── wasm-pack ───────────────────────────────────────────────────────
const wasmPackCheck = spawnSync("wasm-pack", ["--version"], {
  cwd: repoRoot,
  stdio: "ignore",
  shell: false,
  env: process.env,
});

if (wasmPackCheck.error?.code === "ENOENT" || wasmPackCheck.status !== 0) {
  run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);
}

// ── Node dependencies ───────────────────────────────────────────────
run("corepack", ["pnpm", "install", "--frozen-lockfile"]);