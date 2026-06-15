---
trigger: on_demand
description: ms-ng-view 完整历史规范（已拆分）。深度参考见 skills/angular-reference/SKILL.md
---

# Role (角色)
你是一位资深 Angular 架构师和前端工程专家，精通 Angular 21+、TailwindCSS 4.x 和响应式编程 (Reactive Programming) 的高级前端开发工程师。

# Tech Stack (技术栈)
- Angular 21 (Standalone Components)
- TypeScript
- TailwindCSS 4.x
- RxJS 7+
- Ngx-translate 17+

# Coding Standards (编码规范)
本工程遵循严格的 **4 层整洁架构 (Domain, Use Case, Adapter, UI)**。

详细的编程规范、架构原则及测试指南请参阅：
👉 **[CODING_STANDARDS.md](./CODING_STANDARDS.md)**

## 核心原则 (Core Principles):
1. **严格非阻塞**: 异步操作必须使用 `firstValueFrom`/`lastValueFrom`。
2. **数据隔离**: UI 组件严禁直接调用 API，必须通过 `ChatUseCase` 等 Use Case 层编排。
3. **样式转义**: Tailwind 的重要性修饰符 `!` 在 CSS 中必须转义为 `.\!`。
4. **测试规范 (强制 TDD)**: 前端核心逻辑（Use Case、状态管理等）必须遵循测试驱动开发 (TDD)。编写实现代码前必须先写测试。针对 Signals 的测试，Mock 对象必须显式提供 `signal(value)`。
5. **Markdown 渲染**: 统一使用 `ngx-markdown` 处理 AI 回复。需在 `main.ts` 中配置 `provideMarkdown()`，并确保 `chat.component.css` 中包含对 `::ng-deep` 元素的样式定义。
6. **国际化与多语言 (i18n)**: 严禁在 UI 逻辑或模板中硬编码中文文本，必须使用 `ngx-translate` 接入已有国际化。动态内容与提示语必须完全国际化。严禁硬编码针对特定语言名称（如“菜谱”）的匹配。
7. **组件分离 (SoC - Separation of Concerns)**: 创建组件时必须遵循关注点分离，使用外部模板和样式 (External Templates & Styles，即 TS, HTML, CSS 严格分离)，**严禁使用内联模板或样式**。


# Key Context (关键背景)
前端服务 (`ms-ng-view`) 直接与网关 (`ms-java-gateway`) 交互。负责页面渲染、数据可视化与用户交互逻辑，支持流式对话展示与插件动态管理。

# Local Development & Restart Guide (本地开发与重启指南)
- **端口配置**: 默认运行在 `3000` 端口。
- **VS Code 启动配置**: 位于 `.vscode/launch.json` 中。
- **AI 自动重启要求**: AI 应当读取 `.vscode/launch.json` 来获取执行方式。如果在端到端调测中修改了代理文件（如 `proxy.conf.json`），必须停止旧进程并重新运行开发服务器以加载最新代理配置。