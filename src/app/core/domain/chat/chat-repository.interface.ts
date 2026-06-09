import { Observable } from 'rxjs';
import { ChatMessage, ChatSessionDto } from './chat.model';

/**
 * 聊天会话仓储接口。
 * 定义与聊天相关的各种数据交互操作。
 */
export interface ChatRepository {
    /**
     * 获取指定会话的历史消息。
     * @param sessionId - 会话 ID。
     * @returns 消息列表 Observable。
     */
    getHistory(sessionId: string): Observable<ChatMessage[]>;

    /**
     * 获取所有聊天会话列表。
     * @returns 会话列表 Observable。
     */
    getSessions(): Observable<ChatSessionDto[]>;

    /**
     * 发送流式消息。
     * @param sessionId - 会话 ID。
     * @param message - 用户消息内容。
     * @param topicId - 知识库主题 ID（可选）。
     * @returns 流式响应内容 Observable。
     */
    sendMessageStream(sessionId: string, message: string, topicId: string | null): Observable<string | { content?: string, sources?: any[], messageId?: number }>;

    /**
     * 删除指定会话。
     * @param sessionId - 要删除的会话 ID。
     * @returns 操作结果 Observable。
     */
    deleteSession(sessionId: string): Observable<void>;

    /**
     * 对消息进行评分。
     * @param messageId - 后端消息 ID。
     * @param sessionId - 会话 ID。
     * @param rating - 评分: 'good', 'bad', 或 null (取消评分)。
     * @returns 操作结果 Observable。
     */
    rateMessage(messageId: number, sessionId: string, rating: 'good' | 'bad' | null): Observable<void>;
}
