---
trigger: on_demand
description: ms-ng-view 前端架构规范（已拆分）。深度参考见 skills/angular-reference/SKILL.md
---

# 前端架构与代码规范指南 (ms-ng-view)

## 一、 整洁架构 (4-Layer Clean Architecture)
前端代码必须严格遵循“关注点分离”，严禁在 UI 组件中混杂网络请求和复杂业务逻辑。

### 1. Domain Layer (领域层 - 核心)
- **职责**：定义业务实体、类型声明和业务规则接口。
- **规范**：只能包含纯 TS 的 interface、type 和纯函数。
- **禁区**：严禁包含任何框架代码（Angular）、外部库（Axios/HttpClient）或状态管理引用。
- **示例**：`chat.model.ts`, `knowledge.model.ts`, `event-repository.interface.ts`。

### 2. Use Case Layer (用例层 / 应用逻辑)
- **职责**：编排具体的业务场景（如：获取用户列表、发送聊天消息）。统一维护页面状态（Signals），作为 UI 与 Adapter 之间的桥梁。
- **规范**：接收 Domain 层的数据结构，调用 Adapter 层的接口。通常实现为纯函数或 Class。
- **核心逻辑下沉**：复杂的业务计算（如倒计时、搜索过滤、任务轮询）必须放在 Use Case 中，严禁放在 UI 组件。
- **禁区**：严禁直接调用 fetch 或 HttpClient，必须通过依赖注入调用 Adapter 暴露的接口。
- **示例**：`ChatUseCase`, `KnowledgeUseCase`, `EventUseCase`。

### 3. Adapter / Infrastructure Layer (适配器层 / 基础设施)
- **职责**：与外部世界交互，封装所有副作用（网络请求、本地存储、原生 API 封装）。
- **规范**：在此处封装 HttpClient，处理请求拦截、Token 注入和后端 DTO 到前端 Domain 模型的数据转换 (Mapper)。
- **防腐层 (ACL)**：后端返回的 JSON 结构必须在此层转换为 Domain 层定义的标准接口，UI 层只能看到 Domain 接口。
- **URL 管理**：必须使用 `URLConfig` 常量引用 API 路径，严禁硬编码。

### 4. UI / Presentation Layer (表现层)
- **职责**：仅负责“渲染数据”和“捕获用户事件”。
- **规范**：必须是“傻瓜组件”（Dumb Components）。仅通过 Use Case 暴露的 Signals 渲染 UI，通过调用 Use Case 方法触发业务。
- **禁区**：组件逻辑中严禁出现 API URL 字符串、直接的 HTTP 请求或硬件调用逻辑。

---

## 二、 技术栈与工具 (Tech Stack)
- **框架**: Angular 21 (Standalone Components)
- **UI 组件库**: Angular Material 21
- **状态管理**: Angular Signals (优先使用)
- **数据流**: RxJS 7+ (使用 `firstValueFrom`/`lastValueFrom` 替代 `toPromise`)
- **样式方案**: Tailwind CSS 4.x + 组件级 CSS
- **构建工具**: Vite 6 / ESBuild
- **语言**: TypeScript (Strict Mode)
- **国际化**: Ngx-translate 17+

---

## 三、 数据请求规范 (Data Fetching & SSE)
- **HttpClient 强制**: **绝对禁止**使用原生 `fetch`。所有请求必须通过 Angular `HttpClient` 以确保经过 HttpInterceptor。
- **URL 集中化 (Best Practice)**: 所有的 API 请求路径必须统一配置在 `src/app/core/infrastructure/constants/url.config.ts` 中。Adapter 层只能通过 `URLConfig.XXX` 引用，严禁散落在代码各处。
- **拦截器范围**: `apiUrlInterceptor` 必须仅拦截以 `/` 开头的 API 请求。严禁拦截 `./` 开头的相对路径（如 i18n 资源）。
- **异步处理**: 严禁使用已弃用的 `.toPromise()`。普通接口首选 `firstValueFrom(this.http.get(...))`。
- **SSE 流式处理**: 
    - 使用 `this.http.post(..., { observe: 'events', reportProgress: true, responseType: 'text' })`。
    - 配合 `next()` 回调进行分段数据读取。
    - 实现 **流式 Markdown 渲染**，聊天气泡必须随 SSE 数据到达实时更新。

---

## 四、 组件开发规范 (Angular Component Standards)

### 1. 命名约定
- **文件与目录**: 统一使用 `kebab-case` (例: `chat-message.component.ts`)。
- **类与接口**: 统一使用 `PascalCase` (例: `ChatUseCase`)。
- **属性与方法**: 统一使用 `camelCase` (例: `isLoading`, `sendMessage()`)。

