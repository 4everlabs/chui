# CHUI

![CHUI screenshot](./public/chui-full.png)

![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)
![OpenTUI](https://img.shields.io/badge/interface-OpenTUI-0f172a)
![Convex](https://img.shields.io/badge/backend-Convex-EE342F)
![Better%20Auth](https://img.shields.io/badge/auth-Better%20Auth-2563eb)
![Status](https://img.shields.io/badge/status-active%20development-f59e0b)
![Version](https://img.shields.io/badge/version-0.0.10-22c55e)

CHUI is a user-facing chat interface built with OpenTUI.

This is not a published npm/Homebrew package right now. Run it from source.

`0.1.0` coming soon!

## Tech stack

- Runtime: Bun
- Language: TypeScript
- UI: OpenTUI (`@opentui/core`)
- Backend: Convex
- Auth: Better Auth (Convex integration)

## Current app scope

- Splash screen -> login/signup -> home chat view
- Account creation and sign in
- User list + direct conversations
- Send and read messages in the terminal UI

## Run from source

```bash
bun install
bun run convex:dev
bun dev
```

## Environment

Set the environment variables used by your Convex + Better Auth setup:

- `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL`
- `BETTER_AUTH_SECRET`
- `SITE_URL`

## Notes

- Use a terminal that supports modern TUI rendering for OpenTUI apps.
- CHUI is under active development, so behavior and flows can change.
