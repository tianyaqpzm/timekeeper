import { ChangeDetectionStrategy, Component, OnInit, signal, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '@/environments/environment';
import { URLConfig } from '@/app/core/infrastructure/constants/url.config';
import { ThemeService } from '../../../core/infrastructure/services/theme.service';
import { UserService } from '../../../core/infrastructure/services/user.service';
import { LanguageService } from '../../../core/infrastructure/services/language.service';
import { AuthService } from '../../../core/infrastructure/services/auth.service';
import { SidebarService } from '../../../core/infrastructure/services/sidebar.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';

@Component({
    selector: 'ms-header',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
        TranslateModule,
        MatDialogModule
    ],
    templateUrl: './ms-header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MsHeaderComponent implements OnInit {
    private themeService = inject(ThemeService);
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private languageService = inject(LanguageService);
    private dialog = inject(MatDialog);
    private sidebarService = inject(SidebarService);

    protected navItems = [
        { label: 'NAV.CHAT', icon: 'chat_bubble', path: '/chat', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
        { label: 'NAV.AI_DEV', icon: 'rocket_launch', path: '/ai-dev', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30' },
        { label: 'NAV.KNOWLEDGE', icon: 'auto_stories', path: '/knowledge', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
        { label: 'NAV.PROMPT', icon: 'terminal', path: '/prompt', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
        { label: 'NAV.MCP_MARKET', icon: 'extension', path: '/mcp-market', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
        { label: 'NAV.DASHBOARD', icon: 'timer', path: '/countdown/dashboard', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' },
        { label: 'NAV.NOTICE_BOARD', icon: 'campaign', path: '/notice-board', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/30' },
    ];

    /** 外部控制显示隐藏 */
    visible = input<boolean>(true);

    /** 黑名单：匹配则隐藏 */
    blackList = input<string[]>([]);

    protected currentUser = computed(() => this.userService.currentUser());
    protected isDarkMode = computed(() => this.themeService.isDarkMode());
    protected currentLang = computed(() => this.languageService.currentLang());
    
    /** 当前路由状态 */
    protected currentUrl = signal('');
    protected showSidebarToggle = computed(() => {
        const url = this.currentUrl();
        return url.includes('/chat') || url.includes('/knowledge') || url.includes('/countdown/dashboard');
    });

    /** 综合判断是否显示 */
    protected shouldShow = computed(() => {
        const isVisible = this.visible();
        const url = this.currentUrl();
        const inBlackList = this.blackList().some(pattern => url.includes(pattern));
        
        return isVisible && !inBlackList;
    });

    protected navigateTo(path: string) {
        this.router.navigate([path]);
    }

    protected toggleSidebar() {
        this.sidebarService.toggle();
    }

    protected isSidebarOpen() {
        return this.sidebarService.isOpen();
    }

    protected readonly document = document;

    ngOnInit() {
        // 初始路由
        this.currentUrl.set(this.router.url);
        // 监听路由变化
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            this.currentUrl.set(e.urlAfterRedirects || e.url);
        });
    }

    protected toggleTheme() {
        this.themeService.toggleTheme();
    }

    protected toggleLanguage() {
        this.languageService.toggleLanguage();
    }

    protected setLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    /**
     * 打开设置对话框
     */
    protected openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: '400px',
            panelClass: ['custom-dialog-container', 'animate-fade-in-up']
        });
    }

    /**
     * 跳转至外部账号中心
     */
    protected openAccountManagement() {
        window.open(`${environment.VITE_CASDOOR_URL}${URLConfig.EXTERNAL.CASDOOR_ACCOUNT}`, '_blank');
    }

    /**
     * 执行退出登录
     */
    protected logout() {
        this.authService.logout();
    }
}
