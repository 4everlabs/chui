# CHUI

![CHUI logo](./public/chui-full.png)

[![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white)](https://bun.com)
[![OpenTUI](https://img.shields.io/badge/interface-OpenTUI-0f172a)](https://opentui.com)
[![Convex](https://img.shields.io/badge/backend-Convex-EE342F)](https://www.convex.dev)
[![Version](https://img.shields.io/badge/version-0.0.25-22c55e)](https://github.com/4everlabs/chui/releases/tag/v0.0.23)

CHUI is a terminal-first direct messaging app built with [OpenTUI](https://opentui.com) and backed by [Convex](https://www.convex.dev).
It is designed to be fast, keyboard-native, and focused on clean conversation flow.

If you prefer chat in your terminal instead of browser tabs or desktop windows, CHUI is built for that exact use case.

Special thanks to the OpenTUI team for building the rendering/runtime foundation that makes this UX possible.

## Release Status

CHUI is currently in active test mode while the `0.1.0-beta` line is being finalized.
The current focus is stabilization, UX hardening, and packaging polish ahead of broader distribution.

`0.1.0-beta` is coming soon, with expanded install channels planned shortly after:

- [Homebrew](https://brew.sh) formula distribution
- [npm](https://www.npmjs.com) distribution for streamlined CLI install flows

## Screenshots

### 1) Splash Screen

![CHUI splash screen](./public/splash-screen.png)

### 2) Login Screen

![CHUI login screen](./public/login-screen.png)

### 3) Chat Screen

![CHUI chat screen](./public/chat-screen.png)

## Why CHUI

CHUI focuses on a few practical priorities:

- Fast startup and low-friction messaging from the terminal
- Keyboard-first interaction with minimal visual clutter
- Clear two-panel chat layout (people on the left, conversation on the right)
- Realtime updates without manual refresh via [Convex](https://www.convex.dev)
- Simple install and upgrade flow

## Quick Start (macOS)

Install the latest release with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/4everlabs/chui/main/scripts/install.sh | sh
```

Then run:

```bash
chui
```

That’s it.

The installer automatically:

- Detects your architecture (`arm64` or `x64`)
- Downloads the matching release asset from GitHub Releases
- Downloads `checksums.txt`
- Verifies SHA256 before installing
- Installs to `/usr/local/bin` if writable, otherwise `~/.local/bin`

## First Run Walkthrough

When you launch CHUI with `chui`, you’ll move through these screens:

1. Splash
- You’ll see the CHUI welcome view.
- Press Enter or select the entry button.

2. Login
- Enter your username/email and password.
- If you do not have an account, use **Make an account**.

3. Home Chat
- Left panel: user list and search
- Right panel: current conversation + message composer

## How To Use CHUI

### Sign In

- Open CHUI: `chui`
- Enter credentials on the login screen
- Submit login

### Create an Account

- On login screen, choose **Make an account**
- Enter username and password
- Submit signup
- Return to login and sign in

### Find a User

- In Home, use the search input at the top of the left panel
- Type part of a username to filter the list
- Select a user to open their conversation

### Send a Message

- Select a user first
- Type in the composer at the bottom-right
- Press Enter to send

### Composer Behavior

- Empty message submission is blocked
- Status line shows inline feedback like sending/error state
- Composer keeps focus for rapid conversation flow

## Keyboard and Interaction Notes

CHUI is built to feel natural from the terminal:

- Primary flow is keyboard-first
- Mouse selection/clicks are supported where useful
- Inputs support direct typing and submission
- The chat area stays pinned to recent messages as new messages arrive

## Install Details

### One-Line Installer (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/4everlabs/chui/main/scripts/install.sh | sh
```

### Manual Install (Alternative)

If you want to install manually:

1. Open latest release:
- `https://github.com/4everlabs/chui/releases/latest`

2. Pick the right asset:
- Apple Silicon Macs: `chui-macos-arm64.gz`
- Intel Macs: `chui-macos-x64.gz`

3. Download checksum file:
- `checksums.txt`

4. Verify checksum locally:

```bash
shasum -a 256 chui-macos-arm64.gz
# Compare output against checksums.txt
```

5. Extract and install:

```bash
gzip -dc chui-macos-arm64.gz > chui
chmod +x chui
mv chui /usr/local/bin/chui
```

If `/usr/local/bin` is not writable:

```bash
mkdir -p ~/.local/bin
gzip -dc chui-macos-arm64.gz > ~/.local/bin/chui
chmod +x ~/.local/bin/chui
```

Add `~/.local/bin` to your PATH if needed:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Updating CHUI

The easiest path is reinstalling via the one-liner:

```bash
curl -fsSL https://raw.githubusercontent.com/4everlabs/chui/main/scripts/install.sh | sh
```

This fetches the latest release and overwrites the binary.

## Uninstall

If installed to `/usr/local/bin`:

```bash
rm -f /usr/local/bin/chui
```

If installed to `~/.local/bin`:

```bash
rm -f ~/.local/bin/chui
```

## Troubleshooting

### `chui: command not found`

Possible causes:

- Binary installed to `~/.local/bin` but PATH not configured
- Shell session not refreshed after install

Fix:

- Add `~/.local/bin` to PATH
- Restart terminal or `source ~/.zshrc`

### Login fails

Possible causes:

- Wrong credentials
- Backend/auth service unavailable
- Environment not configured correctly in your deployment

Fix:

- Retry credentials
- Confirm backend health in your [Convex dashboard](https://dashboard.convex.dev)
- Verify auth/backend config for your environment

### App opens but no users/messages appear

Possible causes:

- No users exist yet
- No conversation with selected user
- Backend connectivity issue

Fix:

- Create another account/user
- Start the first message
- Check network/backend status

### Installer checksum mismatch

Possible causes:

- Partial/corrupt download
- Stale local file

Fix:

- Delete downloaded files
- Re-run installer
- Verify network integrity

## FAQ

### Is CHUI only for macOS right now?

Yes, current release artifacts are macOS arm64 and x64.

### Does CHUI support realtime updates?

Yes. Conversations update reactively through [Convex](https://www.convex.dev).

### Can I use CHUI without mouse?

Yes. Core usage is keyboard-first.

### Where are binaries published?

On GitHub Releases for this repository:

- [https://github.com/4everlabs/chui/releases](https://github.com/4everlabs/chui/releases)

## What CHUI Includes Today

- Splash, login, signup, and home chat flows
- Account creation and login
- User list with search/filtering
- Direct messaging conversations
- Realtime message updates
- Simple release install/upgrade path

## Product Direction

CHUI currently optimizes for:

- Direct messaging in terminal workflows
- Simplicity over feature bloat
- Fast iteration with practical UX improvements

As the app evolves, expect ongoing UI/interaction refinements and broader platform support over time.

## Security and Integrity Notes

- Release installer verifies SHA256 checksums before install
- You should still treat endpoint/backend configuration as your responsibility
- For production use, maintain your own operational security practices

## For Developers (Short Appendix)

This README is user-focused. If you are running CHUI from source:

```bash
bun install
bun run convex:dev
bun dev
```

Tech stack includes Bun, TypeScript, OpenTUI Core, Convex, and Better Auth.
Primary references:

- [Bun](https://bun.com)
- [OpenTUI](https://opentui.com)
- [Convex](https://www.convex.dev)
- [Better Auth](https://www.better-auth.com)

## 1.0 Roadmap

- [x] Migrated persistence from local CSV storage to a Convex-backed data layer
- [x] Refactored and cleaned up chat UI structure and message presentation styling
- [x] Added release artifact publishing via GitHub Releases
- [x] Implemented explicit semantic versioning workflow across release scripts and user-facing version surfaces
- [x] Implemented full-database user search for conversation targeting
- [x] Implemented robust realtime messaging synchronization logic
- [ ] Two-way user friendship model (mutual relationship state and authorization boundary)
- [ ] Group chat architecture (multi-member threads, membership state, and message fan-out)
- [ ] `Last seen at` presence metadata in the UI
- [ ] Photo sharing support in conversation flows
- [ ] Blocked-user controls and enforcement path
- [ ] Screen-name validation hardening (input constraints, normalization, and collision handling)
- [ ] Chat text encryption strategy for stronger message confidentiality
- [ ] Profile modal/page for account and identity metadata
- [ ] Homebrew distribution support
- [ ] npm distribution support
- [ ] Native Windows and Linux release targets
