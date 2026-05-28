import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { RxStomp } from '@stomp/rx-stomp';
import { environment } from '@/environments/environment';
import { URLConfig } from '../../../core/infrastructure/constants/url.config';
import { 
  CreateRoomRequest, 
  CreateRoomResponse, 
  EphemeralMessage, 
  JoinRoomRequest, 
  SendMessageRequest, 
  WsMessage 
} from '../domain/ephemeral.model';

@Injectable({
  providedIn: 'root'
})
export class EphemeralAdapter {
  private http = inject(HttpClient);
  private rxStomp: RxStomp | null = null;

  /**
   * 创建房间
   */
  createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    return firstValueFrom(this.http.post<CreateRoomResponse>(URLConfig.EPHEMERAL.ROOMS, request));
  }

  /**
   * 获取房间元信息
   */
  getRoomInfo(code: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(URLConfig.EPHEMERAL.ROOM_INFO(code)));
  }

  /**
   * 加入房间
   */
  joinRoom(roomId: string, request: JoinRoomRequest): Promise<void> {
    return firstValueFrom(this.http.post<void>(URLConfig.EPHEMERAL.JOIN(roomId), request));
  }

  /**
   * 轮询拉取历史消息（用于初始加载或降级）
   */
  pollMessages(roomId: string, afterId: number = 0): Promise<EphemeralMessage[]> {
    return firstValueFrom(this.http.get<EphemeralMessage[]>(URLConfig.EPHEMERAL.MESSAGES(roomId), {
      params: { afterId: afterId.toString() }
    }));
  }

  /**
   * 退出并删除本人消息
   */
  leaveAndDelete(roomId: string, participantId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(URLConfig.EPHEMERAL.ME(roomId), {
      params: { participantId }
    }));
  }

  /**
   * 销毁整个房间
   */
  destroyRoom(roomId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(URLConfig.EPHEMERAL.DESTROY(roomId)));
  }

  /**
   * 从环境变量或本地主机动态解析 WebSocket 连接 URL
   */
  private getWsUrl(): string {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}${URLConfig.EPHEMERAL.WS_ENDPOINT}`;
    } else {
      // 生产环境或预览分支，解析外部 API 网关域名
      const apiUrl = environment.VITE_API_URL;
      const wsProtocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
      const wsHost = apiUrl.replace(/^https?:\/\//, '');
      return `${wsProtocol}//${wsHost}${URLConfig.EPHEMERAL.WS_ENDPOINT}`;
    }
  }

  /**
   * 初始化 WebSocket (STOMP)
   */
  connectWebSocket(): void {
    if (this.rxStomp) return;

    this.rxStomp = new RxStomp();
    const wsUrl = this.getWsUrl();

    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      debug: (msg: string) => console.log('STOMP: ', msg)
    });
    
    this.rxStomp.activate();
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnectWebSocket(): void {
    if (this.rxStomp) {
      this.rxStomp.deactivate();
      this.rxStomp = null;
    }
  }

  /**
   * 订阅房间广播频道
   */
  subscribeToRoom(roomId: string): Observable<any> {
    if (!this.rxStomp) this.connectWebSocket();
    return this.rxStomp!.watch(`/topic/room/${roomId}`);
  }

  /**
   * 发送加密消息 (REST)
   * 
   * 我们使用 REST 发送消息，这样能获得持久化后的 id
   */
  sendMessageRest(roomId: string, request: SendMessageRequest): Promise<EphemeralMessage> {
    // 假设后端还没加这个接口，我们需要在 Controller 补充发送消息接口。
    // FE015 说发送加密消息上传服务器，REST 端点遗漏了 POST /api/dark/v1/ephemeral/rooms/{id}/messages
    // 为了稳妥，前端可以调用 WebSocket 的 /app 发送，或者补充 REST
    return firstValueFrom(this.http.post<EphemeralMessage>(`${URLConfig.EPHEMERAL.ROOMS}/${roomId}/messages`, request));
  }
}
