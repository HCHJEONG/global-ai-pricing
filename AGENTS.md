# GLOBAL AI PRICING Agent Instructions

Before making UI changes in this repository, read and follow `DESIGN.md`.

## Frontend Rules

- Preserve dark mode, mobile responsiveness, and five-language support: Arabic, English, Japanese, Chinese, and Korean.
- Prefer locale-aware routes such as `ko/`, `en/`, `ar/`, `ja/`, and `zh/` while keeping shared UI text in i18n translation keys instead of duplicating whole pages per language. Use country or market codes such as `jp` and `cn` only for market-specific data, not language routes.
- Prefer existing project patterns over one-off style patches.
- If a UI change needs repeated styles, create or reuse a small local wrapper instead of copying long style objects.
- Use `RadioGroup` for mutually exclusive choices and `Checkbox` only for independent boolean choices.

## Work Style

- Keep edits scoped to the requested feature or bug.
- Do not refactor unrelated UI while fixing a specific screen.
- Build and deployment are handled manually by the maintainer. Do not run production builds or deploy commands unless the user explicitly requests them.
- When changing frontend behavior, verify light mode, dark mode, narrow desktop, and mobile-relevant layout assumptions when feasible.

## AWS / SSH Operations

- Use the existing Bastion path for AWS private instance inspection: `ssh aws-bastion`.
- From the Bastion, use the SSH aliases `aws-prod` and `aws-demo` when the user asks to inspect private AWS EC2 instances.
- Do not create or modify SSH keys.
- Prefer read-only inspection commands first, such as `hostname`, `uptime`, `free -m`, `df -h /`, `docker ps`, and `docker system df`.
- Do not stop, remove, prune, restart, or deploy containers on AWS unless the user explicitly requests that operation.
- Do not copy secrets, private keys, full environment files, or credential contents into repository documents or final responses.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
