# /chat 页面点赞功能完善计划

> **Goal:** 修复 /chat 页面 AI 回复的点赞/点踩功能中所有现存问题，包括 HTML 模板错误引用、UI 交互细节完善

**Architecture:** 前端 Angular 组件 + Signal 驱动状态 → UseCase → API Adapter → 后端 Spring Boot Controller → MyBatis-Plus → MySQL

**Tech Stack:** Angular 19 (Standalone), RxJS, Angular Material Icons, Spring Boot 3, MyBatis-Plus

---

## 现有问题

1. **HTML 模板第 228/234 行**：点赞/点踩按钮高亮条件引用了 `responseRatings().get($index)` — 这是一个不存在的信号/方法，应该改为 `msg.rating === 'good'` / `msg.rating === 'bad'`（直接使用 `ChatMessage.rating` 字段）
2. **历史加载时 `rating` 字段映射**：`ChatApiAdapter.getHistory()` 中已经正确将后端 `rating` 映射到前端，但需要确认 `null` vs `undefined` 的边界
3. **已点赞状态图标没有切换**：点赞后应该将图标从 `thumb_up_off_alt` 切换为 `thumb_up`（实心），点踩同理
4. **缺少视觉反馈**：点赞/点踩后缺少动画反馈（如短暂的缩放或颜色脉冲）

---

### Task 1: 修复 HTML 模板中点赞按钮的高亮条件

**Objective:** 将 `responseRatings().get($index)` 替换为正确的 `msg.rating` 字段判断

**Files:**
- Modify: `src/app/features/chat/chat.component.html` 第 227-237 行

**Step 1: 定位并修复点赞按钮高亮条件**

将：
```html
<button ... (click)="rateResponse($index, 'good')"
    [class.text-blue-500]="responseRatings().get($index) === 'good'"
    ...>
    <mat-icon>thumb_up_off_alt</mat-icon>
</button>
```

改为：
```html
<button ... (click)="rateResponse($index, 'good')"
    [class.text-blue-500]="msg.rating === 'good'"
    ...>
    <mat-icon>{{ msg.rating === 'good' ? 'thumb_up' : 'thumb_up_off_alt' }}</mat-icon>
</button>
```

**Step 2: 定位并修复点踩按钮高亮条件**

将：
```html
<button ... (click)="rateResponse($index, 'bad')"
    [class.text-red-500]="responseRatings().get($index) === 'bad'"
    ...>
    <mat-icon>thumb_down_off_alt</mat-icon>
</button>
```

改为：
```html
<button ... (click)="rateResponse($index, 'bad')"
    [class.text-red-500]="msg.rating === 'bad'"
    ...>
    <mat-icon>{{ msg.rating === 'bad' ? 'thumb_down' : 'thumb_down_off_alt' }}</mat-icon>
</button>
```

**Step 3: 验证编译**

```
ng build --configuration production
```
或进行 TypeScript 类型检查确认无误。

---

### Task 2: 完善后端 `rating` 字段序列化

**Objective:** 确保后端返回的 `rating` 字段在前端能正确解析为 `'good' | 'bad' | null`

**Files:**
- Check: `ChatMessage.java` 中 `getRating()` 返回 `String`
- Check: 数据库 `ms_chat_message.rating` 字段存储 `'good'` / `'bad'` / `NULL`
- Check: `ChatApiAdapter.getHistory()` 映射逻辑

**分析结论（无需修改）：**
- 后端 `ChatMessage` 的 `rating` 字段是 `String`，序列化为 JSON 时值为 `"good"` / `"bad"` / `null`
- 数据库 `rating` 列存 `'good'` / `'bad'` / `NULL`
- 前端 `ChatApiAdapter.getHistory()` 中已有 `rating: h.rating ?? null` 映射
- 前端 `ChatMessage` 模型中 `rating?: 'good' | 'bad' | null` 与后端对齐

> **注意：** 前端 `ChatMessage` 的 `rating` 是可选字段 `rating?: 'good' | 'bad' | null`，在历史加载时若后端返回 `null`，会通过 `?? null` 保持为 `null`；若后端未返回该字段（undefined），则 `rating` 为 `undefined`。在 Task 1 的 HTML 模板中，`msg.rating === 'good'` 对 `null` 和 `undefined` 都返回 `false`，行为正确，无需额外处理。

---

### Task 3: 为点赞/点踩添加微交互动画

**Objective:** 点击点赞/点踩时添加短暂的缩放脉冲动画，提供触感反馈

**Files:**
- Modify: `src/app/features/chat/chat.component.css` — 添加动画类
- Modify: `src/app/features/chat/chat.component.html` — 添加动画类绑定

**Step 1: 添加动画 CSS**

在 `src/app/features/chat/chat.component.css` 中添加：

```css
@keyframes rating-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.rating-active {
    animation: rating-pulse 0.3s ease-in-out;
}
```

**Step 2: 修改 HTML 按钮**

在点赞/点踩按钮上绑定动画类，仅在 rating 变化时触发（Angular 会自动管理）：

```html
<button ... (click)="rateResponse($index, 'good')"
    [class.rating-active]="msg.rating === 'good'"
    ...>
```

（由于 Angular 的变更检测和动画生命周期，最简单的实现是在 rateResponse 完成后触发一次动画。更精确的做法可以添加一个 `ratingAnimIndex` 信号，但我选择保持简单。）

**Step 3: 验证样式未破坏其他元素**

检查 `rating-active` 不与其他元素冲突。

---

### Task 4: 验证全链路集成

**Objective:** 确认从前端点击到后端存储再到历史回读的整条链路正确

**验证步骤：**

1. 打开浏览器 → 进入 `/chat` 页面
2. 发送一条消息并获得 AI 回复
3. 点击点赞按钮（拇指朝上图标）
   - 期望：图标从 `thumb_up_off_alt` 变为 `thumb_up`（实心），颜色变蓝，按钮有脉冲动画
4. 再次点击相同按钮
   - 期望：图标恢复为 `thumb_up_off_alt`，颜色恢复灰色（取消点赞）
5. 点击点踩按钮
   - 期望：图标从 `thumb_down_off_alt` 变为 `thumb_down`，颜色变红（切换评分）
6. 刷新页面
   - 期望：历史加载后，之前的评分状态正确恢复（蓝色实心拇指或红色实心拇指朝下）

---

## 任务执行顺序

1. **Task 1** → 修复 HTML 模板错误（最关键的 Bug 修复）
2. **Task 2** → 验证后端序列化（确认无问题）
3. **Task 3** → 添加动画反馈（增强交互）
4. **Task 4** → 全链路验证（手动测试）
