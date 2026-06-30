import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const cargoBin = join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".cargo", "bin");
const pathEntries = [cargoBin, process.env.PATH ?? ""];
const env = {
  ...process.env,
  PATH: pathEntries.join(process.platform === "win32" ? ";" : ":"),
};

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