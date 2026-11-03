---
name: verify-change
description: Runs this repo's quality checks on the current change (relevant Playwright tests, TypeScript check, diff review) and reports what passed and failed. Use before committing, or whenever you need to confirm a change works.
user-invocable: true
---

# Verify a change

Runs the "Quality checks" from CLAUDE.md on the current branch. Follow CLAUDE.md for the
rules themselves; this skill only fixes the order and the reporting.

## 1. Choose the scope

Look at `git diff --name-only main...HEAD` plus uncommitted changes.

- Spec files (`tests/*.spec.ts`) changed: run those files.
- Only `tests/pages`, `tests/utils` or `tests/data` changed: run the specs that import the
  changed files (find them with Grep).
- `playwright.config.ts`, `package.json`, `tsconfig.json` or `scripts/` changed: run the full suite.
- Nothing under `tests/` or config changed (docs, `.claude/`, CI): skip the Playwright run
  and say so in the report.
- Tests tagged `@creates-data` are excluded by default because they register real accounts
  on the shop. Ask before running `npm run test:data`.

## 2. Run the checks

1. `npx playwright test <scope>`
2. `npm run typecheck`
3. For specs that are new or changed, also run them with `--repeat-each=3` to catch
   flakiness early. Run only those specs, not the whole suite, to keep load on the demo
   site low. Never use `--repeat-each` on `@creates-data` specs; each run would register
   real accounts.

Do not add retries, timeouts or `force` clicks to make a check pass.

## 3. Review the diff

Read `git diff main...HEAD` and look for unnecessary complexity: abstractions with one
user, unused helpers or dependencies, unrelated edits, duplicated setup. This is your own
pass; the `code-reviewer` agent is a separate step in the feature workflow.

## 4. Report

List each check as passed or failed, with the real result (counts, error text). A test that
passes only on retry or only some of the repeats is flaky: report it as flaky and
investigate it instead of calling it passed. If anything failed or was skipped, say so
plainly. Do not claim success without the command output to back it up.
