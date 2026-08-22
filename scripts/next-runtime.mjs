import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const wasmDirectory = path.join(projectRoot, "node_modules", "@next", "swc-wasm-nodejs");
const [command = "dev", ...args] = process.argv.slice(2);
const nodeMajor = Number.parseInt(process.versions.node, 10);
const environment = { ...process.env };

// Next's native Windows compiler may not load under Node 25. Keep the
// normal native path everywhere else, and use Next's official WASM package
// only for that runtime combination.
if (process.platform === "win32" && nodeMajor >= 25 && existsSync(wasmDirectory)) {
  environment.NEXT_TEST_WASM_DIR = wasmDirectory;
}

const child = spawn(process.execPath, [nextCli, command, ...args], {
  cwd: projectRoot,
  env: environment,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
