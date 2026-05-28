/**
 * 阅后即焚房间元信息
 */
export interface EphemeralRoom {
  roomId: string;
  shortCode: string;
  title: string;
  expireAt: string; // ISO-8601 offset datetime
  participantCount: number;
}

/**
 * 阅后即焚加密消息
 */
export interface EphemeralMessage {
  id?: number;
  roomId: string;
  senderId: string;
  cipherText: string;
  iv: string;
  sentAt?: string;
  deleted?: boolean;
}

/**
 * 前端展示用的消息领域模型（解密后）
 */
export interface DecryptedMessage {
  id?: number;
  roomId: string;
  senderId: string;
  plainText: string;
  sentAt?: string;
  isSelf: boolean;
  isSystem?: boolean; // 用于展示系统通知，如“XXX 加入了房间”
}

/**
 * 创建房间请求
 */
export interface CreateRoomRequest {
  title: string;
  ttlSeconds: number;
  createdBy: string;
}

/**
 * 创建房间响应
 */
export interface CreateRoomResponse {
  roomId: string;
  shortCode: string;
}

/**
 * 加入房间请求
 */
export interface JoinRoomRequest {
  participantId: string;
  nicknameCipher?: string;
}

/**
 * 发送加密消息请求
 */
export interface SendMessageRequest {
  senderId: string;
  cipherText: string;
  iv: string;
}

/**
 * WebSocket 消息类型
 */
export enum WsMessageType {
  MSG_CIPHER = 'MSG_CIPHER',
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  DESTROY = 'DESTROY',
  HEARTBEAT = 'HEARTBEAT'
}

/**
 * WebSocket 消息体
 */
export interface WsMessage {
  type: WsMessageType;
  senderId: string;
  payload: string; // cipherText or event payload (e.g. participantId or roomId)
  iv: string;
}
