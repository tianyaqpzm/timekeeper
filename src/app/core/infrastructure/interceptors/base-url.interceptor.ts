import { environment } from '@/environments/environment';
import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const document = inject(DOCUMENT);
    const window = document.defaultView;
    const baseUrl = environment.VITE_API_URL;

    // 1. 获取本地 Token (排除 i18n 等静态资源) 
    const isI18nRequest = req.url.includes('/i18n/') || req.url.endsWith('.json');
    const token = authService.getToken();
    if (!token && !isI18nRequest) {
        console.warn('【Interceptor】No token found for request:', req.url);
    }

    // 2. 克隆请求，仅在向主 API 或网关请求时，添加 Authorization Header
    let apiReq = req;
    const headers: { [key: string]: string } = {};
    
    // 判断是否是发往我们自己后端服务或网关的请求
    const isTargetedToApp = 
        (req.url.startsWith('/') && !req.url.startsWith('/assets')) ||
        req.url.startsWith(baseUrl) ||
        req.url.startsWith(environment.VITE_GATEWAY_URL);

    if (token && isTargetedToApp) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (req.url.startsWith('/') && !req.url.startsWith('/assets')) {
        apiReq = req.clone({
            url: `${baseUrl}${req.url}`,
            setHeaders: headers
        });
    } else {
        apiReq = req.clone({
            setHeaders: headers
        });
    }

    // 3. 继续请求链并统一拦截响应错误 (401 身份自动跳转)
    return next(apiReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // 🔥【锁机制】防止并发请求导致多次重定向
                if (authService.isRedirecting) {
                    return EMPTY; // 直接中断，不做任何处理
                }
                authService.isRedirecting = true;

                // 清除本地失效 Token
                authService.removeToken();

                if (window) {
                    const currentUrl = encodeURIComponent(window.location.href);
                    if (error.error && error.error.url) {
                        const authBaseUrl = environment.VITE_GATEWAY_URL;
                        window.location.href = authBaseUrl + error.error.url + "?redirect=" + currentUrl;
                    } else {
                        // 兜底跳转
                        const authBaseUrl = environment.VITE_GATEWAY_URL;
                        window.location.href = `${authBaseUrl}/oauth2/authorization/casdoor?redirect=${currentUrl}`;
                    }
                }
            }
            return throwError(() => error);
        })
    );
};
