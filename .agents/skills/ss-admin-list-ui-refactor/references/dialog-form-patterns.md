# Dialog form patterns

Read this reference only when the target dialog contains segmented tabs, radio or checkbox groups, switches, unit addons, or dense conditional sections.

The canonical implementations live in `assets/ss-admin-list.scss`. Reuse those classes before adding business-scoped styles.

## Keep the dialog language unified

A board-style dialog uses the same hierarchy throughout:

1. title and short static description;
2. `ss-admin-dialog__mode-banner`;
3. `ss-admin-dialog__content-card`;
4. `ss-admin-dialog__section-heading`;
5. fields and conditional sections.

Do not leave the inner form in the old flat Element UI style after restyling the shell. Preserve every field, binding, condition, and event while changing only wrappers and classes.

## Segmented tabs

Tabs that switch form sections must look like one segmented control, not three unrelated buttons.

- Use one `ss-admin-dialog__segmented` outer border and radius.
- Place segments directly next to one another with no gap.
- Use only the outer corner radii; adjacent segments share a one-pixel divider.
- Apply `ss-admin-dialog__segment--active` to the current value.
- Preserve the original current-tab value, click handler, visibility conditions, and stable keys.
- At the dialog breakpoint, let all visible segments share the available width.

~~~vue
<div class="ss-admin-dialog__segmented">
  <button
    v-for="tab in existingTabs"
    :key="tab.value"
    type="button"
    class="ss-admin-dialog__segment"
    :class="{ 'ss-admin-dialog__segment--active': tab.value === currentTab }"
    @click="existingTabHandler(tab.value)"
  >
    {{ tab.label }}
  </button>
</div>
~~~

## Dense and conditional layouts

An 800px-class dialog cannot safely retain long left-positioned labels and fixed label widths from a wider legacy dialog.

- Put labels above controls in dense tabs.
- Use two columns only when both controls and labels fit without wrapping into neighboring fields.
- Make long labels, tables, compound time controls, warnings, and textareas full-width.
- Use `ss-admin-dialog__notice ss-admin-dialog__notice--warning` for cautionary copy instead of loose red paragraphs or inline styles.
- Prefer a light top divider for conditional subsections. Avoid bordered cards whose heights jump dramatically when a switch reveals fields.
- Use `ss-admin-dialog__subsection-grid` for two-column conditional content and `ss-admin-dialog__subsection-field--full` for full-width rows.
- Collapse to one column below 680px.
- Do not accept horizontal form scrolling as a layout solution.

Element UI adds clearfix pseudo-elements to `el-row`. When an `el-row` is changed to custom flex or grid, its `::before` and `::after` become phantom layout items unless explicitly hidden. The canonical subsection grid handles this. Preserve that rule in any business-scoped equivalent.

## Radio and checkbox groups

Choice groups use a field-like panel so they align with adjacent inputs.

- Apply both `ss-admin-dialog__choice-panel` and `ss-admin-dialog__choice-group` when the radio or checkbox group itself is the panel.
- When a checkbox section has a title or “select all” control, put the section in `ss-admin-dialog__choice-panel` and apply `ss-admin-dialog__choice-group` to the nested `el-checkbox-group`.
- Keep the panel full-width with a minimum height of 40px.
- Allow wrapping with consistent row and column gaps.
- Use the canonical primary color for selected, indeterminate, hover, and focus states; preserve disabled styling.

~~~vue
<el-radio-group
  class="ss-admin-dialog__choice-panel ss-admin-dialog__choice-group"
  v-model="existingValue"
>
  <!-- Existing radio options -->
</el-radio-group>
~~~

Do not create a separate rounded box around every individual radio or checkbox unless the supplied reference explicitly shows chip-style choices.

## Warning notices

Use the canonical warning notice for configuration consequences and timing cautions. Keep the existing copy unchanged, place the notice at full width, and do not use it as a replacement for validation errors or confirmation dialogs.

## Switches

Switches inside `ss-admin-dialog` use `#2868b8` for the checked track. Do not leave Element UI's default blue when the dialog has adopted the canonical theme. Check both enabled and disabled states; do not override disabled opacity or cursor behavior.

## Unit addons and compound controls

Use `ss-admin-dialog__unit-control` with `ss-admin-dialog__unit-addon` instead of relying on inline-element baselines. The wrapper owns vertical alignment, and every input, select, input-number, and addon is 40px high.

~~~vue
<div class="ss-admin-dialog__unit-control">
  <el-input-number v-model="existingValue" />
  <span class="ss-admin-dialog__unit-addon">秒</span>
</div>
~~~

For a compound value such as `T + day + hour`, use `ss-admin-dialog__unit-separator` for plain text between controls. Do not apply a global translate or top offset to every addon: an offset that fixes baseline-aligned inline content will misalign addons inside an `align-items: center` container.

When protected legacy markup cannot accept a wrapper, keep the fallback scoped to its exact context:

- set addon `box-sizing: border-box`, `height: 40px`, `padding: 0 10px`, and `line-height: 38px`;
- apply any one-pixel baseline correction only to ordinary inline form content;
- cancel that correction inside existing flex-centered wrappers.

## Visual acceptance checks

For every affected dialog:

1. Open every segmented tab.
2. Check dense tabs at the actual dialog width and confirm there is no horizontal scrollbar.
3. Check radio and checkbox panels with selected, unselected, wrapped, and disabled choices when reachable.
4. Check every switch both off and on, including all revealed fields.
5. Compare input and addon bounding boxes. Their heights, top edges, and bottom edges must match; inspect short and long addon text.
6. Check custom `el-row` flex or grid layouts for phantom first columns or unexplained wrapping.
7. Repeat at 390px or the project's mobile dialog viewport.

Do not claim the dialog visually complete after checking only its default tab or switch-off state.
