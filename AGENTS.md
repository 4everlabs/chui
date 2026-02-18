# CHUI Release + Build Commands

This project uses a simple local workflow:

- Use GitHub Desktop for normal commits and pushes.
- Run one CLI command when you want a release.
- No automatic release is triggered by commit or push.

## Command List

These are the only day-to-day commands you need.

### `bun run check`

Purpose:
- Run a fast local validation pass before commit or before release.

What it does:
1. Runs `bun run lint`
2. Runs `bun run build`

When to run:
- Before commits (optional but recommended)
- Always runs automatically inside `bun run release`

Expected output:
- Lint must pass with no blocking errors.
- Bundle build must succeed and output files to `dist/bundle`.

---

### `bun run build`

Purpose:
- Build a bundled app output to catch build-time errors.

What it does:
- Executes Bun bundling from `src/index.ts` into `dist/bundle` with minification and sourcemaps.

When to run:
- If you changed app code and want a quick build sanity check.
- Automatically via `bun run check`.

Important note:
- This is not the final release binary step. It is the fast dev build check.

---

### `bun run bump`

Purpose:
- Bump patch version for a release.

What it does:
1. Increments patch version in `package.json` (for example `0.0.12 -> 0.0.13`)
2. Updates version badge in `README.md` if present
3. Updates app version constant in `src/app/version.ts`

When to run:
- Only when preparing a release.
- This step is handled automatically by `bun run release`.

---

### `bun run release`

Purpose:
- Do the complete release flow in one command (macOS binaries only).

What it does, in order:
1. Verifies git working tree is clean
2. Verifies GitHub CLI auth (`gh auth status`)
3. Runs `bun run bump`
4. Runs `bun run check`
5. Builds release binaries:
   - `dist/release/chui-macos-arm64`
   - `dist/release/chui-macos-x64`
6. Commits versioned files:
   - `package.json`
   - `README.md`
   - `src/app/version.ts`
7. Creates a git tag: `v<version>`
8. Pushes commit and tag
9. Creates a GitHub Release and uploads the two macOS binaries

Release result:
- A new GitHub release with two attached assets (arm64 + x64 macOS binaries).

## Daily Workflow

### Normal development (no release)

Use GitHub Desktop as usual:
1. Edit code
2. (Optional) run `bun run check`
3. Commit in GitHub Desktop
4. Push in GitHub Desktop

No release is created by these steps.

### Publish a release

1. Make sure your current branch is the one you want to release from.
2. Ensure all intended changes are already committed.
3. Run:
   - `bun run release`
4. Wait for completion message.
5. Confirm release assets on GitHub Releases page.

## One-Time Setup Requirements

Before using `bun run release`:

1. Install Bun dependencies:
   - `bun install`
2. Install and authenticate GitHub CLI:
   - `gh auth login`
3. Ensure your git remote `origin` points to the correct GitHub repo.

## Failure Recovery

If `bun run release` fails:

- If it fails before commit/tag:
  - Fix the error and rerun `bun run release`.
- If commit is created but tag/release upload fails:
  - Fix auth/network issue and rerun the remaining git/gh commands manually.
- If release already exists for tag:
  - Use `gh release upload <tag> <asset paths> --clobber` to replace assets.

## Why This Flow Is Simple

- Commit/push stays separate from release.
- One command handles version bump + binary build + release upload.
- Only two release artifacts are produced (macOS arm64 and x64).
- No noisy CI automation is required for releases.
# Repository Guidelines

## Project Structure & Module Organization

- `src/index.ts` is the current CLI/TUI entry point (used by `bun dev`).
- `src/app/` holds app state, routing, actions, and scheduling logic.
- `src/ui/` contains layouts, components, and screen views.
- `src/data/` contains session/subscription helpers and external data integrations.

## Build, Test, and Development Commands

- `bun install` installs dependencies from `package.json`.
- `bun dev` runs the TUI in watch mode via `bun run --watch src/index.ts`.
- No build or test scripts are defined yet. Add them to `package.json` when introducing a build step or a test runner.

## Coding Style & Naming Conventions

- TypeScript with ESM (`"type": "module"`) and strict type-checking per `tsconfig.json`.
- Follow the existing formatting: 2-space indentation and trailing commas in multi-line objects/arrays.
- Naming:
  - Functions/variables: `camelCase`.
  - Components: `PascalCase`.
  - File names in `src/ui/` and `src/data/`: `snake_case.ts` (e.g., `message_list.ts`).
- Keep exports explicit and local, and align new modules with the current folder boundaries.

## Testing Guidelines

- No test framework is configured in this repository.
- If you add tests, create a `tests/` folder and add a script such as `bun test` (or your chosen runner) to `package.json`, then document it here.

## Commit & Pull Request Guidelines

- This checkout has no Git history available, so no established commit convention can be inferred.
- Use Conventional Commits unless maintainers specify otherwise (e.g., `feat: add inbox screen`).
- PRs should include:
  - A short summary and the reasoning behind the change.
  - Steps to verify (commands or manual test steps).
  - Screenshots or terminal recordings for UI-affecting changes.

## Configuration Notes

- The app depends on `@opentui/core`; run it in a terminal that supports the required TUI capabilities.
- If you introduce environment variables or external services, document them in `README.md` and add sample config files if needed.

## Skills Usage

- Skills live under `.agents/skills/` and each skill has a `SKILL.md` with its workflow and references.
- Use a skill when the user explicitly names it or the task clearly matches the skill description.
- Open the skill’s `SKILL.md` first and follow its instructions; load only the minimal referenced files needed.
- If multiple skills apply, use the smallest set that covers the task and state the order being used.
- Do not assume a skill across turns unless the user re-mentions it.
- If a skill file is missing or unreadable, note it briefly and proceed with the best fallback approach.
