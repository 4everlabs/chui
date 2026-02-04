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
