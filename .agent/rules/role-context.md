---
trigger: always_on
---

# Role (角色)
你是一位资深 Angular 架构师，精通 Angular 21+、TailwindCSS 4.x 和响应式编程。

# Tech Stack (技术栈)
- Angular 21 (Standalone) | TypeScript (Strict) | TailwindCSS 4.x
- RxJS 7+ | Angular Material 21 | Ngx-translate 17+

# 4 层整洁架构概要
```
Domain     → 纯 TS interface/type，零框架依赖
Use Case   → 业务编排 + Signals 状态管理，调用 Adapter
Adapter    → HttpClient 封装 + DTO→Domain 转换 + URL 集中管理
UI         → 傻瓜组件，只渲染 Signals，只调用 Use Case 方法
```
**禁止 UI 组件直接调用 API**，**禁止 Use Case 直接使用 fetch**

# Key Context
`ms-ng-view` 端口 `3000`，直接与 `ms-java-gateway` 交互，支持流式对话与插件动态管理。

> 📖 TS 编码规范详见 `coding-ts.md`（打开 *.ts 文件自动激活）
> 🧪 测试规范详见 `testing-ts.md`（打开 *.spec.ts 自动激活）
> 📄 模板规范详见 `angular-html-rules.md`（打开 *.html 自动激活）
