import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const rustupHome = process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");
const cargoBin = join(cargoHome, "bin");
const pathEntries = [cargoBin, process.env.PATH ?? ""];
const env = {
  ...process.env,
  CARGO_HOME: cargoHome,
  RUSTUP_HOME: rustupHome,
  PATH: pathEntries.join(process.platform === "win32" ? ";" : ":"),
};
const persistedEnvPath = join(repoRoot, ".vercel-rust-env.json");

mkdirSync(repoRoot, { recursive: true });
writeFileSync(
  persistedEnvPath,
  `${JSON.stringify(
    {
      CARGO_HOME: env.CARGO_HOME,
      RUSTUP_HOME: env.RUSTUP_HOME,
      PATH: env.PATH,
    },
    null,
    2,
  )}\n`,
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("rustup", ["toolchain", "install", "stable", "--profile", "minimal", "--no-self-update"]);
run("rustup", ["default", "stable"]);
run("rustup", ["target", "add", "wasm32-unknown-unknown"]);

run("which", ["cargo"]);
run("which", ["rustup"]);
run("rustup", ["show"]);
run("cargo", ["--version"]);
run("rustc", ["--version"]);

const wasmPackCheck = spawnSync("wasm-pack", ["--version"], {
  cwd: repoRoot,
  stdio: "ignore",
  shell: false,
  env,
});

if (wasmPackCheck.status !== 0) {
  run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);
}

run("corepack", ["pnpm", "install", "--frozen-lockfile"]);