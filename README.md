![CHUI screenshot](./chui.png)

# CHUI

![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)
![OpenTUI](https://img.shields.io/badge/interface-OpenTUI-0f172a)
![Convex](https://img.shields.io/badge/backend-Convex-EE342F)
![Better%20Auth](https://img.shields.io/badge/auth-Better%20Auth-2563eb)
![Status](https://img.shields.io/badge/status-active%20development-f59e0b)

A terminal chat app.

No browser. No mouse. Just messages.

## Install

> Placeholder package name: `chui-cli`

### npm

```bash
npm install -g chui-cli
```

### Homebrew

```bash
brew install chui-cli
```

## Run

```bash
chui
```

## What you do in CHUI

- Sign up or log in.
- Open a conversation.
- Send messages.

## Update

### npm

```bash
npm update -g chui-cli
```

### Homebrew

```bash
brew upgrade chui-cli
```

## Troubleshooting

- Use a terminal that supports modern TUI apps.
- If auth breaks, restart CHUI.
- If it feels laggy over SSH, your connection is the bottleneck.

## Run from source (contributors)

```bash
bun install
bun run convex:dev
bun dev
```

Dev env vars:

- `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL`
- `BETTER_AUTH_SECRET`
- `SITE_URL`
