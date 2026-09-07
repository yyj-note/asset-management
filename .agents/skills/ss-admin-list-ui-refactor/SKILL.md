---
name: ss-admin-list-ui-refactor
description: Refactor an explicitly selected Vue 2, Element UI 2, SCSS, and @ss/ss-ui-vm management list page to the canonical SS admin visual system while preserving its business behavior. Use only when the user explicitly invokes this skill for a list-page UI refactor; do not use for detail pages, dashboards, login pages, framework migrations, or business-feature changes.
---

# SS Admin List UI Refactor

Rebuild the presentation layer of an existing management list page so it stays visually consistent with the order-remark reference. Preserve the page's business and interaction contract.

## Hard boundaries

- This skill is explicit-only. Do not apply it unless the user invokes ss-admin-list-ui-refactor.
- Treat the existing API calls, stores, routing, permissions, validation, state transitions, events, props, emits, slots, refs, v-model bindings, and conditional rendering as protected behavior.
- Allow template wrappers, static presentation copy, icons, classes, scoped styles, shared SCSS, and strictly presentational component configuration such as variant, size, display class, or static description.
- Do not add, remove, reorder, or reinterpret business fields, actions, conditions, permissions, submission rules, or data transformations.
- Prefer visual consistency over page-specific invention. Long text defaults to ellipsis with the existing tooltip capability.
- Do not create or run unit tests, lint, or production builds for this workflow.

## Required workflow

1. Read references/refactor-workflow.md and references/class-naming.md before editing.
2. Inspect the target project's instructions, package.json, style entry, target page, child components, and current working-tree changes.
3. Pass the capability gate: Vue 2, Element UI 2, SCSS, and usable @ss/ss-ui-vm dialog and pagination capabilities. Stop if the stack cannot support the reference without a framework migration.
4. Snapshot the pre-edit behavior contract, including template directives and any existing uncommitted changes.
5. Read references/visual-system.md and only the component sections needed from references/component-contracts.md. If a dialog contains segmented tabs, radio or checkbox groups, switches, unit addons, or dense conditional forms, also read references/dialog-form-patterns.md before editing it.
6. Inspect the reference images in assets when image viewing is available.
7. Copy assets/ss-admin-list.scss to the target project's src/styles/ss-admin-list.scss, replacing any previous copy, and import it once from the actual global SCSS entry.
8. Apply the canonical structure and classes while preserving all protected behavior. Use page-scoped BEM only for business-specific presentation.
9. Search every renamed legacy class across the repository. If code outside templates or styles references it, retain that legacy class beside the new canonical class.
10. Perform the read-only behavior comparison described in references/refactor-workflow.md. Correct every unexplained behavioral difference before delivery.
11. Visually check every page affected by the shared stylesheet. For dialogs, exercise every segmented tab plus switch-off and switch-on states, and verify compound controls rather than reviewing only the default state. If browser or screenshot access is unavailable, finish the code but label the result 未视觉验收.

## Completion contract

Report:

- the target page and every page affected by the shared stylesheet;
- the shared and page-scoped files changed;
- whether the behavior comparison passed;
- which viewport and dialog scenarios were visually checked;
- any scenarios that remain 未视觉验收.

Do not claim visual completion when the browser matrix was not run.
