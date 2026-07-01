import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? "";
const cargoHome = process.env.CARGO_HOME ?? join(homeDir, ".cargo");
const rustupHome = process.env.RUSTUP_HOME ?? join(homeDir, ".rustup");
const cargoBin = join(cargoHome, "bin");

// Vercel runs install and build in separate processes, so env vars from
// the install phase are lost. Re-establish the Rust environment here.
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

// The toolchain was installed by vercel-install.mjs (persisted on disk),
// but the "default" setting may not survive across Vercel phases.
// Re-set it to be safe.
run("rustup", ["default", "stable"]);

// Verify the toolchain is visible.
run("rustup", ["show"]);
run("cargo", ["--version"]);

// Run the full Turbo build — it will build @sollens/bindings first
// (via ^build dependency), then apps/web.
run("corepack", ["pnpm", "build"]);