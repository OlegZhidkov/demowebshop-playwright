# Demo Web Shop Automation

## Project purpose

Build a maintainable UI and API test automation project for:
https://demowebshop.tricentis.com/

Use TypeScript and Playwright Test.

## Architecture principles

- Use Playwright Test for both UI and API testing.
- Keep tests readable and focused on business behavior.
- Use TypeScript strict mode.
- Use Playwright's built-in assertions and auto-waiting.
- Prefer role-based, label-based, and other user-facing locators.
- Avoid arbitrary timeouts and brittle CSS or XPath selectors.
- If no user-facing locator works, use a stable attribute (id, name, data-*) as a last resort.
- Avoid `first()` and `nth()` unless the selection is intentional.
- Do not use `force` clicks to bypass genuine UI problems.
- Avoid `networkidle` waits; wait for a specific application condition.
- Use fixtures when they provide meaningful setup, reuse, or isolation.
- To start a test logged in, use the `authenticatedPage` fixture from `tests/fixtures.ts`. Never type the test user's password into a form or send it with Playwright's `request`: traces record it. Use the login form only when the login itself is under test.
- Introduce Page Object Models only where they improve maintainability.
- Keep test data and reusable helpers separate from test assertions when appropriate.
- Do not introduce unnecessary abstractions or dependencies.

## Test design

- Each test should be independently understandable and repeatable.
- Avoid dependencies between tests.
- Do not assume tests execute in a particular order.
- Prefer deterministic assertions over arbitrary sleeps.
- Verify meaningful application behavior rather than implementation details.
- Do not use real payment information or perform real purchases.
- Investigate the application's current behavior before designing tests.
- Structure tests as Arrange-Act-Assert, with names that describe the expected behavior.
- Assert meaningful business outcomes, not just that an element is visible.
- Use soft assertions only for independent checks.
- Keep tests safe to run in parallel: no shared mutable state, such as a shared cart or account.
- CI retries are a safety net. Investigate any test the report marks as flaky (passed only on retry).

## Configuration

- Define the application base URL centrally in playwright.config.ts.
- Do not duplicate the base URL throughout the tests.
- Keep environment-specific configuration out of test logic.
- Never commit passwords, tokens, or other secrets.

## Quality checks

Before considering a change complete:

1. Run the relevant Playwright tests.
2. Run the TypeScript compiler without emitting files.
3. Review the diff for unnecessary complexity.
4. Update README.md (layout, diagrams) and CLAUDE.md if the change makes them stale.
5. Report which checks passed and which failed.

## Feature workflow

For every feature or test change, in this order:

1. **Plan:** inspect the existing code and the live app (use the `test-planner` agent). Propose the change and wait for approval.
2. **Implement:** make one focused change on a short-lived branch, with no unrelated edits.
3. **Verify:** complete the Quality checks above.
4. **Review:** run the `code-reviewer` agent on the diff and fix its findings. Then repeat steps 3 and 4 until the review is clean.
5. **Commit:** commit on the branch once the review is clean. No AI attribution lines in commits or PR descriptions.
6. **Observe CI:** push, open a PR, and confirm the same commit passes in GitHub Actions (`gh pr checks <n>`). After a squash and merge, update `main` and delete the old branch.

## Collaboration

- Explain significant architectural decisions before implementing them.
- Prefer small, reviewable changes.
- Do not rewrite unrelated files.
- Do not add dependencies without explaining why they are needed.
- Ask before introducing a major architectural change.