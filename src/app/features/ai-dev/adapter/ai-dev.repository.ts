import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URLConfig } from '../../../core/infrastructure/constants/url.config';
import { AiDevTask, AiDevChatMessage, AiDevAgentProfile } from '../domain/ai-dev.model';

@Injectable({
  providedIn: 'root'
})
export class AiDevRepository {
  constructor(private http: HttpClient) {}

  getTasks(): Observable<AiDevTask[]> {
    return this.http.get<AiDevTask[]>(URLConfig.AI_DEV.TASKS);
  }

  getProfiles(): Observable<AiDevAgentProfile[]> {
    return this.http.get<AiDevAgentProfile[]>(URLConfig.AI_DEV.PROFILES);
  }

  updateProfile(roleName: string, profile: Partial<AiDevAgentProfile>): Observable<AiDevAgentProfile> {
    return this.http.put<AiDevAgentProfile>(`${URLConfig.AI_DEV.PROFILES}/${roleName}`, profile);
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

  /**
   * 更新任务的头脑风暴配置参数
   * @param taskId 任务 ID
   * @param maxBrainstormingRounds 最大讨论轮数
   * @param contextSlidingWindow 滑动窗口历史条数
   */
  updateTaskConfig(taskId: string, maxBrainstormingRounds: number, contextSlidingWindow: number): Observable<void> {
    return this.http.put<void>(URLConfig.AI_DEV.CONFIG(taskId), { maxBrainstormingRounds, contextSlidingWindow });
  }

  /** 健康检查本地 ms-ai-devops 服务连接 */
  checkHealth(url: string): Observable<any> {
    return this.http.get<any>(`${url}/health`);
  }
}
