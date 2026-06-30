import { spawnSync } from "node:child_process";
import { join } from "node:path";

const cargoBin = join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".cargo", "bin");
const pathEntries = [cargoBin, process.env.PATH ?? ""];
const env = {
  ...process.env,
  PATH: pathEntries.join(process.platform === "win32" ? ";" : ":"),
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
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
  stdio: "ignore",
  shell: false,
  env,
});

if (wasmPackCheck.status !== 0) {
  run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);
}

run("corepack", ["pnpm", "install", "--frozen-lockfile"]);