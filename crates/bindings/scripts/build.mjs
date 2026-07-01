import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

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

// The Rust toolchain and wasm-pack are expected to be installed already
// (by scripts/vercel-install.mjs in CI, or manually in local dev).
run("wasm-pack", ["build", "--release", "--target", "bundler", "--out-dir", "pkg"]);