# Canonical component structures

These snippets define presentation shells, not replacement business components. Preserve every real binding, directive, event, prop, slot, and condition from the target page.

## Page, hero, and panels

~~~vue
<section class="<feature>-page ss-admin-list-page">
  <header class="ss-admin-hero">
    <div class="ss-admin-hero__content">
      <span class="ss-admin-hero__eyebrow">MODULE OPERATIONS</span>
      <h1 class="ss-admin-hero__title">页面标题</h1>
      <p class="ss-admin-hero__description">静态业务说明</p>
    </div>
    <div class="ss-admin-hero__scope">
      <span class="ss-admin-hero__scope-dot" />
      <span>集中管理</span>
      <span class="ss-admin-hero__scope-divider" />
      <span>状态清晰</span>
      <span class="ss-admin-hero__scope-divider" />
      <span>操作可追溯</span>
    </div>
  </header>

  <section class="ss-admin-panel">
    <div class="ss-admin-section-heading">
      <div class="ss-admin-section-heading__content">
        <span class="ss-admin-section-heading__eyebrow">Filter</span>
        <strong class="ss-admin-section-heading__title">条件筛选</strong>
        <span class="ss-admin-section-heading__description">保留原筛选字段和顺序</span>
      </div>
      <span class="ss-admin-section-heading__meta">支持组合查询</span>
    </div>
    <!-- Existing filter component and bindings -->
  </section>

  <section class="ss-admin-panel ss-admin-panel--table">
    <div class="ss-admin-section-heading">
      <div class="ss-admin-section-heading__content">
        <span class="ss-admin-section-heading__eyebrow">Records</span>
        <strong class="ss-admin-section-heading__title">数据列表</strong>
        <span class="ss-admin-section-heading__description">保留原表格字段和操作</span>
      </div>
      <div class="ss-admin-section-heading__actions">
        <!-- Existing meta and page actions -->
      </div>
    </div>
    <!-- Existing table component and bindings -->
  </section>
</section>
~~~

## Filter grid and actions

Keep each existing form item intact inside a canonical cell.

~~~vue
<el-form class="<feature>-filter ss-admin-filter" :model="existingForm">
  <div class="ss-admin-filter__grid">
    <div class="ss-admin-filter__cell">
      <el-form-item class="ss-admin-filter__field" label="现有字段">
        <!-- Existing control with unchanged v-model and events -->
      </el-form-item>
    </div>

    <div class="ss-admin-filter__cell ss-admin-filter__cell--actions">
      <div class="ss-admin-filter__actions">
        <el-button
          class="ss-admin-button ss-admin-button--filter-primary"
          type="primary"
        >
          查询
        </el-button>
        <el-button class="ss-admin-button ss-admin-button--filter-secondary">
          重置
        </el-button>
      </div>
    </div>
  </div>
</el-form>
~~~

Do not copy the placeholder bindings. Retain the target page's real bindings and directives.

## Table, status, and actions

~~~vue
<section class="<feature>-table">
  <div class="ss-admin-table-viewport">
    <el-table
      class="ss-admin-table"
      header-row-class-name="ss-admin-table__header"
      row-class-name="ss-admin-table__row"
    >
      <!-- Existing columns stay in the same order -->
      <span class="ss-admin-table__ellipsis">现有长文本</span>
      <span class="ss-admin-status ss-admin-status--success">现有状态</span>
      <div class="ss-admin-table__actions">
        <el-button
          class="ss-admin-button ss-admin-button--row-primary"
          plain
        >
          现有操作
        </el-button>
      </div>
    </el-table>
  </div>

  <div class="ss-admin-pagination">
    <!-- Existing pagination component and event contract -->
  </div>
</section>
~~~

Use these row modifiers:

- row-primary: view, edit, or primary navigation.
- row-secondary: log or secondary information.
- row-success: enable or positive action.
- row-warning: disable or cautionary action.
- row-danger: delete or irreversible action.

Do not change the business meaning merely to fit a modifier.

## Dialog content

Use SsDialog board presentation when the existing component contract supports it. Otherwise retain the dialog shell and apply the same inner structure.

~~~vue
<section class="<feature>-dialog ss-admin-dialog">
  <!-- Existing dialog component, props, events, and footer behavior -->
  <div class="ss-admin-dialog__mode-banner">
    <span class="ss-admin-dialog__mode-icon">
      <i class="el-icon-edit-outline" />
    </span>
    <div class="ss-admin-dialog__mode-copy">
      <strong>现有模式标题</strong>
      <span>静态模式说明</span>
    </div>
    <span class="ss-admin-dialog__mode-tag">现有模式</span>
  </div>

  <div class="ss-admin-dialog__content-card">
    <div class="ss-admin-dialog__section-heading">
      <span class="ss-admin-dialog__section-icon">
        <i class="el-icon-setting" />
      </span>
      <div>
        <strong>现有分区标题</strong>
        <p>静态辅助说明</p>
      </div>
    </div>

    <div class="ss-admin-dialog__form-grid">
      <el-form-item class="ss-admin-dialog__field">
        <!-- Existing field -->
      </el-form-item>
      <el-form-item
        class="ss-admin-dialog__field ss-admin-dialog__field--full"
      >
        <!-- Existing wide field -->
      </el-form-item>
    </div>
  </div>
</section>
~~~

Keep textareas, date ranges, rich content, logs, and other wide surfaces full-width. Preserve field order and all existing conditional wrappers.

### Interactive and conditional dialog forms

When the existing dialog includes section tabs, radio or checkbox groups, switches, unit addons, or switch-revealed fields, use the canonical structures in [dialog-form-patterns.md](dialog-form-patterns.md). In particular:

- section tabs use the contiguous segmented-control classes;
- grouped choices use the choice-panel classes;
- dense conditional rows use subsection grid and full-width modifiers;
- unit text is placed in a unit-control wrapper rather than aligned through a global offset.

These wrappers are presentational. Keep every original `v-model`, condition, validation prop, disabled expression, and event handler on the existing business component.

## Static copy

When the page has no hero or section copy:

- derive the Chinese title from the current route meta or existing heading;
- derive the English eyebrow from the module name;
- generate neutral descriptive copy;
- use three neutral scope labels such as 集中管理, 状态清晰, 操作可追溯.

Never use generated copy as a source for code paths, conditions, analytics, or permissions.
