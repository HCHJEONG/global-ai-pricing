# GLOBAL AI PRICING Design Guidelines

## UI / UX Design Style

Use a Neo Brutal Data Utility style: a Tailwind-based dashboard aesthetic with clear borders, compact panels, strong information hierarchy, and restrained brutalist accents.

The interface should feel direct, structured, and trustworthy. Use neo-brutalist elements to clarify sections, controls, and comparison results, not as decoration.

Avoid overly playful colors, excessive offset shadows, oversized typography, and heavy decorative blocks that reduce pricing readability.

## Core Stack

- Use Tailwind CSS for styling.
- Use shadcn/ui as the primary component pattern.
- Use lucide-react for icons when an icon exists for the action.
- Prefer accessible Radix-based primitives through shadcn/ui before introducing custom interactive components.

## Visual Language

- Use strong, visible borders to define panels, tables, filters, and important controls.
- Keep border thickness mostly at `1px` or `2px`; reserve heavier borders for major layout boundaries or active states.
- Use small corner radii, preferably `rounded-md` or less. Avoid pill-shaped controls unless they are segmented controls, badges, or compact filters.
- Use offset shadows sparingly. They should emphasize primary panels, selected states, or important calls to action rather than appear on every surface.
- Keep the base palette neutral and readable. Use accent colors for active filters, status, comparison deltas, and primary actions.
- Avoid gradient-heavy backgrounds, decorative blobs, glassmorphism, and soft bokeh effects.

## Color Direction

- Support both light mode and dark mode.
- Light backgrounds should feel clean and slightly paper-like rather than glossy.
- Dark mode should use strong contrast without becoming a one-note dark-blue or slate interface.
- Use one main brand accent and a small status palette.
- Suggested primary accent: teal or blue-teal for trust, precision, and data utility.
- Use color meaning consistently: success for cheaper/better values, warning for caveats, danger for errors or unavailable data.

## Layout

- Build the first screen as a usable dashboard or comparison tool, not a marketing landing page.
- Prioritize pricing tables, filters, sorting controls, comparison panels, update metadata, and compact summaries.
- Use a clear app shell with predictable navigation, language controls, currency controls, and model/provider filters.
- Prefer dense but readable layouts over oversized hero sections.
- Do not put UI cards inside other cards.
- Use cards only for repeated items, compact summaries, modal content, or genuinely framed tool surfaces.
- Keep page sections full-width or unframed unless a boundary improves scanability.

## Data Display

- Tables should be first-class UI, with clear headers, numeric alignment, sortable columns where useful, and responsive alternatives on mobile.
- Price, currency, region, provider, model, and plan names should be easy to compare at a glance.
- Use compact badges for status, region, model family, billing unit, and availability.
- Show update date, source assumptions, exchange-rate basis, and calculation caveats near the relevant data.
- Use charts only when they clarify trends or comparison, not as decoration.

## Components

- Use icon buttons for common actions such as refresh, copy, download, search, filter, sort, expand, collapse, and settings.
- Use text buttons for commands whose meaning is not obvious from an icon.
- Use segmented controls for compact mode or time-range choices.
- Use tabs for major view changes.
- Use `RadioGroup` for mutually exclusive choices.
- Use `Checkbox` for independent boolean choices.
- Use switches only for immediate on/off settings.
- Use dialogs or sheets for focused secondary workflows such as filters, settings, and row details.
- Inputs, selects, and filters should have stable dimensions so translated labels and dynamic values do not shift the layout.

## Internationalization

- Support Arabic, English, Japanese, Chinese, and Korean.
- Use Korean as the default language and primary copywriting source.
- Prefer locale-aware routes such as `ko/`, `en/`, `ar/`, `ja/`, and `zh/`.
- Keep shared UI text in i18n translation keys instead of duplicating whole pages per language.
- Account for Arabic RTL in navigation, alignment, directional icons, spacing, and table behavior.
- Test long translated strings in compact controls, table headers, badges, and mobile cards.

## Typography

- Use readable sans-serif typography optimized for UI and data.
- Prefer tabular numeric styling where available for prices, percentages, token counts, and exchange rates.
- Keep headings compact inside dashboard panels.
- Do not use viewport-scaled font sizes.
- Do not use negative letter spacing.

## Responsive Behavior

- Desktop should emphasize tables, comparison grids, and side-by-side filters.
- Narrow desktop should preserve table readability and avoid horizontal crowding.
- Mobile should use stacked filters, drawers or sheets, and comparison cards when tables become too dense.
- Text must not overflow buttons, badges, cards, table cells, or navigation items.

## Validation Checklist

Before considering UI work complete, check:

- light mode
- dark mode
- desktop layout
- narrow desktop layout
- mobile layout
- long translated strings
- Arabic RTL assumptions
- table and card readability with real pricing-like data
