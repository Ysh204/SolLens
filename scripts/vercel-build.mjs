import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const rustupHome = process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");
const cargoBin = join(cargoHome, "bin");

mkdirSync(repoRoot, { recursive: true });

process.env.CARGO_HOME = cargoHome;
process.env.RUSTUP_HOME = rustupHome;
process.env.PATH = [cargoBin, process.env.PATH ?? ""].join(process.platform === "win32" ? ";" : ":");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runAndCapture(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "pipe",
    shell: false,
    env: process.env,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function installRustIfNeeded() {
  const rustupPresent = spawnSync("rustup", ["--version"], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: false,
    env: process.env,
  });

  if (rustupPresent.error) {
    const installer = spawnSync("sh", ["-lc", "curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal --no-modify-path"], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    if (installer.error) {
      throw installer.error;
    }

    if (installer.status !== 0) {
      process.exit(installer.status ?? 1);
    }
  }
}

installRustIfNeeded();

function ensureRust() {
  const rustupCheck = spawnSync("rustup", ["show"], {
    cwd: repoRoot,
    stdio: "pipe",
    shell: false,
    env: process.env,
    encoding: "utf8",
  });

  if (rustupCheck.error) {
    throw rustupCheck.error;
  }

  const rustupOutput = `${rustupCheck.stdout ?? ""}${rustupCheck.stderr ?? ""}`;

  if (rustupOutput.includes("no default toolchain") || rustupOutput.includes("no default toolchain configured")) {
    run("rustup", ["toolchain", "install", "stable"]);
    run("rustup", ["default", "stable"]);
  }

  run("rustup", ["toolchain", "install", "stable", "--profile", "minimal", "--no-self-update"]);
  run("rustup", ["default", "stable"]);
  run("rustup", ["target", "add", "wasm32-unknown-unknown"]);
}

function ensureWasmPack() {
  const wasmPackCheck = spawnSync("wasm-pack", ["--version"], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: false,
    env: process.env,
  });

  if (wasmPackCheck.error && wasmPackCheck.error.code !== "ENOENT") {
    throw wasmPackCheck.error;
  }

  if (wasmPackCheck.error?.code === "ENOENT" || wasmPackCheck.status !== 0) {
    run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);

    const cargoBin = join(process.env.CARGO_HOME ?? cargoHome, "bin");
    process.env.PATH = [cargoBin, process.env.PATH ?? ""].join(process.platform === "win32" ? ";" : ":");
  }

  run("wasm-pack", ["--version"]);
}

ensureRust();

console.log("PATH", process.env.PATH);
console.log("CARGO_HOME", process.env.CARGO_HOME ?? cargoHome);
console.log("RUSTUP_HOME", process.env.RUSTUP_HOME ?? rustupHome);
console.log(runAndCapture("rustup", ["show"]));
console.log(runAndCapture("cargo", ["--version"]));
console.log(runAndCapture("rustc", ["--version"]));
console.log(runAndCapture("which", ["cargo"]));
console.log(runAndCapture("which", ["rustup"]));

ensureWasmPack();

run("corepack", ["pnpm", "build"]);