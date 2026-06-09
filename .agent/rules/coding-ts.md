---
trigger: glob
globs: ["**/*.ts", "!**/*.spec.ts"]
---

# TypeScript/Angular 编码规范 (ms-ng-view)

## 1. 组件开发规范
- **Standalone**: 必须设置 `standalone: true`
- **变更检测**: 必须设置 `changeDetection: ChangeDetectionStrategy.OnPush`
- **SoC 分离**: TS/HTML/CSS 严格分离，**严禁内联 `template:` 或 `styles:`**
- **命名**: 文件 `kebab-case`，类 `PascalCase`，属性/方法 `camelCase`

## 2. 数据请求规范
- **绝对禁止**使用原生 `fetch`，必须通过 Angular `HttpClient`（确保经过 Interceptor）
- 所有 API 路径统一配置在 `src/app/core/infrastructure/constants/url.config.ts`，通过 `URLConfig.XXX` 引用
- `apiUrlInterceptor` 只拦截 `/` 开头的请求，**严禁**拦截 `./` 开头的路径（如 i18n 资源）
- 禁止 `.toPromise()`，使用 `firstValueFrom()` / `lastValueFrom()`

## 3. SSE 流式处理
```ts
this.http.post(..., { observe: 'events', reportProgress: true, responseType: 'text' })
```
聊天气泡必须随 SSE 数据到达实时更新（流式 Markdown 渲染）

## 4. 样式规范
- Tailwind class 优先；CSS 仅用于 `::ng-deep` 覆盖或复杂 Keyframes
- CSS 中引用 Tailwind 重要性修饰符时必须转义：`.\\!w-8`（而非 `.!w-8`）

## 5. 国际化 (强制)
- **严禁**在模板或逻辑中硬编码中文文本
- 使用 `{{ 'KEY' | translate }}` 或 `this.translate.instant('KEY')`
- 严禁硬编码针对特定语言名称的匹配逻辑

## 6. 4 层架构执行
- Use Case 维护 Signals 状态，严禁 UI 组件直接持有状态
- Adapter 负责 DTO → Domain 转换，UI 只看到 Domain 接口
- 复杂业务计算（倒计时、搜索过滤）下沉到 Use Case，禁止放在组件
