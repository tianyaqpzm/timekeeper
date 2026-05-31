import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URLConfig } from '../../../core/infrastructure/constants/url.config';
import { AiDevTask, AiDevChatMessage } from '../domain/ai-dev.model';

@Injectable({
  providedIn: 'root'
})
export class AiDevRepository {
  constructor(private http: HttpClient) {}

  getTasks(): Observable<AiDevTask[]> {
    return this.http.get<AiDevTask[]>(URLConfig.AI_DEV.TASKS);
  }

  /** 创建新任务，由 ms-ai-devops 常驻服务自动拾取执行 */
  createTask(description: string): Observable<AiDevTask> {
    return this.http.post<AiDevTask>(URLConfig.AI_DEV.TASKS, { description });
  }

  resumeTask(taskId: string, feedback?: string): Observable<void> {
    const body = feedback ? { content: feedback } : {};
    return this.http.post<void>(URLConfig.AI_DEV.RESUME(taskId), body);
  }

  rollbackTask(taskId: string): Observable<void> {
    return this.http.post<void>(URLConfig.AI_DEV.ROLLBACK(taskId), {});
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${URLConfig.AI_DEV.TASKS}/${taskId}`);
  }

  getChatMessages(taskId: string): Observable<AiDevChatMessage[]> {
    return this.http.get<AiDevChatMessage[]>(`${URLConfig.AI_DEV.TASKS}/${taskId}/messages`);
  }

  addChatMessage(taskId: string, content: string): Observable<AiDevChatMessage> {
    return this.http.post<AiDevChatMessage>(`${URLConfig.AI_DEV.TASKS}/${taskId}/messages`, { content });
  }
}
