# Angular 组件开发规范

## 1. 项目技术栈

- **框架**: Angular 21 (Standalone Components)
- **UI 组件库**: Angular Material 21
- **样式方案**: Tailwind CSS + 组件级 CSS 文件
- **开发语言**: TypeScript (严格模式)
- **构建工具**: Vite 6

## 2. 组件文件结构规范

### 2.1 强制要求：三文件分离

每个 Angular 组件必须严格分离为三个文件：

```
src/app/features/[module]/[component-name]/
├── [component-name].component.ts       # 逻辑层
├── [component-name].component.html     # 展示层/模板
└── [component-name].component.css      # 样式层
```

**示例：事件编辑对话框组件**

```
src/app/features/dashboard/event-edit-dialog/
├── event-edit-dialog.component.ts      # 组件逻辑
├── event-edit-dialog.component.html    # HTML 模板
└── event-edit-dialog.component.css     # 组件样式
```

### 2.2 禁止事项

❌ **不允许使用内联模板 (`template: \`...\`)`**
```typescript
// ❌ 错误做法
@Component({
  template: `<div>...</div>`,
  styles: [`...`]
})
```

✅ **必须使用外部模板文件**
```typescript
// ✅ 正确做法
@Component({
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.css']
})
```

## 3. TypeScript 组件文件规范 (.ts)

### 3.1 导入顺序
```typescript
// 1. Angular 核心
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// 3. Angular Forms
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// 4. 本地服务/接口
import { MyService } from '../../services/my.service';
```

### 3.2 @Component 装饰器配置
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush  // 必须配置
})
```

**重点说明：**
- `standalone: true` - 使用独立组件
- `changeDetection: ChangeDetectionStrategy.OnPush` - 必须配置，提升性能
- `templateUrl` 和 `styleUrls` - 必须使用外部文件

### 3.3 组件类结构
```typescript
export class MyComponent {
  // 1. 输入属性
  @Input() data: string = '';
  @Input() options: any = {};

  // 2. 输出事件
  @Output() save = new EventEmitter<Data>();
  @Output() cancel = new EventEmitter<void>();

  // 3. Signals 状态管理
  protected isLoading = signal(false);
  protected selectedItem = signal<Item | null>(null);

  // 4. 计算属性
  protected displayText = computed(() => {
    return this.selectedItem()?.name || 'No selection';
  });

  // 5. 生命周期/构造函数
  constructor() {
    effect(() => {
      // 响应式处理
    });
  }

  // 6. 公共方法
  public handleClick(): void { }

  // 7. 受保护的方法
  protected processData(): void { }

  // 8. 私有方法
  private formatDate(): string { }
}
```

## 4. HTML 模板文件规范 (.html)

### 4.1 模板语法要求
- 使用 Angular 21 新控制流语法：`@if`、`@for`、`@switch`
- 禁用旧版 `*ngIf`、`*ngFor`、`*ngSwitch`

✅ **正确**
```html
@if (isOpen && item) {
  <div>{{ item.name }}</div>
}

@for (item of items; track item.id) {
  <div>{{ item.title }}</div>
}

@switch(category) {
  @case('Birthday') { <span>🎂</span> }
  @default { <span>📅</span> }
}
```

❌ **错误**
```html
<div *ngIf="isOpen && item">{{ item.name }}</div>
<div *ngFor="let item of items">{{ item.title }}</div>
<div [ngSwitch]="category">
  <span *ngSwitchCase="'Birthday'">🎂</span>
</div>
```

### 4.2 Tailwind CSS 使用

**原则：优先使用 Tailwind 工具类，最小化自定义 CSS**

✅ **正确**
```html
<div class="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg">
  <span class="text-sm font-medium text-gray-900">Label</span>
</div>
```

❌ **不推荐**
```html
<div class="my-custom-container">
  <span class="my-label">Label</span>
</div>
```

### 4.3 Material 组件使用
```html
<!-- 按钮 -->
<button mat-raised-button color="primary">Save</button>
<button mat-stroked-button>Cancel</button>

<!-- 表单字段 -->
<mat-form-field appearance="outline">
  <mat-label>Select option</mat-label>
  <mat-select [(ngModel)]="selectedValue">
    <mat-option value="option1">Option 1</mat-option>
  </mat-select>
</mat-form-field>

<!-- 图标 -->
<mat-icon>edit</mat-icon>
```

### 4.4 事件处理最佳实践
```html
<!-- ✅ 正确：防止事件冒泡 -->
<button (click)="handleAction($event)" class="action-btn">
  Action
</button>

