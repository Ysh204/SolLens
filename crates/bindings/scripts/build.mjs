import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
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

function runAndPrint(command, args) {
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

const rustupShow = spawnSync("rustup", ["show"], {
  cwd: packageRoot,
  stdio: "pipe",
  shell: false,
  env: process.env,
  encoding: "utf8",
});

if (rustupShow.error) {
  throw rustupShow.error;
}

const rustupShowOutput = `${rustupShow.stdout ?? ""}${rustupShow.stderr ?? ""}`;

if (rustupShowOutput.includes("no default toolchain") || rustupShowOutput.includes("no default toolchain configured")) {
  run("rustup", ["toolchain", "install", "stable"]);
  run("rustup", ["default", "stable"]);
}

console.log("PATH", process.env.PATH);
console.log("CARGO_HOME", process.env.CARGO_HOME);
console.log("RUSTUP_HOME", process.env.RUSTUP_HOME);
runAndPrint("rustup", ["show"]);
runAndPrint("cargo", ["--version"]);
runAndPrint("rustc", ["--version"]);
runAndPrint("which", ["cargo"]);
runAndPrint("which", ["rustup"]);

const wasmPackCheck = spawnSync("wasm-pack", ["--version"], {
  cwd: packageRoot,
  stdio: "ignore",
  shell: false,
  env: process.env,
});

if (wasmPackCheck.error) {
  throw wasmPackCheck.error;
}

if (wasmPackCheck.status !== 0) {
  run("cargo", ["install", "wasm-pack", "--locked", "--version", "0.13.1"]);
}

run("wasm-pack", ["build", "--release", "--target", "bundler", "--out-dir", "pkg"]);