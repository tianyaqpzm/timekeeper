import { URLConfig } from '@/app/core/infrastructure/constants/url.config';
import { environment } from '@/environments/environment';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownComponent } from 'ngx-markdown';
import { Topic } from '../../core/domain/knowledge/knowledge.model';
import { AuthService } from '../../core/infrastructure/services/auth.service';
import { SidebarService } from '../../core/infrastructure/services/sidebar.service';
import { UserService } from '../../core/infrastructure/services/user.service';
import { ChatUseCase } from '../../core/use-cases/chat/chat.usecase';
import { KnowledgeUseCase } from '../../core/use-cases/knowledge/knowledge.usecase';
import { SettingsDialogComponent } from '../../shared/components/settings-dialog/settings-dialog.component';
import { CookPortalComponent } from './components/cook-portal/cook-portal.component';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog.component';
import { CitationPipe } from '../../shared/pipes/citation.pipe';


/**
 * AI 聊天主组件
 * 核心功能：
 * 1. 处理用户输入（文本、语音、文件、摄像头截图）。
 * 2. 管理会话历史与切换。
 * 3. 集成 RAG 知识库主题选择。
 * 4. 驱动流式对话展示与消息交互（编辑、重试、评分、导出）。
 * 5. 特色模式：美食助手 (Cook Mode) 自动路由。
 */
