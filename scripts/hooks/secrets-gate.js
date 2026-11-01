#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: Bash).
//
// Before any `git ... push` command, scan the commits that are not on a remote yet and block
// the push (exit code 2) if they add something that looks like a credential.
// It applies to the main session and to every subagent. It fails closed: an error blocks.
//
// It is a pattern check, not a guarantee. Known limits: it misses unquoted values, encoded
// or split secrets, values shorter than 4 characters, and pushes made outside Claude Code.
// Its report never contains the matched value.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const NAME = '(?:password|passwd|pwd|secret|token|api_?key|authorization|credential)';
// A credential-like name, an optional TypeScript type, an assignment or colon, then a quoted
// literal. The name must not sit inside a string.
const OPERATOR = '(?:\\?\\?=|\\|\\|=|:=|={1,3}|:)';
const TYPE = '(?:\\s*:\\s*[A-Za-z_][\\w<>\\[\\]| .]*)?';
const UNQUOTED_KEY = new RegExp(
  `(?<![\\w"'\`])([A-Za-z_]*${NAME}[A-Za-z_]*)${TYPE}\\s*${OPERATOR}\\s*(["'\`])([^"'\`\\r\\n]{4,})\\2`,
  'i',
);
// The same with a quoted key, as in JSON.
const QUOTED_KEY = new RegExp(
  `(["'])([A-Za-z_]*${NAME}[A-Za-z_]*)\\1\\s*[:=]+\\s*(["'\`])([^"'\`\\r\\n]{4,})\\3`,
  'i',
);
const KEY_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9]{36,}/,
  /github_pat_[A-Za-z0-9_]{22,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[abprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /Bearer\s+[A-Za-z0-9._~+/-]{20,}=*/,
];
const SKIP_FILES = new Set(['package-lock.json', '.env.example']);
const PLACEHOLDER = /^(?:<.*>|\*+|x+|your[-_ ].*|Bearer\s*)$/i;
const PUSH_COMMAND = /\bgit\b(?:\s+-\S+(?:\s+\S+)?)*\s+push\b/;

function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function literalCredential(text) {
  const unquoted = UNQUOTED_KEY.exec(text);
  if (unquoted) {
    const [, name, quote, value] = unquoted;
    const before = text.slice(0, unquoted.index);
    const insideString = (before.split(quote).length - 1) % 2 === 1;
    if (!insideString && !value.includes('${') && !PLACEHOLDER.test(value)) return name;
  }
  const quoted = QUOTED_KEY.exec(text);
  if (quoted) {
    const [, , name, , value] = quoted;
    if (!value.includes('${') && !PLACEHOLDER.test(value)) return name;
  }
  return null;
}

function check(text) {
  const name = literalCredential(text);
  if (name) return `literal value assigned to "${name}"`;
  if (KEY_PATTERNS.some((pattern) => pattern.test(text))) return 'key or token pattern';
  return null;
}

function scan(cwd) {
  const out = execFileSync(
    'git',
    [
      '-c', 'core.quotepath=off', '-c', 'diff.noprefix=false', '-c', 'diff.mnemonicprefix=false',
      'log', '-p', '-m', '--no-color', '--no-ext-diff', '--no-renames',
      '--src-prefix=a/', '--dst-prefix=b/', '--branches', 'HEAD', '--not', '--remotes',
    ],
    { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 20000 },
  );
  const findings = [];
  let commit = '';
  let file = '';
  let line = 0;
  let inDiff = false;
  let inHunk = false;
  for (const text of out.split('\n')) {
    if (inHunk) {
      // Hunk lines always start with a marker. Any other line ends the hunk.
      const marker = text[0];
      if (marker === ' ' || marker === '+' || marker === '-' || marker === '\\') {
        if (marker === '-' || marker === '\\') continue;
        line += 1;
        if (marker === '+' && !SKIP_FILES.has(path.basename(file))) {
          const rule = check(text.slice(1));
          if (rule) findings.push({ commit, file, line, rule });
        }
        continue;
      }
      inHunk = false;
    }
    if (text.startsWith('commit ')) {
      commit = text.slice(7, 14);
      inDiff = false;
      continue;
    }
    if (text.startsWith('diff --git ')) {
      inDiff = true;
      file = (/ b\/(.*)$/.exec(text) || [, ''])[1];
      const base = path.basename(file);
      if (/^\.env(\..+)?$/.test(base) && !SKIP_FILES.has(base)) {
        findings.push({ commit, file, line: 0, rule: 'env file is part of a commit' });
      }
      continue;
    }
    if (!inDiff) {
      if (text.startsWith('    ')) {
        const rule = check(text);
        if (rule) findings.push({ commit, file: '(commit message)', line: 0, rule });
      }
      continue;
    }
    const hunk = /^@@ -\S+ \+(\d+)/.exec(text);
    if (hunk) {
      inHunk = true;
      line = Number(hunk[1]) - 1;
    }
  }
  return findings;
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (error) {
  block(`secrets-gate: could not read the hook input (${error.message}). Push blocked.`);
}

if (input.tool_name !== 'Bash') process.exit(0);
const command = String((input.tool_input && input.tool_input.command) || '');
if (!PUSH_COMMAND.test(command)) process.exit(0);

try {
  const findings = scan(input.cwd || process.cwd());
  if (findings.length === 0) process.exit(0);
  const lines = findings.map((f) => `  ${f.file}:${f.line} (commit ${f.commit}) ${f.rule}, value hidden`);
  block(
    `secrets-gate: push blocked. Possible credentials in commits that are not on a remote yet:\n${lines.join('\n')}\n` +
      'Remove them (read credentials from process.env or generate them at runtime), then fix the unpushed ' +
      'commit with `git commit --amend` or `git reset --soft` and commit again. Do not force-push. ' +
      'The scan covers every local branch that is not on a remote, so delete a stale local branch that holds the value.',
  );
} catch (error) {
  block(`secrets-gate: scan failed (${error.message}). Push blocked.`);
}
