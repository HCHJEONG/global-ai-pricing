# GLOBAL AI PRICING Agent Instructions

Before making UI changes in this repository, read and follow `DESIGN.md`.

## Frontend Rules

- Preserve dark mode, mobile responsiveness, and five-language support: Arabic, English, Japanese, Chinese, and Korean.
- Prefer locale-aware routes such as `ko/`, `en/`, `ar/`, `jp/`, and `cn/` while keeping shared UI text in i18n translation keys instead of duplicating whole pages per language.
- Prefer existing project patterns over one-off style patches.
- If a UI change needs repeated styles, create or reuse a small local wrapper instead of copying long style objects.
- Use `RadioGroup` for mutually exclusive choices and `Checkbox` only for independent boolean choices.

## Work Style

- Keep edits scoped to the requested feature or bug.
- Do not refactor unrelated UI while fixing a specific screen.
- Build and deployment are handled manually by the maintainer. Do not run production builds or deploy commands unless the user explicitly requests them.
- When changing frontend behavior, verify light mode, dark mode, narrow desktop, and mobile-relevant layout assumptions when feasible.
