import { Component, OnInit, Signal, inject, DestroyRef, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { AiDevUseCase } from '../../application/ai-dev.usecase';
import { AiDevChatMessage, AiDevAgentProfile, AiDevTaskStatus } from '../../domain/ai-dev.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { AgentProfileDialogComponent } from './agent-profile-dialog.component';
import { TaskTimelineComponent } from '../task-timeline/task-timeline.component';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarService } from '../../../../core/infrastructure/services/sidebar.service';
import { TaskDetailDialogComponent } from './task-detail-dialog.component';
import { TaskConfigDialogComponent } from './task-config-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../../../core/infrastructure/services/auth.service';
import { UserService } from '../../../../core/infrastructure/services/user.service';
import { DeleteConfirmDialogComponent } from '../../../chat/delete-confirm-dialog.component';

@Component({
  selector: 'app-ai-dev-chat',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatIconModule, 
    MatInputModule, 
    MatSliderModule,
    MarkdownModule, 
    TextFieldModule, 
    TranslateModule,
    TaskTimelineComponent
  ],
  templateUrl: './ai-dev-chat.component.html',
  styleUrl: './ai-dev-chat.component.css'
})
export class AiDevChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private useCase = inject(AiDevUseCase);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private sidebarService = inject(SidebarService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  public userService = inject(UserService);
  
  taskId: string = '';
  messages: Signal<AiDevChatMessage[]>;
  profiles: Signal<AiDevAgentProfile[]>;
  newMessage: string = '';

  selectedNode: AiDevAgentProfile | null = null;
  
  showMentionSuggestions = false;
  mentionSearchQuery = '';
  selectedMentionIndex = 0;

  protected get isSidebarOpen() { return this.sidebarService.isOpen; }

  currentTask = computed(() => this.useCase.tasks().find(t => t.id === this.taskId));

  displayProfiles = computed(() => {
    const task = this.currentTask();
    const allProfiles = this.profiles();
    
    if (task && task.assignedRoles && task.assignedRoles.length > 0) {
      return allProfiles.filter(p => task.assignedRoles!.includes(p.roleName));
    }
    
    return [];
  });

  isReadOnly = computed(() => {
    const task = this.currentTask();
    if (!task) return false;
    return task.status === AiDevTaskStatus.COMPLETED ||
           task.status === AiDevTaskStatus.ROLLED_BACK ||
           task.status === AiDevTaskStatus.FAILED;
  });

  currentUserName = computed(() => {
    return this.userService.currentUser()?.name || 'HUMAN';
  });

  /** 头脑风暴配置 Slider 本地状态，随 currentTask 同步初始化 */
  brainstormRounds = 5;
  contextWindow = 3;

  expandedMessageIds = new Set<string>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private isNearBottom = true;

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  openTaskDetails() {
    const task = this.currentTask();
    if (task) {
      this.dialog.open(TaskDetailDialogComponent, {
        data: task,
        width: '600px',
        panelClass: ['custom-dialog-container', 'animate-fade-in-up']
      });
    }
  }

  constructor() {
    this.messages = this.useCase.currentMessages;
    this.profiles = this.useCase.agentProfiles;
    
    // 当 currentTask 加载完毕时，同步 Slider 初始值
    effect(() => {
      const task = this.currentTask();
      if (task) {
        this.brainstormRounds = task.maxBrainstormingRounds ?? 5;
        this.contextWindow = task.contextSlidingWindow ?? 3;
      }
    });

    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const msgs = this.messages();
      if (msgs && msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  toggleExpand(id: string) {
    if (this.expandedMessageIds.has(id)) {
      this.expandedMessageIds.delete(id);
    } else {
      this.expandedMessageIds.add(id);
    }
  }

  async copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      // Optional: add a tiny snackbar or notification here if needed
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  onScroll(event: Event) {
    const target = event.target as HTMLElement;
    const threshold = 150;
    const position = target.scrollTop + target.clientHeight;
    const height = target.scrollHeight;
    this.isNearBottom = position > height - threshold;
  }

  scrollToBottom(force = false): void {
    try {
      if (this.scrollContainer && (this.isNearBottom || force)) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('taskId');
      if (id) {
        this.taskId = id;
        this.useCase.loadMessages(this.taskId);
        this.useCase.loadProfiles(this.taskId);
        this.useCase.loadTasks();
        
        // Auto select first node
        if (this.profiles().length > 0) {
          this.selectedNode = this.profiles()[0];
        }

        // Connect to SSE stream
        this.useCase.connectSseStream(this.taskId);

        this.destroyRef.onDestroy(() => {
          this.useCase.disconnectSseStream();
        });
      }
    });
  }

  selectNode(node: AiDevAgentProfile) {
    this.selectedNode = node;
  }

  configureRole(node: AiDevAgentProfile, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AgentProfileDialogComponent, {
      data: node,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.useCase.updateProfile(node.roleName, result, this.taskId);
      }
    });
  }

  addNewRole() {
    const dialogRef = this.dialog.open(AgentProfileDialogComponent, {
      data: {
        roleName: '',
        avatar: 'smart_toy',
        modelName: 'gemini-1.5-pro',
        systemPrompt: ''
      } as AiDevAgentProfile,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && result.roleName) {
        try {
          // 1. 创建或更新底层的 AI 角色配置
          await this.useCase.updateProfile(result.roleName, result, this.taskId);
          
          // 2. 将此新角色的 roleName 加入当前会话的角色分配列表中并同步
          const taskVal = this.currentTask();
          if (taskVal) {
            const currentRoles = taskVal.assignedRoles || [];
            if (!currentRoles.includes(result.roleName)) {
              const updatedRoles = [...currentRoles, result.roleName];
              await this.useCase.updateTaskAssignedRoles(this.taskId, updatedRoles);
            }
          }
        } catch (err) {
          console.error('Failed to create and assign new role:', err);
        }
      }
    });
  }

  removeRole(node: AiDevAgentProfile, event: Event) {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: {
        title: '移除 AI 角色',
        message: `确定要从本次会话中移除 AI 角色 "${node.roleName}" 吗？`
      },
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(async confirm => {
      if (confirm) {
        const taskVal = this.currentTask();
        if (taskVal) {
          const currentRoles = taskVal.assignedRoles || [];
          const updatedRoles = currentRoles.filter(role => role !== node.roleName);
          try {
            await this.useCase.updateTaskAssignedRoles(this.taskId, updatedRoles);
            
            // 若被删除角色正好被选中，重置选中状态
            if (this.selectedNode?.id === node.id) {
              const remaining = this.displayProfiles();
              this.selectedNode = remaining.length > 0 ? remaining[0] : null;
            }
          } catch (err) {
            console.error('Failed to remove role from task:', err);
          }
        }
      }
    });
  }

  highlightMentions(content: any): any {
    if (!content) return content;
    let text = '';
    let isSafe = false;
    if (typeof content === 'string') {
      text = content;
    } else if (content && typeof content === 'object' && 'changingThisBreaksApplicationSecurity' in content) {
      text = content.changingThisBreaksApplicationSecurity;
      isSafe = true;
    } else {
      text = String(content);
    }

    const highlighted = text.replace(/@([a-zA-Z0-9_-]+)/g, (match, name) => {
      return `<span class="text-blue-600 dark:text-blue-400 font-medium bg-blue-100/60 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md mx-0.5 cursor-pointer hover:bg-blue-200/60 dark:hover:bg-blue-800/60 transition-colors">@${name}</span>`;
    });

    return isSafe ? this.sanitizer.bypassSecurityTrustHtml(highlighted) : highlighted;
  }

  filteredAgents(): AiDevAgentProfile[] {
    const query = this.mentionSearchQuery.toLowerCase();
    // Restrict mentions to only the AI roles assigned to the current task
    return this.displayProfiles().filter(p => p.roleName.toLowerCase().includes(query));
  }

  onInput(event: any) {
    const input = event.target as HTMLTextAreaElement;
    const cursor = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursor);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    if (match) {
      this.showMentionSuggestions = true;
      this.mentionSearchQuery = match[1];
      this.selectedMentionIndex = 0;
    } else {
      this.showMentionSuggestions = false;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.showMentionSuggestions) {
      const agents = this.filteredAgents();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedMentionIndex = (this.selectedMentionIndex + 1) % Math.max(agents.length, 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedMentionIndex = (this.selectedMentionIndex - 1 + agents.length) % Math.max(agents.length, 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (agents.length > 0) {
          this.selectMention(agents[this.selectedMentionIndex]);
        }
      } else if (event.key === 'Escape') {
        this.showMentionSuggestions = false;
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectMention(agent: AiDevAgentProfile) {
    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    const cursor = inputElement ? (inputElement.selectionStart || this.newMessage.length) : this.newMessage.length;
    const textBeforeCursor = this.newMessage.substring(0, cursor);
    const textAfterCursor = this.newMessage.substring(cursor);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    
    if (match) {
      const replaceStart = textBeforeCursor.substring(0, textBeforeCursor.length - match[0].length + (match[0].startsWith(' ') || match[0].startsWith('\n') ? 1 : 0));
      this.newMessage = `${replaceStart}@${agent.roleName} ${textAfterCursor}`;
      
      this.showMentionSuggestions = false;
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          const newCursorPos = replaceStart.length + agent.roleName.length + 2;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    } else {
      this.showMentionSuggestions = false;
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.taskId) {
      this.useCase.sendMessage(this.taskId, this.newMessage);
      this.newMessage = '';
      this.showMentionSuggestions = false;
      this.scrollToBottom(true);
    }
  }

  approve() {
    const feedback = this.newMessage.trim() || 'Approved to proceed.';
    if (this.taskId) {
      this.useCase.resumeTaskWithFeedback(this.taskId, feedback);
      this.newMessage = '';
    }
  }

  canApprove(): boolean {
    const task = this.currentTask();
    return !!task && (task.status === AiDevTaskStatus.WAITING_ON_APPROVAL || task.status === AiDevTaskStatus.WAITING_RESUME);
  }

  closePage() {
    window.close();
  }

  /**
   * 当用户调整头脑风暴配置 Slider 时触发，将最新值持久化到后端。
   */
  onConfigChange() {
    if (this.taskId) {
      this.useCase.updateTaskConfig(this.taskId, this.brainstormRounds, this.contextWindow);
    }
  }

  openTaskConfig() {
    const dialogRef = this.dialog.open(TaskConfigDialogComponent, {
      data: {
        brainstormRounds: this.brainstormRounds,
        contextWindow: this.contextWindow,
        isReadOnly: this.isReadOnly()
      },
      width: '400px',
      panelClass: ['custom-dialog-container', 'animate-fade-in-up']
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.brainstormRounds = result.brainstormRounds;
        this.contextWindow = result.contextWindow;
        this.onConfigChange();
      }
    });
  }

  hasGithubIssue(): boolean {
    const task = this.currentTask();
    return !!(task && task.relatedIssues && task.relatedIssues.trim().length > 0);
  }

  pushToGithub(message: AiDevChatMessage) {
    if (this.taskId && message && message.id) {
      this.useCase.pushMessageToGithub(this.taskId, message.id);
    }
  }
}



