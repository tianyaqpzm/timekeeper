---
trigger: glob
globs: ["**/*.json", "**/*.yaml", "**/*.yml"]
---

# 本地开发指南 (ms-ng-view)

## 服务配置
- **端口**: `3000`
- **VS Code 启动**: `.vscode/launch.json`

## AI 重启规范
- 修改了代理文件（如 `proxy.conf.json` 或 `proxy.conf.cjs`）后，必须**停止旧进程**并重新运行开发服务器以加载最新代理配置
- 读取 `.vscode/launch.json` 获取正确的启动命令和环境变量

## i18n 资源文件
- i18n 资源文件位于 `public/i18n/`，通过 `./i18n/` 相对路径加载（不经过 `apiUrlInterceptor`）
