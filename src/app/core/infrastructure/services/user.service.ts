import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    public currentUser = signal<UserProfile | null>(null);

    constructor(private http: HttpClient, private authService: AuthService) {}

    /**
     * 系统初始化时调用。
     * 负责从 URL 提取 Token（如果存在），并根据本地 Token 加载用户信息。
     * @returns 初始化完成的 Promise。
     */
    async initialize(): Promise<void> {
        // 1. 如果 URL 里携带了 token，先提取并保存
        const extracted = this.authService.extractTokenFromUrl();
        if (extracted) {
            console.log('【UserService】Token extracted during initialization');
        }

        // 2. 如果本地有 token，尝试获取用户信息
        if (this.authService.hasToken()) {
            try {
                const user = await this.getCurrentUser();
                this.currentUser.set(user);
            } catch (e) {
                console.error('Initial user fetch failed', e);
                // 如果获取失败（如 token 过期），清除 token
                this.authService.removeToken();
            }
        }
    }

    /**
     * 从后端接口获取当前登录用户的个人资料。
     * @returns 包含 UserProfile 的 Promise。
     */
    async getCurrentUser(): Promise<UserProfile> {
        return await firstValueFrom(
            this.http.get<UserProfile>('/rest/biz/v1/user/me')
        );
    }
}
