# CHUI 1.0 Implementation Plan

This document translates the roadmap into an executable technical plan using:

- `@opentui/core` (Renderables-only UI architecture)
- Bun (runtime, build, release, testing automation)
- Convex + Better Auth (data, realtime, authz, consistency)

## 1) Architecture Baseline (Before New Features)

## 1.1 Core Decisions

- Keep UI implementation in `@opentui/core` Renderables (no constructs/JSX in this repo).
- Keep all data access behind `src/data/*` wrappers.
- Keep Convex as the system of record for:
- Users/profiles
- Relationship graph (friendships, blocks)
- Conversations/messages/group memberships
- Presence and metadata
- Keep release artifacts reproducible via Bun build scripts.

## 1.2 Module Ownership

- `src/ui/primitives/*`: reusable controls (rows, pills, modal shell, media placeholders).
- `src/ui/screens/*`: route-level composition only.
- `src/data/*`: typed client wrappers for queries/mutations/actions.
- `convex/*`: schema + server logic + authz rules.
- `scripts/*`: build/release/version and packaging automation.

## 1.3 Delivery Sequence

Recommended order to minimize risk and migration complexity:

1. Screen-name validation hardening
2. Two-way friendships + blocked users
3. Profile modal/page
4. Last-seen presence UI
5. Group chats
6. Photo sharing
7. Chat text encryption
8. Packaging/distribution targets (Homebrew, npm, Windows/Linux)

## 2) Two-Way User Friendships

## 2.1 Convex Data Model

Add `friendships` table:

- `requesterId`
- `addresseeId`
- `status: "pending" | "accepted" | "declined"`
- `createdAt`
- `updatedAt`

Indexes:

- by requester
- by addressee
- by user pair (normalized pair key to avoid duplicate direction rows)

Authz rules:

- only participants can read/write their own relationship rows
- accepted friendships required for DM creation (or configurable)

## 2.2 Convex Functions

- `sendFriendRequest(targetUsername)`
- `respondToFriendRequest(requestId, action)`
- `listFriendRequests()`
- `listFriends()`
- `canMessageUser(username)` (or merged into profile query payload)

## 2.3 OpenTUI Changes

- Left panel: add friendship status markers (`friend`, `pending`, `blocked`).
- Add actions in user row context:
- `Add friend`
- `Accept`
- `Decline`
- `Remove friend`

Primitives:

- `relationship_badge.ts`
- `confirm_action_dialog.ts`

## 2.4 Bun/Test Plan

- Add unit tests for pair-key normalization and transition rules.
- Add integration tests for mutation auth boundaries.

## 3) Group Chats

## 3.1 Convex Data Model

Add tables:

- `groups`:
- `name`
- `createdBy`
- `createdAt`
- `updatedAt`
- `groupMembers`:
- `groupId`
- `userId`
- `role: "owner" | "admin" | "member"`
- `joinedAt`
- `groupMessages`:
- `groupId`
- `senderId`
- `body`
- `createdAt`

Indexes:

- group by updatedAt
- membership by user
- messages by group + createdAt

## 3.2 Convex Functions

- `createGroup(name, memberUsernames[])`
- `listMyGroups()`
- `listGroupMessages(groupId, limit, cursor?)`
- `sendGroupMessage(groupId, body)`
- `addGroupMembers(groupId, usernames[])`
- `removeGroupMember(groupId, userId)`

## 3.3 OpenTUI Changes

- Sidebar split:
- Direct Messages
- Groups
- Add `new-group` flow (modal with member picker + validation)
- Message list renderer adapts by conversation type (`dm` vs `group`)
- Group header metadata goes in lightweight status line, not heavy top chrome

Primitives:

- `conversation_list_section.ts`
- `member_picker.ts`
- `group_info_modal.ts`

## 3.4 Bun/Test Plan

- Cursor-based pagination tests for group message list.
- Regression tests for list virtualization behavior at high message counts.

## 4) Last Seen At UI

## 4.1 Convex Data Model

Add to `profiles` or dedicated `presence` table:

- `lastSeenAt`
- `presenceState: "online" | "idle" | "offline"` (optional phase 2)

Update strategy:

- Heartbeat mutation while app active (throttled, e.g. every 30-60s).
- On session restore/login, immediately update `lastSeenAt`.

## 4.2 Convex Functions

- `heartbeatPresence()`
- `getPresenceForUsers(userIds[])`

## 4.3 OpenTUI Changes

- User list row secondary line: `last seen 2m ago`.
- Optional in-chat metadata line for selected user/group members.

## 4.4 Bun/Test Plan

- Time-window formatting unit tests.
- Validate throttling to avoid excessive write pressure.

## 5) Photo Sharing

## 5.1 Convex Data Model

Message model extension:

- `type: "text" | "image"`
- `textBody?`
- `imageStorageId?`
- `imageMimeType?`
- `imageWidth?`
- `imageHeight?`

Use Convex file storage metadata tables for file references.

## 5.2 Convex Functions

- `createImageUploadUrl()`
- `sendImageMessage(conversationId/groupId, imageMetadata)`
- `listMessages` returns typed union payloads

Server-side constraints:

- MIME allowlist
- size limit
- ownership checks

## 5.3 OpenTUI Changes

- Composer action to attach image path.
- Show image message as:
- file chip + dimensions + open/download hint
- optional low-res terminal preview later (phase 2)

Primitives:

- `attachment_chip.ts`
- `image_message_row.ts`

## 5.4 Bun/Test Plan

- CLI path validation tests.
- Upload flow integration tests (URL generation + send mutation).

## 6) Blocked Users

## 6.1 Convex Data Model

Add `blockedUsers` table:

- `blockerId`
- `blockedId`
- `createdAt`

