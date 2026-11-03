---
name: known-bugs
description: Runs the @known-bug marker tests against the live demo site and reports which bugs still reproduce and which were fixed. Use to check whether known site bugs are still there, or when adding a new marker for a site bug.
user-invocable: true
---

# Known bugs

`@known-bug` tests assert the correct behavior the demo site does not have yet, so they fail
by design. `npm test` and CI exclude them. Running them is how we confirm the bugs still
reproduce.

## Run

```bash
npm run test:known-bugs
```

This sets `RUN_KNOWN_BUGS=1` and runs only the `@known-bug` tests. It never runs
`@creates-data` tests. Do not add retries or `--repeat-each`.

## Read the results

Take the test title and the `known-bug` annotation description from the report. Quote only
those and the offender summary from the assertion, not raw log output.

- **Fails on the expected assertion.** The bug still reproduces. This is expected: say so
  plainly and cite the annotation description.
- **Passes.** The site was fixed. Flag it. The marker should become a normal test, so
  propose removing `tag: '@known-bug'` and the annotation, and make that change through the
  `feature-workflow` skill.
- **Fails for another reason.** A timeout, a missing heading, a changed page. This is not
  "bug still reproduces"; the marker is broken or the site changed. Report it as a broken
  marker and use the `triage-ci-failure` skill.

## Add a marker for a new site bug

Plan it through `feature-workflow` like any test change.

- Assert the CORRECT behavior, so the test fails today. Do not use `test.fail()`.
- Tag it with the test details option, and describe the defect in the annotation:

  ```ts
  test('title of the correct behavior', {
    tag: '@known-bug',
    annotation: { type: 'known-bug', description: 'what is wrong, and where' },
  }, async ({ page }) => { ... });
  ```

- Assert the cause in the DOM, not a screenshot, and accept any valid fix.
- Keep it read-only and independent, like any other test. Follow CLAUDE.md.
- Confirm it is excluded from `npm test -- --list` and fails for the right reason
  under `npm run test:known-bugs`.