<!-- 在需要时使用 stopPropagation() -->
<button (click)="editItem(item); $event.stopPropagation()">Edit</button>
```

## 5. CSS 样式文件规范 (.css)

### 5.1 内容要求

CSS 文件用于：
1. **覆盖 Material 深层样式** - 当需要自定义 Material 组件内部样式
2. **特殊动画** - 组件级别的复杂动画
3. **条件样式** - 无法用 Tailwind 表达的样式逻辑

### 5.2 示例
```css
/* 覆盖 Material DatePicker 样式 */
::ng-deep .mat-datepicker-content {
  background-color: var(--custom-bg);
}

/* 组件特定的动画 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.dialog-container {
  animation: slideIn 0.3s ease-out;
}
```

### 5.3 禁止事项

❌ **不要在 CSS 中编写大量布局代码**
- 使用 Tailwind 替代

❌ **避免使用全局样式**
- 使用 `::ng-deep` 尽可能少

## 6. 展示型组件 vs 容器组件

### 6.1 展示型组件（推荐）
- 通过 `@Input()` 接收数据
- 通过 `@Output()` 派发事件
- 无副作用，无依赖注入
- 易于测试和复用

```typescript
@Component({...})
export class ItemCardComponent {
  @Input() item!: Item;
  @Input() isSelected = false;
  
  @Output() select = new EventEmitter<Item>();
  @Output() delete = new EventEmitter<string>();

  onSelect(): void {
    this.select.emit(this.item);
  }
}
```

### 6.2 容器组件
- 管理业务逻辑和状态
- 处理数据获取和服务调用
- 协调多个展示型子组件

```typescript
@Component({...})
export class ItemListComponent {
  items = signal<Item[]>([]);
  selectedItem = signal<Item | null>(null);

  constructor(private itemService: ItemService) {
    effect(() => this.loadItems());
  }

  private loadItems(): void {
    this.itemService.getItems().subscribe(data => {
      this.items.set(data);
    });
  }

  onItemSelect(item: Item): void {
    this.selectedItem.set(item);
  }
}
```

## 7. 状态管理规范

### 7.1 使用 Angular Signals
```typescript
// 基础状态
protected isLoading = signal(false);
protected selectedId = signal<string | null>(null);

// 计算属性
protected isDisabled = computed(() => {
  return this.isLoading() || !this.selectedId();
});

// 响应式更新
protected updateState(): void {
  this.isLoading.set(true);
  // ...
  this.isLoading.set(false);
}
```

### 7.2 避免过度复杂化
- 简单状态：使用 Signals
- 复杂异步流：考虑 RxJS（但优先使用 Signals）

## 8. 命名规范

### 8.1 文件和文件夹命名
```
✅ 正确：kebab-case
- event-edit-dialog.component.ts
- event-list.component.html
- dashboard.component.css

❌ 错误：camelCase 或 PascalCase
- eventEditDialog.component.ts
- EventList.component.html
```

### 8.2 类和接口命名
```typescript
✅ 正确：PascalCase
export class EventEditDialogComponent { }
export interface Event { }

❌ 错误：camelCase
export class eventEditDialog { }
export interface event { }
```

### 8.3 属性和方法命名
```typescript
✅ 正确：camelCase
public userName: string;
protected isOpen = signal(false);
private formatDate(): string { }

❌ 错误：PascalCase 或 snake_case
public UserName: string;
protected IsOpen = signal(false);
private format_date(): string { }
```

## 9. 性能最佳实践

### 9.1 变更检测
```typescript
// ✅ 必须配置 OnPush 策略
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 9.2 列表渲染优化
```html
<!-- ✅ 正确：使用 trackBy -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

### 9.3 异步管道
```html
<!-- ✅ 推荐 -->
<div>{{ (data$ | async)?.name }}</div>

<!-- 💡 使用 Signals 更简单 -->
<div>{{ data().name }}</div>
```

## 10. 测试规范

### 10.1 组件测试文件结构
```
component-name.component.spec.ts
```

### 10.2 测试覆盖要求
- 输入/输出属性测试
- 用户交互测试
- 计算属性验证
- 边界情况处理

## 11. 提交规范

### 11.1 创建新组件清单

- [ ] 创建组件目录
- [ ] 创建 `.ts` 文件（逻辑）
- [ ] 创建 `.html` 文件（模板）
- [ ] 创建 `.css` 文件（样式）
- [ ] 验证 `templateUrl` 和 `styleUrls` 正确配置
- [ ] 所有 Material 模块已导入
- [ ] 配置 `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] 使用 Angular 21 新语法（@if, @for, @switch）
- [ ] 运行构建验证无错误

## 12. 快速参考

### 组件模板
```typescript
// event-edit-dialog.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-event-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './event-edit-dialog.component.html',
  styleUrls: ['./event-edit-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventEditDialogComponent {
  @Input() isOpen = false;
  @Input() data: any = null;
  
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  onSave(): void {
    if (this.data) {
      this.save.emit(this.data);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
```

---

**版本**: 1.0
**最后更新**: 2026-01-24
**维护人**: 项目架构团队
