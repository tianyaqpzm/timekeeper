---
trigger: glob
globs: ["**/*.spec.ts"]
---

# 前端测试规范 (ms-ng-view)

## 1. Jest 配置规范
- 使用 `@angular-builders/jest:run`；配置文件使用 `config` 而非 `jestConfig`
- `type: module` 项目中，Jest 配置文件必须使用 `.js` 后缀并导出为 ESM 对象
- 禁止在 `setup-jest.ts` 中手动调用 `setupZoneTestEnv()`

## 2. Mock 规范
- **Signal Mocking**: Mock 对象必须显式提供 `signal(value)` 而非原始值
- **HttpClient**: 禁止使用 `HttpClientTestingModule`，必须用 `provideHttpClientTesting()` 配套 `provideHttpClient()`

## 3. TDD 强制流程
- **核心逻辑强制 TDD**: Use Case 层、状态管理 Signals、Adapter 复杂逻辑必须先写测试
- 编写实现代码前必须先编写覆盖正常路径与关键异常的测试用例

## 4. TSDoc 规范
- 所有导出的类、接口、`public`/`protected` 方法必须包含 TSDoc 注释
- 注释使用 `@param` 和 `@returns` 描述参数和返回值
