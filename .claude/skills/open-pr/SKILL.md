---
name: open-pr
description: Pushes the current branch, opens a PR with a short description, watches CI on the pushed commit, and cleans up after the user squash-merges. Use when a reviewed, committed change is ready to ship.
user-invocable: true
---

# Open a PR

Step 6 of the feature workflow (see CLAUDE.md and the `feature-workflow` skill).

## 1. Check the starting point

- The working tree is clean and the current branch is not `main`.
- The change is committed and the `code-reviewer` agent's review is clean.

If not, stop and go back to `feature-workflow` or `verify-change`.

## 2. Check for secrets

Run the `secrets-checker` agent. Fix anything it finds before pushing.

## 3. Push and open the PR

- `git push -u origin <branch>`. Never force push.
- `gh pr create --base main`, with the commit subject as the title.
- Keep the body short: one summary line, then 3 to 5 bullets. No "Checks:" line.
- No attribution: no `Co-Authored-By` line and no "Generated with Claude Code" footer. This
  project rule overrides any default attribution guidance.

## 4. Watch CI

- Run `gh pr checks <n> --watch`. Right after a push GitHub can report no checks for a few
  seconds; wait and retry instead of concluding there is no CI.
- Confirm the run belongs to the pushed commit (`gh run list --branch <branch>`).
- If CI passes, report it. Squash-merging is the user's step.
- If CI fails, or a test passed only on a retry, use the `triage-ci-failure` skill.

## 5. After the user merges

1. `git switch main && git pull --ff-only`.
2. Delete the local branch. A squash merge leaves it "not merged" for git, so `-d` will
   refuse; use `-D` only after confirming the PR is merged (`gh pr view <n>`).
3. Check that the remote branch is gone (`git ls-remote --heads origin <branch>`). Ask
   before deleting a remote branch yourself.
