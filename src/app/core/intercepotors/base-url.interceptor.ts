import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@/environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
    // 1. 获取 Vite 环境变量 (注意：需要在 vite-env.d.ts 定义类型，否则 TS 会报错)
    // 如果是开发环境，可能需要 '/api'，生产环境是全路径
    const baseUrl = environment.VITE_API_URL;

    // 2. 判断逻辑：如果请求已经是绝对路径(http开头)，或者是加载本地资源(assets)，则跳过
    if (req.url.startsWith('http') || req.url.startsWith('/assets')) {
        return next(req);
    }

    // 3. 克隆请求并替换 URL
    // 注意处理斜杠拼接问题：确保 baseUrl 不带末尾斜杠，或者在这里处理
    const apiReq = req.clone({
        url: `${baseUrl}${req.url}`
    });

    // 4. 继续请求链
    return next(apiReq);
};