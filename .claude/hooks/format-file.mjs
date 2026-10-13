// PostToolUse hook (after Edit / Write): formats the edited file with Prettier, then runs ESLint --fix on it.
// Exit 0 = all good. Exit 2 = ESLint errors remain: stderr is sent back to Claude so it fixes them.
import { spawnSync } from "node:child_process";
import { extname, join, relative, resolve } from "node:path";

const input = JSON.parse(await new Response(process.stdin).text());
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
const rel = relative(root, resolve(root, filePath));
// Only files of this project, outside generated folders.
if (rel.startsWith("..") || /^(node_modules|dist)\//.test(rel)) process.exit(0);

const PRETTIER_EXTS = [".ts", ".mts", ".js", ".mjs", ".vue", ".json", ".md", ".css", ".html"];
const ESLINT_EXTS = [".ts", ".mts", ".js", ".mjs", ".vue"];
const ext = extname(rel);
const bin = (name) => join(root, "node_modules", ".bin", name);

if (PRETTIER_EXTS.includes(ext)) {
  spawnSync(bin("prettier"), ["--write", "--log-level=warn", rel], { cwd: root, encoding: "utf8" });
}

if (ESLINT_EXTS.includes(ext)) {
  const eslint = spawnSync(bin("eslint"), ["--fix", rel], { cwd: root, encoding: "utf8" });
  if (eslint.status !== 0) {
    console.error(`ESLint still reports problems in ${rel} after --fix:\n${eslint.stdout}${eslint.stderr}`);
    process.exit(2);
  }
}
