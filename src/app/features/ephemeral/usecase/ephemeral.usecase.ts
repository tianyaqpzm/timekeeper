import { Injectable, computed, inject, signal } from '@angular/core';
import { EphemeralAdapter } from '../infrastructure/ephemeral.adapter';
import { EphemeralCrypto } from './ephemeral.crypto';
import { 
  DecryptedMessage, 
  EphemeralMessage, 
  EphemeralRoom, 
  WsMessage, 
  WsMessageType 
} from '../domain/ephemeral.model';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EphemeralUseCase {
  private adapter = inject(EphemeralAdapter);

  // --- State (Signals) ---
  private _room = signal<EphemeralRoom | null>(null);
  private _messages = signal<DecryptedMessage[]>([]);
  private _isJoined = signal<boolean>(false);
  private _isDestroyed = signal<boolean>(false);
  private _isPasswordValid = signal<boolean>(false);

  // 暴露给 UI 的只读 Signals
  public readonly room = computed(() => this._room());
  public readonly messages = computed(() => this._messages());
  public readonly isJoined = computed(() => this._isJoined());
  public readonly isDestroyed = computed(() => this._isDestroyed());
  public readonly isPasswordValid = computed(() => this._isPasswordValid());

  // --- 本地状态 ---
  private cryptoKey: CryptoKey | null = null;
  private participantId: string = '';
  private wsSubscription: Subscription | null = null;

  constructor() {
    this.participantId = this.generateParticipantId();
  }

  /**
   * 生成本地匿名 ID
   */
  private generateParticipantId(): string {
    let id = localStorage.getItem('ephemeral_pid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('ephemeral_pid', id);
    }
    return id;
  }

  /**
   * 创建新房间
   */
  async createRoom(title: string, ttlSeconds: number): Promise<string> {
    const res = await this.adapter.createRoom({
      title,
      ttlSeconds,
      createdBy: this.participantId
    });
    return res.shortCode;
  }

  /**
   * 加载房间元信息（不含解密）
   */
  async loadRoom(shortCode: string): Promise<EphemeralRoom | null> {
    try {
      const info = await this.adapter.getRoomInfo(shortCode);
      this._room.set(info);
      this._isDestroyed.set(false);
      return info;
    } catch (e: any) {
      if (e.status === 410) {
        this._isDestroyed.set(true);
      }
      return null;
    }
  }

  /**
   * 输入密码，派生密钥并尝试解密历史消息
   * 如果能成功解密历史消息，或者没有历史消息，则认为密码正确并加入房间。
   */
  async verifyPasswordAndJoin(password: string): Promise<boolean> {
    const r = this._room();
    if (!r) throw new Error('Room not loaded');

    try {
      this.cryptoKey = await EphemeralCrypto.deriveKey(password, r.roomId);
      
      // 拉取历史消息
      const cipherMsgs = await this.adapter.pollMessages(r.roomId);
      
      const decrypted: DecryptedMessage[] = [];
      for (const cm of cipherMsgs) {
        const plainText = await EphemeralCrypto.decrypt(this.cryptoKey, cm.cipherText, cm.iv);
        decrypted.push({
          id: cm.id,
          roomId: cm.roomId,
          senderId: cm.senderId,
          plainText,
          sentAt: cm.sentAt,
          isSelf: cm.senderId === this.participantId
        });
      }

      // 如果全部解密成功，证明密码正确
      this._messages.set(decrypted);
      this._isPasswordValid.set(true);

      // 正式加入房间 (调用后端)
      await this.adapter.joinRoom(r.roomId, { participantId: this.participantId });
      this._isJoined.set(true);

      // 连接 WebSocket
      this.subscribeToEvents(r.roomId);

      return true;
    } catch (e) {
      console.error('Password verification failed (decryption error)', e);
      this.cryptoKey = null;
      this._isPasswordValid.set(false);
      return false;
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(plainText: string): Promise<void> {
    const r = this._room();
    if (!r || !this.cryptoKey) return;

    // 1. 加密
    const { cipherText, iv } = await EphemeralCrypto.encrypt(this.cryptoKey, plainText);

    // 2. 发送请求
    await this.adapter.sendMessageRest(r.roomId, {
      senderId: this.participantId,
      cipherText,
      iv
    });
    
    // (后端会通过 WS 广播给自己和其他人，收到后再渲染，或者本地先 optimistic render，这里选择等 WS 推送)
  }

  /**
   * 退出房间
   */
  async leaveRoom(): Promise<void> {
    const r = this._room();
    if (r) {
      try {
        await this.adapter.leaveAndDelete(r.roomId, this.participantId);
      } catch (e) {
        console.error('Failed to leave', e);
      }
    }
    this.cleanup();
  }

  /**
   * 销毁整个房间
   */
  async destroyRoom(): Promise<void> {
    const r = this._room();
    if (r) {
      try {
        await this.adapter.destroyRoom(r.roomId);
      } catch (e) {
        console.error('Failed to destroy', e);
      }
    }
  }

  /**
   * 订阅 WebSocket 广播
   */
  private subscribeToEvents(roomId: string) {
    if (this.wsSubscription) return;

    this.wsSubscription = this.adapter.subscribeToRoom(roomId).subscribe({
      next: async (msgStr: any) => {
        const bodyStr = typeof msgStr === 'string' ? msgStr : msgStr.body; // 处理 stomp message 对象
        if (!bodyStr) return;
        
        try {
          const wsMsg = JSON.parse(bodyStr) as WsMessage;
          await this.handleWsMessage(wsMsg);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      }
    });
  }

  /**
   * 处理 WebSocket 广播消息
   */
  private async handleWsMessage(msg: WsMessage) {
    switch (msg.type) {
      case WsMessageType.MSG_CIPHER:
        if (!this.cryptoKey) break;
        try {
          const plainText = await EphemeralCrypto.decrypt(this.cryptoKey, msg.payload, msg.iv);
          this.appendMessage({
            roomId: this._room()?.roomId || '',
            senderId: msg.senderId,
            plainText,
            isSelf: msg.senderId === this.participantId
          });
        } catch (e) {
          console.error('Failed to decrypt incoming message', e);
        }
        break;
      
      case WsMessageType.JOIN:
        this.appendSystemMessage(`Participant ${msg.payload.substring(0, 4)} joined`);
        break;

      case WsMessageType.LEAVE:
        // 有人退出，并可能删除了消息
        const leaverId = msg.payload;
        this.appendSystemMessage(`Participant ${leaverId.substring(0, 4)} left`);
        // 删除他的消息
        this._messages.update(msgs => msgs.filter(m => m.senderId !== leaverId));
        break;

      case WsMessageType.DESTROY:
        this._isDestroyed.set(true);
        this.cleanup();
        break;

      case WsMessageType.HEARTBEAT:
        // 忽略，或者更新 UI 的 TTL
        break;
    }
  }

  private appendMessage(msg: DecryptedMessage) {
    this._messages.update(msgs => [...msgs, msg]);
  }

  private appendSystemMessage(text: string) {
    this.appendMessage({
      roomId: this._room()?.roomId || '',
      senderId: 'SYSTEM',
      plainText: text,
      isSelf: false,
      isSystem: true
    });
  }

  /**
   * 清理本地状态
   */
  cleanup() {
    this.wsSubscription?.unsubscribe();
    this.wsSubscription = null;
    this.adapter.disconnectWebSocket();
    this.cryptoKey = null;
    this._isJoined.set(false);
    this._messages.set([]);
    this._isPasswordValid.set(false);
  }
}
