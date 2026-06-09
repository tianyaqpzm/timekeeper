/**
 * 聊天引用来源接口。
 */
export interface ChatSource {
    /** 文档标题 */
    title: string;
    /** 文档链接（可选） */
    url?: string;
    /** 文档摘要/片段 */
    snippet?: string;
}

/**
 * 聊天消息接口。
 */
export interface ChatMessage {
    /** 后端消息 ID（可选，用于评分） */
    id?: number;
    /** 角色：用户或模型 */
    role: 'user' | 'model';
    /** 消息内容 */
    content: string;
    /** 引用来源（可选） */
    sources?: ChatSource[];
    /** 用户评价: good (点赞) / bad (点踩) / null/undefined (未评价) */
    rating?: 'good' | 'bad' | null;
}

/**
 * 聊天会话 DTO 接口。
 */
export interface ChatSessionDto {
    /** 会话唯一标识符 */
    sessionId: string;
    /** 会话标题 */
    title: string;
    /** 最后活跃时间 */
    lastActiveTime: string;
}

/**
 * 聊天状态接口。
 */
export interface ChatState {
    /** 消息列表 */
    messages: ChatMessage[];
    /** 当前活动会话 ID */
    activeSessionId: string;
    /** 会话列表 */
    chatSessions: ChatSessionDto[];
    /** 是否正在思考 */
    isThinking: boolean;
    /** 是否正在录音 */
    isRecording: boolean;
    /** 是否正在开启摄像头 */
    isCameraOpen: boolean;
    /** 已选择的文件列表 */
    selectedFiles: File[];
}
