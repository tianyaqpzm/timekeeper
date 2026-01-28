// 1. 核心依赖
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';

// 2. 路由依赖 (这一块非常重要，缺一不可)
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './src/app.routes';

// 3. 其他功能依赖
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { apiUrlInterceptor } from './src/app/core/intercepotors/base-url.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    // 4. 路由配置
    // 如果 routes 导入错误，或者这里漏了写，就会报 PlatformLocation 错误
    provideRouter(routes, withHashLocation()),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' } // 全局生效
    },
    // --- 核心配置 ---
    provideHttpClient(
      // 1. 启用 fetch API (Angular 新版默认推荐，性能更好，与 Vite 兼容性更佳)
      withFetch(),
      // 2. 注册你的函数式拦截器 (可以放多个，按顺序执行)
      withInterceptors([apiUrlInterceptor])
    )
  ]
}).catch((err) => console.error(err));

