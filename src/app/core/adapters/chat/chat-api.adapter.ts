import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ChatRepository } from '../../domain/chat/chat-repository.interface';
import { ChatMessage, ChatSessionDto } from '../../domain/chat/chat.model';
import { URLConfig } from '../../infrastructure/constants/url.config';

/**
 * 聊天会话 API 适配器实现。
 * 通过 HTTP 与后端交互，实现 ChatRepository 定义的操作。
 */
@Injectable({
    providedIn: 'root'
})
export class ChatApiAdapter implements ChatRepository {
    private http = inject(HttpClient);

    /**
     * 获取指定会话的历史消息。
     * @param sessionId - 会话 ID。
     * @returns 消息列表 Observable。
     */
    getHistory(sessionId: string): Observable<ChatMessage[]> {
        return this.http.get<any[]>(URLConfig.CHAT.HISTORY, {
            params: { sessionId }
        }).pipe(
            map(history => history.map(h => ({
                id: h.id,
                role: h.role === 'ai' ? 'model' : 'user',
                content: h.content,
                rating: h.rating ?? null
            })))
        );
    }

    /**
     * 获取所有聊天会话列表。
     * @returns 会话列表 Observable。
     */
    getSessions(): Observable<ChatSessionDto[]> {
        return this.http.get<ChatSessionDto[]>(URLConfig.CHAT.SESSIONS).pipe(
            catchError(() => of([]))
        );
    }

    /**
     * 删除指定会话。
     * @param sessionId - 要删除的会话 ID。
     * @returns 操作结果 Observable。
     */
    deleteSession(sessionId: string): Observable<void> {
        return this.http.delete<void>(`${URLConfig.CHAT.SESSIONS}/${sessionId}`);
    }

    /**
     * 对消息进行评分。
     * @param messageId - 后端消息 ID。
     * @param sessionId - 会话 ID。
     * @param rating - 评分: 'good', 'bad', 或 null (取消评分)。
     * @returns 操作结果 Observable。
     */
    rateMessage(messageId: number, sessionId: string, rating: 'good' | 'bad' | null): Observable<void> {
        return this.http.post<void>(URLConfig.CHAT.RATING(messageId), { rating });
    }

    /**
     * 发送流式消息。
     * @param sessionId - 会话 ID。
     * @param message - 用户消息内容。
     * @param topicId - 知识库主题 ID（可选）。
     * @returns 流式响应内容 Observable (字符串或包含 sources 的对象)。
     */
    sendMessageStream(sessionId: string, message: string, topicId: string | null): Observable<string | { content?: string, sources?: any[], messageId?: number }> {
        return new Observable<string | { content?: string, sources?: any[], messageId?: number }>(observer => {
            let lastProcessedIndex = 0;
            let lineBuffer = '';

            const subscription = this.http.post(
                URLConfig.CHAT.AGENT_CHAT,
                {
                    session_id: sessionId,
                    message: message,
                    topic_id: topicId || null
                },
                {
                    observe: 'events',
                    responseType: 'text',
                    reportProgress: true
                }
            ).subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response) {
                        const currentFullText = (event as any).partialText || (event as any).body || '';
                        if (currentFullText.length > lastProcessedIndex) {
                            const newText = currentFullText.substring(lastProcessedIndex);
                            lastProcessedIndex = currentFullText.length;
                            
                            // 拼接到缓冲区
                            lineBuffer += newText;
                            
                            // 按换行符切分，处理完整行
                            const lines = lineBuffer.split('\n');
                            // 最后一部分可能是不完整的行，保留在缓冲区
                            lineBuffer = lines.pop() || '';
                            
                            for (const line of lines) {
                                this.processLine(line, observer);
                            }
                        }
                    }
                },
                error: (err) => {
                    observer.error(err);
                },
                complete: () => {
                    // 处理最后剩余的内容
                    if (lineBuffer) {
                        this.processLine(lineBuffer, observer);
                    }
                }
            });

            return () => subscription.unsubscribe();
        });
    }

    /**
     * 处理单行 SSE 数据。
     */
    private processLine(line: string, observer: any) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
                observer.complete();
                return;
            }
            try {
                const parsed = JSON.parse(data);
                // 如果包含 content，发送 content
                if (parsed.content) {
                    observer.next(parsed.content);
                }
                // 如果包含 sources，发送整个对象供 UseCase 识别
                if (parsed.sources) {
                    observer.next({ sources: parsed.sources });
                }
                // 如果包含 messageId，发送给 UseCase
                if (parsed.messageId) {
                    observer.next({ messageId: parsed.messageId });
                }
            } catch (e) {
                // 忽略解析错误
            }
        }
    }
}