Indexes:

- by blocker
- by blocked
- normalized pair for quick lookup

## 6.2 Convex Function/Policy Updates

- `blockUser(username)`
- `unblockUser(username)`
- `listBlockedUsers()`

Enforcement:

- prevent sending in either direction when block exists
- filter blocked users from message candidate lists
- hide blocked conversation updates from subscriptions when appropriate

## 6.3 OpenTUI Changes

- Add `Block/Unblock` in profile modal and user row actions.
- Show blocked state badge and disabled composer with explicit reason.

## 7) Screen Name Validation Hardening

## 7.1 Validation Policy

Define canonical policy once (shared by UI + server):

- length boundaries
- allowed charset
- normalization (trim/lowercase strategy for uniqueness key)
- reserved keywords list
- profanity/business-rule denylist (optional)

## 7.2 Convex Enforcement

- Validate in signup and profile update mutations.
- Store both:
- display name
- normalized unique key

## 7.3 OpenTUI UX

- Inline validation feedback in signup/profile form.
- Prevent submit when invalid; display deterministic error text.

## 8) Chat Text Encryption

## 8.1 Scope Decision

Two viable models:

- Transport + at-rest backend controls only (faster to ship)
- End-to-end encryption (E2EE) for message payloads (higher complexity)

Recommended:

- 1.0 baseline: server-side encryption controls + key hygiene + strict authz
- Post-1.0: E2EE extension

## 8.2 E2EE-Compatible Design (Future-Proofing Now)

- Message payload fields can hold ciphertext + nonce + version.
- Per-conversation key envelope support.
- Key rotation metadata table.

## 8.3 OpenTUI Changes

- Encryption capability indicator in chat metadata.
- Clear failure states for decrypt/unsupported payload versions.

## 9) Profile Modal/Page

## 9.1 Convex Data Model

Extend `profiles`:

- `displayName`
- `username`
- `bio?`
- `avatarFileId?` (optional future)

## 9.2 OpenTUI Changes

- Add profile modal route from home.
- Include:
- identity fields
- friendship state
- block/unblock controls
- shared-group/relationship context

Primitives:

- `modal_shell.ts`
- `profile_card.ts`
- `key_value_row.ts`

## 9.3 Data Flow

- Query current and selected profile details.
- Mutations for profile update with optimistic local status messaging.

## 10) Homebrew Distribution

## 10.1 Release Pipeline

Extend `scripts/release.ts` to optionally:

- publish tarball/checksum metadata suitable for Homebrew formula updates
- emit deterministic artifact naming

## 10.2 Formula Strategy

- Maintain tap repository (recommended) or upstream formula PR.
- Automate formula bump from release tag in CI/manual release follow-up.

## 10.3 Validation

- Test install/uninstall/upgrade on clean macOS environment.

## 11) npm Distribution

## 11.1 Package Strategy

Publish `chui` npm package as installer wrapper:

- postinstall script fetches platform binary
- verifies checksum
- places executable in npm bin path

Alternative:

- publish JS runner package + on-demand binary fetch command.

## 11.2 Compatibility

- Handle macOS arm64/x64 first.
- Expand to Linux/Windows once binaries exist.

## 11.3 Bun Integration

- Keep local release authority in Bun scripts.
- Add npm publish step gated by signed tag/release checks.

## 12) Native Windows and Linux Support

## 12.1 Build Matrix

Extend build targets in release script:

- Linux x64/arm64
- Windows x64/arm64 (as viable for OpenTUI native deps)

## 12.2 Packaging

- Linux: gzip/tar assets + checksums
- Windows: `.exe` artifacts + checksums

## 12.3 Runtime Validation

- Terminal capability matrix test (macOS Terminal/iTerm2, Windows Terminal, common Linux terminals).
- Snapshot key rendering behaviors (input, scroll, colors, focus).

## 13) Cross-Cutting Convex Work

Apply these to every feature:

- Strict argument validation for every function.
- Row-level auth checks before reads/writes.
- Narrow query surfaces with explicit indexes.
- Cursor-based pagination for message-heavy paths.
- Idempotent mutation patterns where retries are possible.
- Migration scripts for schema evolution and data backfill.

## 14) Cross-Cutting OpenTUI Work

- Keep Renderables-only policy check (`scripts/verify-renderables-only.ts`).
- Reuse primitives to avoid screen-level duplication.
- Keep status/error messages local to interaction area.
- Preserve deterministic layout under terminal resize events.

## 15) Cross-Cutting Bun/Tooling Work

- Keep `bun run check` as release gate.
- Add focused test scripts per feature area (`bun test tests/<feature>.*`).
- Add pre-release validation checklist command (`bun run release:verify`).
- Keep release script deterministic, idempotent where possible, and checksum-first.

## 16) Milestone Plan

## Milestone A (0.1.x Stabilization)

- Validation hardening
- Friendship + block primitives
- Profile modal baseline
- Presence (`lastSeenAt`)

## Milestone B (0.2.x Messaging Expansion)

- Group chats
- Photo sharing (file references + metadata rendering)
- Additional reliability tests for message throughput

## Milestone C (0.3.x Security + Packaging)

- Encryption baseline improvements
- Homebrew + npm distribution
- Expanded release automation

## Milestone D (1.0 Readiness)

- Windows/Linux binaries
- Cross-platform runtime validation
- Documentation freeze + migration notes + operational runbook

## 17) Definition of Done (Per Feature)

Every roadmap item is complete only when all are true:

- Convex schema + auth rules implemented and tested
- Data wrapper methods added in `src/data/*`
- OpenTUI screens/primitives integrated and keyboard-safe
- Error states and empty states explicitly handled
- `bun run check` green
- Release notes/docs updated