@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
        MatDialogModule,
        TranslateModule,
        MarkdownComponent,
        CookPortalComponent,
        CitationPipe
    ],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    host: {
        class: 'block h-full w-full overflow-hidden'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    private sidebarService = inject(SidebarService);
    protected get isSidebarOpen() { return this.sidebarService.isOpen; }
    protected userInput = signal('');
    protected isCookMode = signal(false);
    protected suggestions = [
        { icon: 'recommend', text: 'CHAT.SUGGESTIONS.RECOMMEND', color: 'blue' },
        { icon: 'image', text: 'CHAT.SUGGESTIONS.IMAGE', color: 'green' },
        { icon: 'restaurant', text: 'CHAT.SUGGESTIONS.COOK', color: 'orange' },
        { icon: 'school', text: 'CHAT.SUGGESTIONS.STUDY', color: 'purple' },
        { icon: 'edit', text: 'CHAT.SUGGESTIONS.WRITE', color: 'indigo' },
        { icon: 'bolt', text: 'CHAT.SUGGESTIONS.ENERGY', color: 'orange' }
    ];

    public chatUseCase = inject(ChatUseCase);
    private dialog = inject(MatDialog);
    private translate = inject(TranslateService);
    protected get messages() { return this.chatUseCase.messages; }
    protected get selectedFiles() { return this.chatUseCase.selectedFiles; }
    protected get isRecording() { return this.chatUseCase.isRecording; }
    protected get isCameraOpen() { return this.chatUseCase.isCameraOpen; }
    protected get isThinking() { return this.chatUseCase.isThinking; }
    protected get activeSessionId() { return this.chatUseCase.activeSessionId; }
    protected get chatSessions() { return this.chatUseCase.chatSessions; }

    protected get currentUser() { return this.userService.currentUser; }
    protected get topics() { return this.knowledgeUseCase.topics; }
    protected get selectedTopic() { return this.knowledgeUseCase.selectedTopic; }
    protected readonly document = document;

    // 引用悬浮窗状态
    protected citationTooltip = signal<{ id: string, x: number, y: number } | null>(null);

    // 点赞/点踩动画触发信号：跟踪最后点击索引和方向，触发的动画由组件模板绑定
    protected ratingAnimIndex = signal<number | null>(null);


    constructor(
        private knowledgeUseCase: KnowledgeUseCase,
        private userService: UserService,
        private authService: AuthService,
        private route: ActivatedRoute
    ) {
        this.watchRouteParams();
        this.loadTopics();
    }

    /**
     * 监听路由参数变化。
     * 当 sessionId 改变时加载历史记录，若无 sessionId 则重置为落地页状态。
     */
    private watchRouteParams() {
        this.route.params.subscribe(async params => {
            const sessionId = params['sessionId'];
            if (sessionId) {
                // 只有当路径中的 ID 与内存中不同时，才加载历史记录
                // 这可以防止 sendMessage 触发的跳转导致本地消息被历史记录覆盖
                if (sessionId !== this.chatUseCase.activeSessionId()) {
                    this.chatUseCase.loadHistory(sessionId);
                }
                if (this.chatSessions().length === 0) {
                    this.chatUseCase.refreshSessionsListSilently();
                }
            } else {
                // 如果没有 sessionId，则进入落地页状态，清空历史
                this.chatUseCase.activeSessionId.set('');
                this.chatUseCase.messages.set([]);
                if (this.chatSessions().length === 0) {
                    this.chatUseCase.refreshSessionsListSilently();
                }
            }
        });
    }

    /**
     * 初始化加载知识库主题列表。
     */
    private async loadTopics() {
        await this.knowledgeUseCase.refreshTopics();
    }

    /**
     * 选中一个知识库主题。
     * @param topic - 选中的主题对象或 null（取消选中）。
     */
    protected selectTopic(topic: Topic | null) {
        this.knowledgeUseCase.selectedTopicId.set(topic?.id || null);
    }

    /**
     * 切换侧边栏状态
     */
    protected toggleSidebar() {
        this.sidebarService.toggle();
    }

    /**
     * 调用 UseCase 开启新会话（导航回落地页）。
     */
    protected createNewSession() {
        this.chatUseCase.createNewSession();
        // 移动端点击后自动收起侧边栏
        if (window.innerWidth < 768) {
            this.sidebarService.setOpen(false);
        }
    }

    /**
     * 调用 UseCase 切换到指定会话。
     * @param sessionId - 目标会话 ID。
     */
    protected switchSession(sessionId: string) {
        this.chatUseCase.switchSession(sessionId);
        // 移动端点击后自动收起侧边栏
        if (window.innerWidth < 768) {
            this.sidebarService.setOpen(false);
        }
    }

    /**
     * 删除会话。
     * @param event - 点击事件。
     * @param sessionId - 会话 ID。
     */
    protected onDeleteSession(event: Event, sessionId: string) {
        event.stopPropagation(); // 阻止触发 switchSession
        
        const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
            width: '400px',
            panelClass: 'custom-dialog-container'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.chatUseCase.deleteSession(sessionId);
            }
        });
    }

    /**
     * 选择推荐建议。如果是“今天吃什么”，则开启美食模式。
     * @param suggestionKey - 建议的国际化 Key。
     */
    protected selectSuggestion(suggestionKey: string) {
        if (suggestionKey === 'CHAT.SUGGESTIONS.COOK') {
            this.isCookMode.set(true);
            // 自动选中“菜谱”知识库
            const recipeTopic = this.topics().find(t => t.name === '菜谱');
            if (recipeTopic) {
                this.selectTopic(recipeTopic);
            }
            return;
        }
        const text = this.translate.instant(suggestionKey);
        this.userInput.set(text);
    }

    /**
     * 选择菜系分类。
     * @param categoryName - 菜系名称。
     */
    protected selectCookCategory(categoryName: string) {
        this.userInput.set(`推荐几道好吃的${categoryName}`);
        this.sendMessage();
    }

    /**
     * 退出美食模式。
     */
    protected exitCookMode() {
        this.isCookMode.set(false);
    }

    /**
     * 打开设置对话框。
     */
    protected openSettings() {
        this.dialog.open(SettingsDialogComponent, {
            width: '400px',
            panelClass: ['custom-dialog-container', 'animate-fade-in-up']
        });
    }

    /**
     * 跳转至外部账号中心。
     */
    protected openAccountManagement() {
        window.open(`${environment.VITE_CASDOOR_URL}${URLConfig.EXTERNAL.CASDOOR_ACCOUNT}`, '_blank');
    }

    /**
     * 处理文件选择事件。
     * @param event - HTML Input Change 事件。
     */
    protected onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.chatUseCase.addFiles(Array.from(input.files));
            input.value = '';
        }
    }

    /**
     * 从待发送列表中移除文件。
     * @param index - 文件索引。
     */
    protected removeFile(index: number) {
        this.chatUseCase.removeFile(index);
    }

    /**
     * 切换语音录制状态。
     */
    protected toggleRecording() {
        this.chatUseCase.toggleRecording();
    }

    /**
     * 调用 UseCase 打开摄像头。
     */
    protected openCamera() {
        this.chatUseCase.openCamera(this.videoElement.nativeElement);
    }

    /**
     * 关闭当前打开的摄像头。
     */
    protected closeCamera() {
        this.chatUseCase.closeCamera();
    }

    /**
     * 捕捉摄像头画面并保存为文件。
     */
    protected capturePhoto() {
        this.chatUseCase.capturePhoto(this.videoElement.nativeElement, this.canvasElement.nativeElement);
    }

    /**
     * 判断指定索引的消息是否为该会话中最后一条用户消息。
     * 用于 UI 上显示编辑/重新生成按钮。
     * @param index - 消息索引。
     * @returns 布尔值。
     */
    protected isLastUserMessage(index: number): boolean {
        const msgs = this.messages();
        for (let i = index + 1; i < msgs.length; i++) {
            if (msgs[i].role === 'user') return false;
        }
        return true;
    }

    /**
     * 判断指定索引的消息是否导致了后续的 AI 回复失败。
     * @param index - 用户消息索引。
     * @returns 布尔值。
     */
    protected isResponseFailed(index: number): boolean {
        const msgs = this.messages();
        if (index + 1 < msgs.length) {
            const nextMsg = msgs[index + 1];
            return nextMsg.role === 'model' && nextMsg.content.startsWith('Error:');
        }
        return false;
    }

    /**
     * 复制文本到剪贴板。
     * @param text - 待复制文本。
     */
    protected copyText(text: string) {
        navigator.clipboard.writeText(text);
    }

    /**
     * 编辑指定消息。
     * @param index - 消息索引。
     */
    protected editMessage(index: number) {
        this.chatUseCase.editMessage(index, (content) => this.userInput.set(content));
    }

    /**
     * 重试发送指定消息。
     * @param index - 消息索引。
     */
    protected retryMessage(index: number) {
        this.chatUseCase.retryMessage(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

    /**
     * 停止当前消息生成。
     */
    protected stopMessage() {
        this.chatUseCase.stopMessage();
    }

    /**
     * 对 AI 回复进行点赞/点踩评分，持久化到后端。
     * @param index - 消息索引。
     * @param rating - 'good' 或 'bad'。
     */
    protected rateResponse(index: number, rating: 'good' | 'bad') {
        this.chatUseCase.rateMessage(index, rating);
        // 触发缩放脉冲动画
        this.ratingAnimIndex.set(index);
        setTimeout(() => this.ratingAnimIndex.set(null), 350);
    }

    /**
     * 重新生成上一条 AI 回复。
     * @param index - 用户消息索引。
     */
    protected regenerateResponse(index: number) {
        this.chatUseCase.regenerateResponse(index, (content) => this.userInput.set(content), () => this.sendMessage());
    }

    /**
     * 将 AI 回复内容导出为 Markdown 文件。
     * @param index - 消息索引。
     */
    protected exportResponse(index: number) {
        try {
            const content = this.messages()[index].content;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `response_${index + 1}.md`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
        }
    }

    /**
     * 发送当前输入的消息内容。
     */
    protected sendMessage(explicitValue?: string) {
        const content = explicitValue !== undefined ? explicitValue : this.userInput();
        this.chatUseCase.sendMessage(content.trim(), this.selectedTopic()?.id || null, (key) => this.translate.instant(key));
        this.userInput.set('');
    }

    /**
     * 显示引用详情悬浮窗（由 CitationPipe 生成的 HTML 触发）
     * @param event - 鼠标事件
     * @param id - 引用 ID
     */
    protected showTooltip(event: MouseEvent, id: string) {
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        
        this.citationTooltip.set({
            id,
            x: rect.left,
            y: rect.top - 10 // 在标签上方显示
        });
    }

    /**
     * 隐藏引用详情悬浮窗
     */
    protected hideTooltip() {
        this.citationTooltip.set(null);
    }

    /**
     * 处理 Markdown 区域的鼠标移入事件（事件委托）
     */
    protected onMarkdownMouseOver(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('citation-tag')) {
            const id = target.getAttribute('data-id');
            if (id) {
                this.showTooltip(event, id);
            }
        }
    }

    /**
     * 处理 Markdown 区域的鼠标移出事件
     */
    protected onMarkdownMouseOut(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('citation-tag')) {
            this.hideTooltip();
        }
    }
}
