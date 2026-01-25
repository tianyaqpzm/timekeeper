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
import { provideHttpClient } from '@angular/common/http';

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
    }
  ]
}).catch((err) => console.error(err));

