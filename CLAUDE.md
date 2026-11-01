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
- Use fixtures when they provide meaningful setup, reuse, or isolation.
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
4. Report which checks passed and which failed.

## Collaboration

- Explain significant architectural decisions before implementing them.
- Prefer small, reviewable changes.
- Do not rewrite unrelated files.
- Do not add dependencies without explaining why they are needed.
- Ask before introducing a major architectural change.