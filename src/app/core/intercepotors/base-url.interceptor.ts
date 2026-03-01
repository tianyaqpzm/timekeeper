import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { environment } from '@/environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    // 1. 获取 Vite 环境变量 (注意：需要在 vite-env.d.ts 定义类型，否则 TS 会报错)
    // 如果是开发环境，可能需要 '/api'，生产环境是全路径
    const baseUrl = environment.VITE_API_URL;

    // 2. 判断逻辑：如果请求已经是绝对路径(http开头)，或者是加载本地资源(assets)，则跳过
    let apiReq = req;
    if (!req.url.startsWith('http') && !req.url.startsWith('/assets')) {
        // 3. 克隆请求并替换 URL
        // 注意处理斜杠拼接问题：确保 baseUrl 不带末尾斜杠，或者在这里处理
        apiReq = req.clone({
            url: `${baseUrl}${req.url}`
        });
    }
    // 4. 继续请求链并统一拦截响应错误 (401 身份自动跳转)
    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // 如果后端返回了包含 url 的 JSON，说明需要重定向到登录页
                const currentUrl = encodeURIComponent(window.location.href);
                debugger
                if (error.error && error.error.url) {
                    window.location.href = "http://localhost:8281" + error.error.url + "?redirect=" + currentUrl;
                }
            }
            return throwError(() => error);
        })
    );
};