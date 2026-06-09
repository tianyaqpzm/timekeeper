import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AiDevTask, AiDevChatMessage, AiDevAgentProfile, TokenSummary } from '../domain/ai-dev.model';
import { AiDevRepository } from '../adapter/ai-dev.repository';

@Injectable({
  providedIn: 'root'
})
export class AiDevUseCase {
  
  public readonly tasks = signal<AiDevTask[]>([]);
  public readonly currentMessages = signal<AiDevChatMessage[]>([]);
  public readonly agentProfiles = signal<AiDevAgentProfile[]>([]);
  public readonly tokenSummary = signal<TokenSummary | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);
  
  private sseEventSource: EventSource | null = null;

  // ms-ai-devops 相关的配置与连接状态
  public readonly msAiDevopsPath = signal<string>('/Users/pei/projects/ms-ai-devops');
  public readonly msAiDevopsUrl = signal<string>('http://localhost:9000');
  public readonly devopsConnectionStatus = signal<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');

  constructor(private repository: AiDevRepository) {
    const savedPath = localStorage.getItem('ms-ai-devops-path');
    const savedUrl = localStorage.getItem('ms-ai-devops-url');
    if (savedPath) {
      this.msAiDevopsPath.set(savedPath);
    }
    if (savedUrl) {
      this.msAiDevopsUrl.set(savedUrl);
    }
  }

  async loadTasks(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.repository.getTasks());
      this.tasks.set(result);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load tasks');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadProfiles(): Promise<void> {
    try {
      const profiles = await firstValueFrom(this.repository.getProfiles());
      this.agentProfiles.set(profiles);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load agent profiles');
    }
  }

  async updateProfile(roleName: string, profile: Partial<AiDevAgentProfile>): Promise<void> {
    try {
      await firstValueFrom(this.repository.updateProfile(roleName, profile));
      await this.loadProfiles();
    } catch (err: any) {
      this.error.set(err.message || 'Failed to update agent profile');
      throw err;
    }
  }

  async loadMessages(taskId: string): Promise<void> {
    try {
      const messages = await firstValueFrom(this.repository.getChatMessages(taskId));
      this.currentMessages.set(messages);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load messages');
    }
  }

  async loadTokenSummary(taskId: string): Promise<void> {
    try {
      const summary = await firstValueFrom(this.repository.getTokenSummary(taskId));
      this.tokenSummary.set(summary);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load token summary');
    }
  }

  connectSseStream(taskId: string): void {
    this.disconnectSseStream(); // ensure clean state
    
    // Load initial data
    this.loadTokenSummary(taskId);
    
    // Hardcoded URL format based on current API path
    const url = `/rest/biz/v1/ai-dev/tasks/${taskId}/messages/stream`;
    this.sseEventSource = new EventSource(url);
    
    this.sseEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.eventType === 'CHAT_CHUNK') {
          const p = data.payload;
          if (p.isFirst) {
            const newMsg: AiDevChatMessage = {
              id: 'tmp-' + Date.now(),
              taskId: data.taskId,
              senderRole: p.senderRole,
              content: p.chunk || '',
              createTime: new Date().toISOString()
            };
            this.currentMessages.update(msgs => [...msgs, newMsg]);
          } else {
            this.currentMessages.update(msgs => {
              const newMsgs = [...msgs];
              const last = newMsgs[newMsgs.length - 1];
              if (last && last.senderRole === p.senderRole) {
                last.content += p.chunk || '';
              }
              return newMsgs;
            });
          }
        } else if (data.eventType === 'CHAT_COMPLETED' || data.eventType === 'CHAT_REPLY') {
          this.loadMessages(taskId);
        } else if (data.eventType === 'TASK_COMPLETED' || data.eventType === 'ERROR') {
          this.loadTasks();
        } else if (data.eventType === 'TOKEN_USAGE') {
          const p = data.payload;
          this.tokenSummary.update(curr => {
            if (!curr) return curr;
            const updated = { ...curr, phases: [...curr.phases] };
            updated.totalPromptTokens += p.promptTokens || 0;
            updated.totalCompletionTokens += p.compTokens || 0;
            updated.totalCost += p.cost || 0;
            updated.totalDurationMs += p.durationMs || 0;
            
            const phaseIndex = updated.phases.findIndex(m => m.phase === p.actionType && m.agentRole === p.agentRole);
            if (phaseIndex >= 0) {
               updated.phases[phaseIndex] = {
                 ...updated.phases[phaseIndex],
                 promptTokens: updated.phases[phaseIndex].promptTokens + (p.promptTokens || 0),
                 completionTokens: updated.phases[phaseIndex].completionTokens + (p.compTokens || 0),
                 cost: updated.phases[phaseIndex].cost + (p.cost || 0),
                 durationMs: updated.phases[phaseIndex].durationMs + (p.durationMs || 0),
                 callCount: updated.phases[phaseIndex].callCount + 1
               };
            } else {
               updated.phases.push({
                 phase: p.actionType,
                 agentRole: p.agentRole,
                 promptTokens: p.promptTokens || 0,
                 completionTokens: p.compTokens || 0,
                 cost: p.cost || 0,
                 durationMs: p.durationMs || 0,
                 callCount: 1
               });
            }
            return updated;
          });
        }
      } catch (e) {
        console.error('Error parsing SSE event data', e);
      }
    };
    
    this.sseEventSource.onerror = (err) => {
      console.error('SSE Error', err);
      // EventSource automatically reconnects
    };
  }

  disconnectSseStream(): void {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
    }
  }

  /**
   * 创建新任务，初始状态 PENDING，由 ms-ai-devops 常驻服务自动拾取执行。
   * @param description 自然语言任务描述
   * @param relatedWorkspaces 相关项目列表
   */
  async createTask(description: string, relatedWorkspaces: string[]): Promise<void> {
    try {
      await firstValueFrom(this.repository.createTask(description, relatedWorkspaces));
      await this.loadTasks();
    } catch (err: any) {
      this.error.set(err.message || 'Failed to create task');
    }
  }

  async sendMessage(taskId: string, content: string): Promise<void> {
    try {
      const newMessage = await firstValueFrom(this.repository.addChatMessage(taskId, content));
      this.currentMessages.update(msgs => [...msgs, newMessage]);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to send message');
    }
  }

  async resumeTaskWithFeedback(taskId: string, feedback: string): Promise<void> {
    try {
      // First, add the human message to the DB
      await this.sendMessage(taskId, feedback);
      
      // Then, trigger resume with feedback
      await firstValueFrom(this.repository.resumeTask(taskId, feedback));
      await this.loadTasks(); // refresh after resume
    } catch (err: any) {
      this.error.set(err.message || 'Failed to resume task with feedback');
    }
  }

  async resumeTask(taskId: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.resumeTask(taskId));
      await this.loadTasks(); // refresh after resume
    } catch (err: any) {
      this.error.set(err.message || 'Failed to resume task');
    }
  }

  async rollbackTask(taskId: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.rollbackTask(taskId));
      await this.loadTasks(); // refresh after rollback
    } catch (err: any) {
      this.error.set(err.message || 'Failed to rollback task');
    }
  }

  async reopenTask(taskId: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.reopenTask(taskId));
      await this.loadTasks(); // refresh after reopen
    } catch (err: any) {
      this.error.set(err.message || 'Failed to reopen task');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.deleteTask(taskId));
      await this.loadTasks(); // refresh after delete
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete task');
    }
  }

  /**
   * 更新任务的头脑风暴配置参数并刷新任务列表。
   * @param taskId 任务 ID
   * @param maxBrainstormingRounds 最大讨论轮数
   * @param contextSlidingWindow 滑动窗口历史条数
   */
  async updateTaskConfig(taskId: string, maxBrainstormingRounds: number, contextSlidingWindow: number): Promise<void> {
    try {
      await firstValueFrom(this.repository.updateTaskConfig(taskId, maxBrainstormingRounds, contextSlidingWindow));
      await this.loadTasks();
    } catch (err: any) {
      this.error.set(err.message || 'Failed to update task config');
    }
  }

  updateDevopsConfig(path: string, url: string): void {
    this.msAiDevopsPath.set(path);
    this.msAiDevopsUrl.set(url);
    localStorage.setItem('ms-ai-devops-path', path);
    localStorage.setItem('ms-ai-devops-url', url);
    this.checkDevopsConnection();
  }

  async checkDevopsConnection(): Promise<void> {
    this.devopsConnectionStatus.set('CONNECTING');
    try {
      await firstValueFrom(this.repository.checkHealth(this.msAiDevopsUrl()));
      this.devopsConnectionStatus.set('CONNECTED');
    } catch (err) {
      this.devopsConnectionStatus.set('DISCONNECTED');
    }
  }
}
