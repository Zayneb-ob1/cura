import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const configPath = path.join(process.cwd(), ".mysql", "my.ini");

try {
  await access(configPath);
} catch {
  process.exit(0);
}

function isListening() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 3307 });
    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

if (await isListening()) process.exit(0);

const mysqlBinary = process.env.MYSQLD_BINARY ??
  "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe";
const child = spawn(mysqlBinary, [`--defaults-file=${configPath}`], {
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});
child.unref();

for (let attempt = 0; attempt < 30; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (await isListening()) process.exit(0);
}

throw new Error("The local CURA MySQL instance did not start");
