#!/usr/bin/env node
// Prints a Markdown summary of the Playwright JSON results (test-results/results.json).
// CI appends it to the run page ($GITHUB_STEP_SUMMARY) instead of publishing the HTML report,
// because step titles in that report contain typed values such as passwords.
// Only test titles and counts are printed, never error messages or step details.
const { readFileSync } = require('node:fs');

const file = process.argv[2] ?? 'test-results/results.json';
let results;
try {
  results = JSON.parse(readFileSync(file, 'utf8'));
} catch {
  console.log(`## Test results\n\nNo results found in \`${file}\`. The run probably failed before the tests started.`);
  process.exit(0);
}

const problems = [];
function walk(suite) {
  for (const spec of suite.specs ?? []) {
    const statuses = (spec.tests ?? []).map((t) => t.status);
    const status = statuses.includes('unexpected') ? 'unexpected' : statuses.includes('flaky') ? 'flaky' : undefined;
    if (status) problems.push({ status, title: spec.title, file: spec.file });
  }
  for (const child of suite.suites ?? []) walk(child);
}
for (const suite of results.suites ?? []) walk(suite);

const { expected = 0, unexpected = 0, flaky = 0, skipped = 0 } = results.stats ?? {};
const lines = [
  `## Test results: ${unexpected > 0 ? '❌ failed' : '✅ passed'}`,
  '',
  `${expected} passed, ${unexpected} failed, ${flaky} flaky, ${skipped} skipped`,
];
if (problems.length > 0) {
  lines.push('', '| Status | Test | File |', '| --- | --- | --- |');
  for (const p of problems) lines.push(`| ${p.status === 'flaky' ? '⚠️ flaky' : '❌ failed'} | ${p.title} | \`${p.file}\` |`);
}
console.log(lines.join('\n'));
