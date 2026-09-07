# Class naming

Use lowercase kebab-case with two ownership layers.

## Shared visual blocks

Shared blocks use the ss-admin namespace:

- ss-admin-list-page
- ss-admin-hero
- ss-admin-panel
- ss-admin-section-heading
- ss-admin-filter
- ss-admin-button
- ss-admin-table-viewport
- ss-admin-table
- ss-admin-status
- ss-admin-pagination
- ss-admin-dialog

Use BEM elements and modifiers:

- ss-admin-filter__grid
- ss-admin-filter__field
- ss-admin-filter__actions
- ss-admin-panel--table
- ss-admin-status--success
- ss-admin-button--row-primary
- ss-admin-dialog__field--full
- ss-admin-dialog__segmented
- ss-admin-dialog__segment
- ss-admin-dialog__segment--active
- ss-admin-dialog__choice-panel
- ss-admin-dialog__choice-group
- ss-admin-dialog__notice--warning
- ss-admin-dialog__subsection
- ss-admin-dialog__subsection-grid
- ss-admin-dialog__subsection-field--full
- ss-admin-dialog__unit-control
- ss-admin-dialog__unit-addon
- ss-admin-dialog__unit-separator

Keep one element level. Do not create names such as block__header__icon. Use block__header-icon or a new independent block.

## Business-owned blocks

Page-specific presentation uses the route or feature module:

- order-remark-page
- order-remark-table
- order-remark-dialog
- order-remark-log-dialog

Replace order-remark with the target folder or route module. Avoid generic blocks such as info-modal, content-box, wrapper, left-area, or box1.

## Ownership rule

Use ss-admin only when the class has no business meaning and the stylesheet can be reused unchanged. Keep special fields, page-only hero content, unusual cells, and dialog-specific arrangements in the business block.

## Forbidden naming

- Visual appearance: blue-button, gray-text, rounded-box.
- Accidental position: left-area, top-box, bottom-content.
- Numeric or vague names: content1, box2, wrap, item.
- Utility leakage: mt-16, w-100, flex-center.
- Back-end values directly interpolated into class names.

Semantic modifiers such as primary, success, warning, danger, disabled, active, full, table, row, and page are allowed.

## Legacy compatibility

Before removing or renaming a class:

1. Search the entire repository for the exact class.
2. Classify every hit as template, style, test, automation, JavaScript selector, telemetry, directive, or third-party integration.
3. If anything outside templates and styles references it, keep the old class beside the new canonical class.
4. Bind all new visual rules to the canonical class only.
5. Remove the old class only when it is proven presentation-only.

The canonical shared asset must never contain legacy rcm selectors.

## Element UI overrides

In global SCSS, anchor overrides beneath the owning block:

~~~scss
.ss-admin-filter {
  .el-input__inner {
    height: 40px;
  }
}
~~~

In scoped component SCSS, anchor deep selectors beneath the business or shared block:

~~~scss
.feature-dialog {
  ::v-deep .el-form-item__label {
    font-weight: 600;
  }
}
~~~

Do not add an unscoped global el-* override.
