---
name: ms-ng-view-deep-reference
description: >
  ms-ng-view 前端完整规范深度参考。在以下场景下加载：
  - 需要了解 4 层整洁架构的完整设计细节（Domain/UseCase/Adapter/UI）
  - 讨论 Angular Material 深层样式覆盖（::ng-deep）的最佳实践
  - 需要了解 SSE 流式处理的完整实现模式
  - 讨论认证令牌提取的 HashLocationStrategy 兼容方案
  - 插件管理模块的动态 JSON Schema 表单渲染设计
---

# ms-ng-view 完整规范参考

> 此文档是深度参考，日常编码请使用 Glob 触发的 `coding-ts.md` / `testing-ts.md`

## 4 层整洁架构完整规范

### Domain Layer
- 只含纯 TS `interface`、`type` 和纯函数
- **严禁**包含 Angular、Axios/HttpClient 或状态管理引用
- 示例：`chat.model.ts`, `knowledge.model.ts`, `event-repository.interface.ts`

### Use Case Layer
- 统一维护页面状态（Signals），作为 UI 与 Adapter 桥梁
- 复杂业务计算（倒计时、搜索过滤、任务轮询）必须放在 Use Case，禁止放在 UI 组件
- 示例：`ChatUseCase`, `KnowledgeUseCase`, `EventUseCase`

### Adapter Layer
- 封装 HttpClient，处理请求拦截、Token 注入和 DTO→Domain 转换
- 后端 JSON 结构在此层转换为 Domain 接口，UI 层只看到 Domain 接口
- 所有 API 路径统一在 `src/app/core/infrastructure/constants/url.config.ts`

### UI Layer
- 只渲染 Use Case 暴露的 Signals，只调用 Use Case 方法
- **严禁**出现 API URL 字符串、直接 HTTP 请求或硬件调用

## 测试完整规范

### 项目结构
- 核心逻辑存放在 `src/app/core/`
- 拦截器统一存放在 `src/app/core/infrastructure/interceptors/`

### Signal Mocking 示例
```typescript
const mockUseCase = {
  messages: signal([]),
  isLoading: signal(false),
  sendMessage: jest.fn()
};
```

## 认证与令牌完整规范
```typescript
// 同时检查 search 和 hash（兼容 HashLocationStrategy）
const params = new URLSearchParams(location.search || location.hash.split('?')[1]);
const token = params.get('token');
```

## 插件管理规范
- 根据后端 JSON Schema 动态渲染配置表单
- API Key 等敏感数据必须确保 HTTPS 传输，不在本地存储明文
