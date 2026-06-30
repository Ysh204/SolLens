import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const wasmPackCheck = spawnSync("wasm-pack", ["--version"], {
  cwd: packageRoot,
  stdio: "ignore",
  shell: false,
});

if (wasmPackCheck.status !== 0) {
  run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);
}

run("wasm-pack", ["build", "--release", "--target", "bundler", "--out-dir", "pkg"]);