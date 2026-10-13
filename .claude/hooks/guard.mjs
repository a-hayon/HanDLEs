// PreToolUse hook (before Bash / Read / Edit / Write): blocks dangerous commands and access to secret .env files.
// Exit 0 = allowed. Exit 2 = blocked: the tool call doesn't run and stderr explains why to Claude.
const input = JSON.parse(await new Response(process.stdin).text());
const { tool_name: tool, tool_input: args = {} } = input;

function block(reason) {
  console.error(`Blocked by .claude/hooks/guard.mjs: ${reason}`);
  process.exit(2);
}

// .env, .env.local, .env.production… but not .env.example (no secrets, documents the variables).
const SECRET_ENV_FILE = /(^|\/)\.env(\.(?!example$)[\w.-]+)?$/;
// Same idea inside a shell command: `.env` or `.env.something` as a word, except `.env.example`.
const SECRET_ENV_IN_COMMAND = /(^|[\s"'=/])\.env(\.(?!example\b)[\w.-]+)?(?=$|[\s"';|&)])/;

if (["Read", "Edit", "Write", "MultiEdit"].includes(tool) && SECRET_ENV_FILE.test(args.file_path ?? "")) {
  block("secret .env files must not be read or written. Use .env.example to document a variable.");
}

if (tool === "Bash") {
  const command = args.command ?? "";
  const rules = [
    [/\bgit\s+push\b.*\s(-f|--force|--force-with-lease)\b/, "force push rewrites the shared history. Push normally."],
    [/\bgit\s+reset\s+--hard\b/, "git reset --hard throws away uncommitted work. Ask the user first."],
    [/\bgit\s+(commit|push)\b.*\s--no-verify\b/, "--no-verify skips the repository checks."],
    [/\brm\s+(-\w*r\w*f|-\w*f\w*r|--recursive\s+--force|--force\s+--recursive)\b/, "rm -rf is not allowed here."],
    [SECRET_ENV_IN_COMMAND, "shell commands must not touch secret .env files."],
  ];
  for (const [pattern, reason] of rules) {
    if (pattern.test(command)) block(reason);
  }
}
