---
name: triage-ci-failure
description: Works out why a GitHub Actions run failed or a test was flaky - a real regression, a flaky test, a known bug, or a change on the live demo site - without leaking typed credentials from logs or reports. Use when CI fails or the report shows a flaky test.
user-invocable: true
---

# Triage a CI failure

Follow CLAUDE.md. Investigate every test the report marks as flaky; a retry that passes is
not a fix.

## 1. Find the failing run and tests

- `gh pr checks <n>` or `gh run list --branch <branch>` gives the run id.
- Start from the run page summary (`scripts/ci-summary.js` output). It lists only counts and
  the titles and files of failed or flaky tests.

## 2. Handle logs and reports with care

Step titles in the HTML report and in test output can contain typed values such as
passwords. That is why CI encrypts the report.

- Read `gh run view <id> --log-failed` yourself, but never paste raw log or report text into
  the chat, a PR, an issue or a commit. Quote only the test title, the failed assertion and
  the locator. To limit what you read, filter the output to the failure lines, for example
  `gh run view <id> --log-failed | grep -E "✘|Error|expect|locator"`.
- Never search logs or reports for credentials.
- Do not try to decrypt the report; it needs the user's private key. When the report is
  needed, give the user these commands:
  `gh run download <run-id> -n encrypted-report`, then
  `gpg --decrypt report.tar.gz.gpg | tar xz`, then `npx playwright show-report`.

## 3. Classify the failure

Check in this order and stop at the first match:

1. **Known bug.** Tests tagged `@known-bug` assert the correct behavior that the demo site
   does not meet yet, so they are expected to fail. The default run and CI exclude them, so a
   CI failure is not one of them unless the workflow was changed to run them. A local
   `npm run test:known-bugs` failure can be. Run `grep -rn @known-bug tests` and see whether
   the failing test or behavior matches one. A match is expected: say so, and do not "fix" it.
2. **Regression from this change.** Did the diff touch the failing test or a file it
   imports? Does the same test pass on the latest `main` run
   (`gh run list --branch main`)?
3. **Flaky test.** The summary marks it flaky (passed only on a CI retry), or it fails in
   some runs and passes in others without a related change.
4. **Change on the live site.** Different text, a missing product, a new page, a slow or
   failing response. Check the live page with read-only `curl` and compare it with what the
   test expects. The site is not ours, so the test is what changes.

## 4. Reproduce locally

Run the single test: `npx playwright test <file> -g "<title>"`. For a suspected flaky test,
add `--repeat-each=3`. Never use `--repeat-each` on `@creates-data` tests; each run registers
real accounts.

## 5. Fix at the cause

Use a better user-facing locator or an assertion that waits on a real application state.
Do not add retries, longer timeouts, `networkidle` waits or `force` clicks. Then continue
through the `feature-workflow` skill.

## 6. Report

Say which of the four causes it is and what shows it. If the evidence is mixed or you
cannot reproduce it, say so instead of picking a cause.
