---
trigger: glob
globs: ["**/*.html"]
---

# Angular 模板规范 (ms-ng-view)

## 1. 控制流语法（Angular 21+）
- **必须**使用新控制流：`@if`、`@for`、`@switch`
- **禁止**使用旧版结构指令：`*ngIf`、`*ngFor`、`*ngSwitch`
- `@for` 循环**必须**配置 `track` 表达式（如 `track item.id`）

## 2. 图标规范 (mat-icon)
- 全局已配置 `mat-icon` 为 `inline-flex` 居中，`overflow: visible`
- 使用图标**只需**通过 Tailwind 设置 `font-size`：
  ```html
  <mat-icon class="!text-[16px]">content_copy</mat-icon>
  ```

## 3. 国际化模板规范
- 模板中所有可见文本使用 `{{ 'KEY' | translate }}`
- **严禁**在 HTML 模板中硬编码中文字符串

## 4. 认证兼容
- 兼容 `HashLocationStrategy`；提取 Token 时需同时检查 `search` 和 `hash` 参数
