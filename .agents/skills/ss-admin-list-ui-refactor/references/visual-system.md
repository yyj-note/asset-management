# Canonical visual system

The canonical stylesheet in assets/ss-admin-list.scss is the source of truth. Do not improvise replacement colors, shadows, radii, control heights, or responsive breakpoints.

## Reference images

Use the captured order-remark page as the visual comparator:

- assets/list-desktop.png: desktop list page.
- assets/list-mobile.png: mobile list page.
- assets/dialog-desktop.png: desktop create-dialog state.
- assets/dialog-mobile.png: mobile create-dialog state.

Treat the visible records and copy as reference content only. They do not authorize creating business data or changing the target page's fields and behavior.

## Page anatomy

Use this order whenever the corresponding business regions already exist:

1. Deep-blue business hero.
2. White filter panel.
3. White list panel with table and pagination.
4. Existing dialogs rendered with the board visual language.

Do not invent filters, actions, statistics, dialogs, or workflows merely to fill the layout.

## Core dimensions

| Region | Canonical rule |
| --- | --- |
| Desktop page padding | 20px |
| Tablet page padding | 16px |
| Mobile page padding | 10px |
| Hero minimum height | 116px |
| Panel gap | 16px |
| Panel padding | 18px |
| Panel radius | 16px |
| Filter control height | 40px |
| Filter button height | 40px |
| Page action height | 36px |
| Row action height | 30px |
| Table header height | 48px |
| Table row height | 52px |
| Dialog form columns | 2 desktop, 1 below 680px |
| Dialog choice panel minimum height | 40px |
| Dialog input and unit addon height | 40px |

## Palette and depth

- Page text: #294763.
- Page background: #f3f7fb to #edf3f9 with a restrained blue radial highlight.
- Hero: #15385f to #245f9f to #3986df.
- Hero eyebrow: #73dcf5.
- Panel border: #dbe7f2.
- Panel title: #294b69.
- Secondary text: #91a2b3.
- Primary action: #2868b8 to #428ceb.
- Success: green semantic treatment.
- Warning: amber semantic treatment.
- Danger: red semantic treatment.
- Shadows use low-opacity blue-gray rgba values; do not use neutral black drop shadows.

## Hero

- Keep the hero visually identical across pages: grid texture, gradient, circular decoration, left-aligned eyebrow/title/description, and a translucent scope panel.
- Generate neutral static copy when the page has no existing copy. Static copy must never drive a condition, permission, request, or state transition.
- Hide the scope panel below 1024px.
- At 767px, reduce padding, title size, radius, and supporting-copy size.

## Filters

- Use top-positioned labels and a 4-column grid.
- Change to 3 columns at 1600px, 2 at 1280px, and 1 at 767px.
- Keep existing field order and visibility rules.
- Keep action order unchanged.
- Search and reset use the fixed filter button styles.

## Table and status

- Center all headers and cells horizontally and vertically.
- Keep the table in a horizontal viewport and preserve fixed-column behavior.
- Default long text to a single-line ellipsis and use the page's existing tooltip capability.
- Use 48px headers, 52px rows, light striping, and a pale-blue hover.
- Status pills use primary, success, warning, or danger semantics only.
- Row actions stay centered, icon-plus-label, 30px high, and no-wrap.

## Pagination

- Prefer SsPagination with variant board when available.
- Preserve current page-size choices, event names, two-way binding behavior, and request timing.
- On mobile, keep pagination internally scrollable instead of widening the page.

## Dialogs

- Prefer SsDialog with variant board when the existing component supports it.
- Preserve the existing component, props, events, footer behavior, validation, and field conditions.
- Use a mode banner, white content card, section heading, two-column grid, and full-width modifiers for textareas, date ranges, and other naturally wide fields.
- Render tab-like section switches as one contiguous segmented control, not separated buttons.
- Render radio and checkbox groups in field-like choice panels when the reference shows grouped choices.
- Use the canonical primary color for checked radio, checkbox, and switch states.
- Keep unit addons exactly aligned to their 40px controls; use a flex wrapper rather than global baseline offsets.
- For dense or conditional dialog forms, read [dialog-form-patterns.md](dialog-form-patterns.md).
- Do not replace a dialog component if doing so changes interaction behavior. Skin the existing shell instead.

## Button contract

| Context | Height | Minimum width | Radius |
| --- | ---: | ---: | ---: |
| Filter | 40px | 96px | 10px |
| Page action | 36px | 108px | 9px |
| Row action | 30px | 66px | 10px |

Use the canonical primary, secondary, success, warning, and danger modifiers. Apply the same hover, focus, disabled, and loading behavior for every button in the same context.

## Visual review matrix

- Every affected page: 1440px and 390px.
- Current target page: also 1280px and every accessible dialog.
- One representative page: all button hover, focus, disabled, and loading states that can be reached without changing business data.
- If browser access is unavailable, mark all unrun scenarios 未视觉验收.
