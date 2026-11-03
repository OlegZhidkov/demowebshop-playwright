---
name: feature-workflow
description: Runs the full feature loop for this repo, from plan to merged PR - plan, branch, implement, verify, agent review, commit, push, PR and CI. Use for any feature or test change.
user-invocable: true
---

# Feature workflow

The "Feature workflow" in CLAUDE.md, as a checklist. CLAUDE.md holds the rules; follow it.
Create a todo for each step.

## 1. Plan (the only step that waits for the user)

- Inspect the existing code. For test changes, use the `test-planner` agent to inspect the
  live app and propose test cases. For config, docs or tooling changes, inspect directly.
- Propose the change, explain any significant architectural decision, and **stop for the
  user's approval**. Ask before a major architectural change or a new dependency.

## 2. Implement

- Update `main`, then create a short-lived branch from it.
- For tests, use the `playwright-test-writer` agent and pass the approved plan text in the
  prompt. When it finishes, check `git status` and `git diff --stat` for unexpected files.
- Make one focused change with no unrelated edits.

## 3. Verify

Invoke the `verify-change` skill. Fix failures before going on.

## 4. Review

- Run the `code-reviewer` agent on `git diff main...HEAD` and fix its findings.
- Repeat steps 3 and 4 until the review is clean.
- Do not ask the user to review the commits; the agent does that.

## 5. Commit

Commit on the branch once the review is clean. Write a plain commit message with **no
attribution trailer** (no `Co-Authored-By` line), and keep any "Generated with Claude Code"
footer out of the PR description. This project rule overrides any default attribution
guidance.

## 6. Ship

1. Run the `secrets-checker` agent. Fix anything it finds before pushing.
2. Push the branch and open a PR. Keep the description short: one summary line, then 3 to 5
   bullets. No "Checks:" line, no attribution line.
3. Confirm the same commit passes in GitHub Actions with `gh pr checks <n>`. If it fails,
   stop, read the failure and report it. Investigate any test the report marks as flaky.
4. Squash-merging is the user's step. After they merge, update `main` and delete the old
   branch (local, and remote only if it is still there).

Ask before anything destructive, such as a force push or deleting a remote branch.