### 2. 结构与声明
- **关注点分离 (Separation of Concerns, SoC)**: 组件必须使用外部模板与样式 (External Templates & Styles)，实现 TS、HTML、CSS 的严格分离。严禁使用内联模板 (`template:`) 或内联样式 (`styles:`)。
- **独立组件**: 必须设置 `standalone: true`。
- **变更检测**: 必须设置 `changeDetection: ChangeDetectionStrategy.OnPush`。

### 3. 模板语法 (Angular 21+)
- **新控制流**: 必须使用 `@if`, `@for`, `@switch`。禁止使用旧版 `*ngIf`, `*ngFor`。
- **渲染优化**: `@for` 循环中必须配置 `track` 表达式。

---

## 五、 样式规范 (Styling Standards)
- **Tailwind 优先**: 布局、间距、颜色等基础样式优先使用 Tailwind class。
- **选择器转义**: 在 CSS 中引用 Tailwind 重要性修饰符时，**必须**对 `!` 进行转义（例：`.\!w-8`）。
- **CSS 用途**: 仅用于覆盖 Material 深层样式 (`::ng-deep`)、复杂 Keyframes 动画或无法通过 Tailwind 实现的交互。

### 3. 图标对齐与剪裁规范 (Icon Alignment & Clipping)
- **全局对齐**：系统已在 `styles.css` 中全局配置 `mat-icon` 为 `inline-flex` 居中并设置 `overflow: visible`。
- **使用要求**：在组件中使用图标时，**仅需**通过 Tailwind 设置所需的 `font-size`。
- **示例**：`<mat-icon class="!text-[16px]">content_copy</mat-icon>`（无需再写一堆 flex 补丁）。

---

## 六、 维护与测试规范 (Maintenance & Testing)

### 1. 项目结构
- **核心逻辑**: 必须存放在 `src/app/core/` 下。
- **拦截器**: 统一存放在 `src/app/core/infrastructure/interceptors/` 目录下。

### 2. 测试规范 (Jest)
- **Builder**: 使用 `@angular-builders/jest:run`。配置文件使用 `config` 而非 `jestConfig`。
- **ESM 兼容**: 在 `type: module` 项目中，Jest 配置文件必须使用 `.js` 后缀并导出为 ESM 对象。
- **环境初始化**: 现代 Jest Builder 自动处理 `TestBed` 初始化，禁止在 `setup-jest.ts` 中手动调用 `setupZoneTestEnv()`。
- **Signal Mocking**: Mock 对象必须显式提供 `signal(value)` 而非原始值，以确保模板调用 `signal()` 不报错。
- **HttpClient 测试**: 严禁使用已弃用的 `HttpClientTestingModule`，必须使用 `provideHttpClientTesting()` 配套 `provideHttpClient()`。

### 3. 测试驱动开发 (TDD - Test-Driven Development)
- **强制 TDD**: 前端核心逻辑（特别是 Use Case 层业务编排、状态管理 Signals 以及 Adapter 层的复杂逻辑）必须遵循 TDD（测试驱动开发）。
- **流程**: 在开发或修改核心业务代码之前，必须先编写 Jest 测试用例，确保测试用例覆盖正常路径与关键异常。不允许出现核心逻辑完全没有测试用例的裸奔代码。


---

---

## 七、 文档与注释规范 (Documentation Standards)
- **TSDoc 强制**: 所有导出的类、接口、公共方法（public）和受保护方法（protected）必须包含 TSDoc 注释。
- **内容要求**: 注释必须清晰描述功能、参数（`@param`）和返回值（`@returns`）。
- **语言**: 核心业务逻辑建议使用中文注释，保持与需求文档一致。
- **代码自解释**: 良好的命名是第一位的，注释应侧重于解释“为什么”而非“做什么”。

---

## 八、 业务特性规范 (Feature Specifics)

### 1. 国际化 (i18n)
- **强制执行**: 所有新增模块中的可见文本（含 HTML 模板、JS 弹窗 `alert`/`confirm`、提示语 `SnackBar` 等）必须严格遵循已有的国际化机制，严禁硬编码中文文本。
- 使用 `provideTranslateService` 和 `provideTranslateHttpLoader` 函数式 Provider。
- 路径配置指向 `./i18n/` (对应 `public/i18n`)，代码中通过 `{{ 'KEY' | translate }}` 或 `this.translate.instant('KEY')` 进行映射。

### 2. 认证与令牌
- 兼容 `HashLocationStrategy`。从 URL 提取 Token 时需同时检查 `search` 和 `hash` 参数。

### 3. 插件管理
- 根据后端 JSON Schema 动态渲染配置表单。
- 安全处理敏感数据（API Key），确保 HTTPS 传输。
