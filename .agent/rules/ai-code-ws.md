---
trigger: always_on
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
2. **数据隔离**: UI 组件严禁直接调用 API，必须通过 `ChatUseCase` (Use Case 层) 编排。
3. **样式转义**: Tailwind 的重要性修饰符 `!` 在 CSS 中必须转义为 `.\!`。
4. **测试规范**: 针对 Signals 的单元测试，Mock 对象必须显式提供 `signal(value)`。
5. **Markdown 渲染**: 统一使用 `ngx-markdown` 处理 AI 回复。需在 `main.ts` 中配置 `provideMarkdown()`，并确保 `chat.component.css` 中包含对 `::ng-deep` 元素的样式定义。
6. **动态判定与国际化**: 严禁在 UI 逻辑中硬编码针对特定语言名称（如“菜谱”）的匹配来进行业务处理。


# Key Context (关键背景)
前端服务 (`ms-ng-view`) 直接与网关 (`ms-java-gateway`) 交互。负责页面渲染、数据可视化与用户交互逻辑，支持流式对话展示与插件动态管理。