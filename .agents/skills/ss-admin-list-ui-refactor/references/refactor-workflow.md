# UI-only refactor workflow

## 1. Resolve the target

Accept a route, view directory, or Vue file. If several pages match, ask the user for the exact target before editing.

Read project and directory instructions first. Inspect package.json, the global style entry, the target page, its child components, and related shared components.

## 2. Pass the capability gate

Require:

- Vue 2;
- Element UI 2;
- a working SCSS compiler;
- @ss/ss-ui-vm capabilities used by the target, especially SsDialog and SsPagination board variants when those surfaces exist.

Check capabilities from installed code or actual component contracts, not only package names or patch versions.

Stop when matching the reference requires a framework migration or business-component replacement.

## 3. Snapshot before editing

Preserve the user's working tree. Do not reset, checkout, or discard existing changes.

Record:

- current git status;
- target files and their current contents;
- all v-model, v-if, v-else, v-show, v-for, event, prop, slot, ref, permission, debounce, loading, and validation directives;
- API imports and calls;
- component props, emits, computed values, watchers, and methods;
- current filters, field order, columns, action order, status values, pagination events, and dialog modes.

Use this snapshot for the post-edit read-only comparison instead of assuming HEAD represents the user's baseline.

## 4. Determine affected scope

Find the global SCSS entry. Find every existing ss-admin class consumer. Find all references to legacy classes that may be renamed.

Invocation of this skill authorizes replacing src/styles/ss-admin-list.scss with the canonical asset. It does not authorize deleting other style systems or rewriting unrelated pages.

## 5. Install the canonical visual layer

Copy assets/ss-admin-list.scss exactly to src/styles/ss-admin-list.scss. Replace an existing copy rather than merging local design deviations.

Import it once from the actual global SCSS entry. Do not add duplicate imports.

Use shared classes from references/class-naming.md. Keep business-only additions in the target component's scoped SCSS.

## 6. Restructure presentation

Use the relevant Vue structures in references/component-contracts.md.

Allowed:

- static wrapper elements;
- hero, panel, heading, and form-grid structure;
- static explanatory copy and icons;
- canonical and business BEM classes;
- CSS/SCSS;
- presentational configuration such as variant, size, description, or display class.

Protected:

- API and store behavior;
- routing and permissions;
- field definitions and order;
- v-model targets;
- conditions and visibility;
- validation and submission;
- event names, payloads, and timing;
- pagination semantics;
- dialog open, close, and footer behavior.

Do not move business logic into templates to avoid the protected boundary.

## 7. Preserve legacy class consumers

Follow references/class-naming.md. A class referenced by JavaScript, automation, telemetry, directives, or an external integration remains as a compatibility class.

## 8. Read-only behavior comparison

Compare the completed files with the pre-edit snapshot.

The following must remain identical unless the difference is explicitly presentational:

- API imports, request calls, parameters, and response handling;
- state, methods, computed business values, watchers, and lifecycle behavior;
- emitted and handled event names and payload expressions;
- v-model expressions;
- conditional and list-rendering expressions;
- permission and custom directives;
- props, slots, refs, validation rules, and submit/close flows;
- filter, column, action, and dialog-field order.

Permitted JavaScript differences are limited to static display copy and component presentation options such as variant, size, description, or display class.

Fix unexplained differences before delivery. Do not merely report them as acceptable.

## 9. Visual review

After replacing the shared stylesheet, find every page using ss-admin classes.

- Check every affected page at 1440px and 390px.
- Check the current target at 1280px and every accessible dialog.
- Check the common button states once on a representative page.
- Confirm horizontal table scrolling, centered cells, ellipsis behavior, responsive filter columns, and mobile dialog grids.
- In each dialog, open every segmented section and exercise switch-off and switch-on states that reveal fields.
- Confirm grouped radio and checkbox controls use the canonical choice panel and that checked switches use the canonical primary color.
- For every unit addon, compare its height, top edge, and bottom edge with the adjacent input; include flex-centered compound controls and long addon text.
- When `el-row` uses custom flex or grid, confirm clearfix pseudo-elements do not create phantom columns, offset fields, or unexpected wrapping.

Do not create fake business data or change API behavior to reach a state.

If the application cannot be opened or screenshots cannot be produced, finish the code and mark the result 未视觉验收. Do not claim the visual matrix passed.

## 10. Delivery report

List:

- target and affected pages;
- shared and scoped files changed;
- presentation-only JavaScript changes;
- legacy classes retained for compatibility;
- behavior comparison result;
- visual scenarios checked;
- unverified scenarios and the reason.

Do not run unit tests, lint, or a production build as part of this skill.
