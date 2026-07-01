import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const cargoBin = join(cargoHome, "bin");

// Ensure cargo/rustup are on PATH for Turbo-spawned child processes.
if (!process.env.PATH?.includes(cargoBin)) {
  process.env.PATH = [cargoBin, process.env.PATH ?? ""].join(":");
}
process.env.CARGO_HOME ??= cargoHome;
process.env.RUSTUP_HOME ??= process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");

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

// Rust toolchain is already installed by vercel-install.mjs.
// Just run the full Turbo build — it will build @sollens/bindings first
// (via ^build dependency), then apps/web.
run("corepack", ["pnpm", "build"]);