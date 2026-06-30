import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const persistedEnvPath = join(repoRoot, ".vercel-rust-env.json");

let persistedEnv = {};
try {
  persistedEnv = JSON.parse(readFileSync(persistedEnvPath, "utf8"));
} catch {
  persistedEnv = {};
}

const env = {
  ...process.env,
  ...persistedEnv,
};

const result = spawnSync("corepack", ["pnpm", "build"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: false,
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);