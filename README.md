# Demo Web Shop Automation

UI and API test automation for https://demowebshop.tricentis.com/, built with
[Playwright Test](https://playwright.dev/) and TypeScript (strict mode).

## Setup

Requires Node.js (LTS).

```bash
npm ci
npx playwright install chromium
```

Install scripts of dependencies are blocked on purpose (`.npmrc` sets `ignore-scripts=true`),
so browsers are installed explicitly with the command above.

## Running

| Command | What it does |
|---|---|
| `npm test` | Run the Playwright tests (Chromium), except those tagged `@creates-data` |
| `npm run test:data` | Run only the `@creates-data` tests. They register real accounts on the shop |
| `npx playwright test tests/search.spec.ts` | Run a single spec |
| `npx playwright test --ui` | Run in UI mode |
| `npx playwright show-report` | Open the last HTML report |
| `npm run typecheck` | Type-check without emitting files |

The application base URL is set once, in `playwright.config.ts`.

## Test user

Tests that need a logged-in or existing account use one dedicated account on the shop,
created once by hand. Its credentials are never committed.

- **Locally:** copy `.env.example` to `.env` and fill in `TEST_USER_EMAIL` and
  `TEST_USER_PASSWORD`. `.env` is git-ignored.
- **CI:** add the same two names as repository secrets (Settings > Secrets and variables >
  Actions).

Tests that register a new account use their own unique fake email instead.

## Project layout

```
tests/                      Playwright specs
playwright.config.ts        Test configuration and base URL
tsconfig.json               TypeScript strict config
.github/workflows/          CI: typecheck, then tests
.claude/                    Claude Code settings and project agents
CLAUDE.md                   Project conventions
```

## Conventions

See [CLAUDE.md](CLAUDE.md). In short: tests are independent and focus on business
behavior, use role/label locators and Playwright's auto-waiting, and never use real
payment data or perform real purchases.

## Continuous integration

GitHub Actions runs `npm run typecheck` and `npm test`:

- on every pull request into `main`;
- every night at 00:00 UTC, on `main`;
- on demand for any pushed branch: `gh workflow run playwright.yml --ref <branch>`, or
  Actions > Run workflow in GitHub. Manual runs work once the workflow is on `main`.

A push to `main` does not start a run by itself. The pull request run covers the change and
the nightly run re-checks `main`.

## Workflow

Work happens on short-lived branches and lands through pull requests (squash and merge).
