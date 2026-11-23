// Prints the directory match report for the 18 routine teachers.
// Run: node scripts/check-teacher-match.mjs
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  [
    "vitest",
    "run",
    "src/test/routine.test.ts",
    "-t",
    "prints the match report for all distinct teachers",
    "--disableConsoleIntercept",
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
