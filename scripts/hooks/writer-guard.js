#!/usr/bin/env node
// Claude Code PreToolUse hook, attached to the playwright-test-writer agent only (see its
// frontmatter). It turns that agent's scope rules into a technical limit:
//   - file edits and writes are allowed under tests/ only;
//   - Bash is allowed for a short allow-list (typecheck, tests, read-only git, ls, pwd), and
//     any command with shell operators is blocked.
// It exits with code 2 to block, and it fails closed: an error blocks.
//
// It is not a sandbox. A spec the agent writes under tests/ is code that `playwright test`
// runs, so the limit stops accidental drift and obvious commands such as commit or push,
// not a determined bypass. The caller still checks `git status` afterwards.

const fs = require('node:fs');
const path = require('node:path');

function block(message) {
  process.stderr.write(`writer-guard: blocked. ${message}\n`);
  process.exit(2);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (error) {
  block(`could not read the hook input (${error.message}).`);
}

const toolInput = input.tool_input || {};
const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd());

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(input.tool_name)) {
  const target = toolInput.file_path || toolInput.notebook_path;
  if (!target) block('no file path in the tool input.');
  const resolved = path.resolve(input.cwd || projectDir, String(target));
  const testsDir = path.join(projectDir, 'tests') + path.sep;
  if (!resolved.startsWith(testsDir)) {
    block(`this agent may only edit files under tests/ (got ${path.relative(projectDir, resolved)}).`);
  }
  process.exit(0);
}

if (input.tool_name === 'Bash') {
  const command = String(toolInput.command || '').trim();
  const allowed = [
    /^npm run (?:typecheck|test)(?: .*)?$/,
    /^npm test(?: .*)?$/,
    /^npx playwright test(?: .*)?$/,
    /^git (?:status|diff|log|show|ls-files|check-ignore)(?: .*)?$/,
    /^(?:ls|pwd)(?: .*)?$/,
  ];
  if (/[;&|<>`$\\(){}\n\r]/.test(command)) {
    block('shell operators (; & | < > ` $ \\ ( ) { }) and line breaks are not allowed.');
  }
  // Options that write files or make a command load other code.
  const forbiddenOption =
    /(?:^|\s)(?:--output|--ext-diff|--textconv|--reporter|--config|--tsconfig|--global-setup|--global-teardown|-c)(?:[\s=]|$)/;
  if (forbiddenOption.test(command)) {
    block('this option can write files or load other code (--output, --ext-diff, --reporter, --config, -c, ...).');
  }
  if (!allowed.some((pattern) => pattern.test(command))) {
    block(
      'this agent may run only: npm run typecheck | test, npm test, npx playwright test, ' +
        'read-only git (status, diff, log, show, ls-files, check-ignore), ls, pwd. ' +
        'It must not add, commit, push or change git state; the caller does that.',
    );
  }
  process.exit(0);
}

block(`unexpected tool "${input.tool_name}".`);
