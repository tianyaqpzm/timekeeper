import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AiDevTask, AiDevChatMessage } from '../domain/ai-dev.model';
import { AiDevRepository } from '../adapter/ai-dev.repository';

@Injectable({
  providedIn: 'root'
})
export class AiDevUseCase {
  
  public readonly tasks = signal<AiDevTask[]>([]);
  public readonly currentMessages = signal<AiDevChatMessage[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  constructor(private repository: AiDevRepository) {}

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

  async loadMessages(taskId: string): Promise<void> {
    try {
      const messages = await firstValueFrom(this.repository.getChatMessages(taskId));
      this.currentMessages.set(messages);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load messages');
    }
  }

  /**
   * 创建新任务，初始状态 PENDING，由 ms-ai-devops 常驻服务自动拾取执行。
   * @param description 自然语言任务描述
   */
  async createTask(description: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.createTask(description));
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

  async deleteTask(taskId: string): Promise<void> {
    try {
      await firstValueFrom(this.repository.deleteTask(taskId));
      await this.loadTasks(); // refresh after delete
    } catch (err: any) {
      this.error.set(err.message || 'Failed to delete task');
    }
  }
}
