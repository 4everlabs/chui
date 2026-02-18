# CHUI

![CHUI screenshot](./public/chui-full.png)

![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)
![OpenTUI](https://img.shields.io/badge/interface-OpenTUI-0f172a)
![Convex](https://img.shields.io/badge/backend-Convex-EE342F)
![Better%20Auth](https://img.shields.io/badge/auth-Better%20Auth-2563eb)
![Status](https://img.shields.io/badge/status-active%20development-f59e0b)
![Version](https://img.shields.io/badge/version-0.0.17-22c55e)

CHUI is a terminal-first chat app that feels fast, focused, and keyboard-native.

You can install the latest macOS release directly with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/4everlabs/chui/main/scripts/install.sh | sh
```

After install, run:

```bash
chui
```

The installer auto-detects Apple Silicon (`arm64`) vs Intel (`x64`), downloads the matching binary from the latest GitHub release, verifies SHA256 checksums, and installs to `/usr/local/bin` (or `~/.local/bin` when needed).

## First launch (login screen)

After you run `chui`, you should land on the login page shown below:

![CHUI login example](./public/ui-screenshot.png)

Use your username/email + password to sign in, or select **Make an account** to create a new profile.

## Download and install

If you prefer manual installation:

1. Open the latest release: `https://github.com/4everlabs/chui/releases/latest`
2. Download the asset that matches your Mac:
   - `chui-macos-arm64.gz` (Apple Silicon)
   - `chui-macos-x64.gz` (Intel)
3. Download `checksums.txt`
4. Verify checksum:

```bash
shasum -a 256 chui-macos-arm64.gz
# compare with checksums.txt
```

1. Extract and install:

```bash
gzip -dc chui-macos-arm64.gz > chui
chmod +x chui
mv chui /usr/local/bin/chui
```

## Tech stack

- Runtime: Bun
- Language: TypeScript
- UI: OpenTUI (`@opentui/core`)
- Backend: Convex
- Auth: Better Auth (Convex integration)

## Realtime performance and privacy/compliance

- CHUI uses Convex query subscriptions for realtime updates, so conversation changes propagate automatically without polling.
- Convex handles reactive query reruns and client updates at the platform level, which keeps UI state in sync and reduces custom realtime plumbing.
- Privacy/compliance is a shared responsibility: Convex provides security/compliance artifacts (including SOC 2 documentation and DPA materials), but your app configuration, data retention, access control, and legal posture are still your responsibility.
- CHUI itself is not positioned as a turnkey compliance product out of the box; if you need regulated compliance coverage, treat it as an implementation project with your own controls and review.

## What CHUI includes right now

- Splash screen -> login/signup -> home chat view
- Account creation and sign in
- User list + direct conversations
- Send and read messages in the terminal UI

## UI architecture

CHUI is built on top of OpenTUI core primitives and composed with small reusable building blocks:

- Core renderables from `@opentui/core` (`BoxRenderable`, `TextRenderable`, `ScrollBoxRenderable`, inputs, layout events)
- Shared design tokens for spacing, colors, sizing, and status styles
- Reusable primitives for buttons, text input, message composer, and chat bubbles
- Screen factories that keep each route modular (`splash`, `login`, `signup`, `home`)

Huge thanks to **anomalyco** for creating OpenTUI and making this style of terminal UX possible.

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
