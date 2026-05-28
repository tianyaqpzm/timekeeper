import { TestBed } from '@angular/core/testing';
import { EphemeralUseCase } from './ephemeral.usecase';
import { EphemeralAdapter } from '../infrastructure/ephemeral.adapter';
import { EphemeralCrypto } from './ephemeral.crypto';
import { WsMessage, WsMessageType } from '../domain/ephemeral.model';
import { Subject } from 'rxjs';

// 拦截 Crypto 工具类，避免实际的 SubtleCrypto 在 JSDOM 环境下的兼容性问题，并隔离核心逻辑
jest.mock('./ephemeral.crypto');

describe('EphemeralUseCase', () => {
  let useCase: EphemeralUseCase;
  let mockAdapter: jest.Mocked<EphemeralAdapter>;
  let mockWsSubject: Subject<any>;

  beforeEach(() => {
    // 模拟 LocalStorage
    Storage.prototype.getItem = jest.fn(() => 'test-participant-123');
    Storage.prototype.setItem = jest.fn();

    mockWsSubject = new Subject<any>();

    // 构造 Adapter 的完全 Mock
    const adapterMock = {
      createRoom: jest.fn(),
      getRoomInfo: jest.fn(),
      pollMessages: jest.fn(),
      joinRoom: jest.fn(),
      sendMessageRest: jest.fn(),
      leaveAndDelete: jest.fn(),
      destroyRoom: jest.fn(),
      subscribeToRoom: jest.fn().mockReturnValue(mockWsSubject.asObservable()),
      disconnectWebSocket: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EphemeralUseCase,
        { provide: EphemeralAdapter, useValue: adapterMock }
      ]
    });

    useCase = TestBed.inject(EphemeralUseCase);
    mockAdapter = TestBed.inject(EphemeralAdapter) as jest.Mocked<EphemeralAdapter>;

    // 重置 Mock 状态
    (EphemeralCrypto.deriveKey as jest.Mock).mockClear();
    (EphemeralCrypto.encrypt as jest.Mock).mockClear();
    (EphemeralCrypto.decrypt as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化与基础方法', () => {
    it('应该在创建实例时生成或恢复 participantId', () => {
      expect(localStorage.getItem).toHaveBeenCalledWith('ephemeral_pid');
      // @ts-ignore
      expect(useCase['participantId']).toBe('test-participant-123');
    });

    it('createRoom 应该正确调用 Adapter 并返回短链码', async () => {
      mockAdapter.createRoom.mockResolvedValue({ shortCode: 'ABCD', roomId: 'room-1' } as any);
      const result = await useCase.createRoom('Test Room', 3600);
      
      expect(mockAdapter.createRoom).toHaveBeenCalledWith({
        title: 'Test Room',
        ttlSeconds: 3600,
        createdBy: 'test-participant-123'
      });
      expect(result).toBe('ABCD');
    });
  });

  describe('鉴权流 (verifyPasswordAndJoin)', () => {
    beforeEach(() => {
      // 前置条件：模拟房间已加载
      useCase['_room'].set({ 
        roomId: 'room-1', shortCode: 'ABCD', title: 'Test', expireAt: '2023-01-01T00:00:00Z', participantCount: 1 
      });
    });

    it('当密码正确且历史消息全部解密成功时，应加入房间并订阅 WS', async () => {
      // Arrange
      const mockKey = {} as CryptoKey;
      (EphemeralCrypto.deriveKey as jest.Mock).mockResolvedValue(mockKey);
      
      mockAdapter.pollMessages.mockResolvedValue([
        { id: 1, roomId: 'room-1', senderId: 'other-456', cipherText: 'abc', iv: 'def', sentAt: '2023' }
      ]);
      (EphemeralCrypto.decrypt as jest.Mock).mockResolvedValue('Hello World');

      // Act
      const result = await useCase.verifyPasswordAndJoin('correct-pass');

      // Assert
      expect(result).toBe(true);
      expect(useCase.isPasswordValid()).toBe(true);
      expect(useCase.isJoined()).toBe(true);
      
      // 验证历史消息被正确追加
      expect(useCase.messages().length).toBe(1);
      expect(useCase.messages()[0].plainText).toBe('Hello World');
      
      // 验证网络请求的触发
      expect(mockAdapter.joinRoom).toHaveBeenCalledWith('room-1', { participantId: 'test-participant-123' });
      expect(mockAdapter.subscribeToRoom).toHaveBeenCalledWith('room-1');
    });

    it('当密码错误(解密异常)时，应拦截加入并清理状态', async () => {
      // Arrange
      (EphemeralCrypto.deriveKey as jest.Mock).mockResolvedValue({} as CryptoKey);
      mockAdapter.pollMessages.mockResolvedValue([
        { id: 1, roomId: 'room-1', senderId: 'other-456', cipherText: 'abc', iv: 'def', sentAt: '2023' }
      ]);
      
      // 模拟密码错误导致的解密抛出异常
      (EphemeralCrypto.decrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

      // Act
      const result = await useCase.verifyPasswordAndJoin('wrong-pass');

      // Assert
      expect(result).toBe(false);
      expect(useCase.isPasswordValid()).toBe(false);
      expect(useCase.isJoined()).toBe(false);
      
      // 不应当请求加入或订阅
      expect(mockAdapter.joinRoom).not.toHaveBeenCalled();
      expect(mockAdapter.subscribeToRoom).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket 消息处理 (handleWsMessage)', () => {
    beforeEach(async () => {
      // 前置准备：模拟已在房间内
      useCase['_room'].set({ roomId: 'room-1', shortCode: 'ABCD', title: 'Test', expireAt: '2023-01-01T00:00:00Z', participantCount: 1 });
      (EphemeralCrypto.deriveKey as jest.Mock).mockResolvedValue({} as CryptoKey);
      mockAdapter.pollMessages.mockResolvedValue([]);
      await useCase.verifyPasswordAndJoin('pass');
    });

    it('应正确接收密文消息并解密渲染', async () => {
      (EphemeralCrypto.decrypt as jest.Mock).mockResolvedValue('Incoming WS message');
      
      const wsMsg: WsMessage = {
        type: WsMessageType.MSG_CIPHER,
        senderId: 'other-456',
        payload: 'cipher',
        iv: 'iv'
      };

      // 推送消息
      mockWsSubject.next({ body: JSON.stringify(wsMsg) });
      await Promise.resolve(); // 让 microtask 队列执行 (因为 handleWsMessage 是 async)

      expect(useCase.messages().length).toBe(1);
      expect(useCase.messages()[0].plainText).toBe('Incoming WS message');
      expect(useCase.messages()[0].isSelf).toBe(false);
    });

    it('收到 LEAVE 广播时，应追加系统消息并销毁该成员的历史消息', async () => {
      // 提前塞入几条消息
      useCase['_messages'].set([
        { roomId: 'room-1', senderId: 'other-456', plainText: 'Msg 1', isSelf: false },
        { roomId: 'room-1', senderId: 'test-participant-123', plainText: 'Msg 2', isSelf: true }
      ]);

      const wsMsg: WsMessage = {
        type: WsMessageType.LEAVE,
        senderId: 'SYSTEM',
        payload: 'other-456', // 离开的人的 ID
        iv: ''
      };

      mockWsSubject.next({ body: JSON.stringify(wsMsg) });
      await Promise.resolve();

      const msgs = useCase.messages();
      expect(msgs.length).toBe(2); 
      // 该成员历史消息应被抹除
      expect(msgs.some(m => m.senderId === 'other-456')).toBe(false);
      // 应追加系统提示
      expect(msgs.some(m => m.isSystem && m.plainText.includes('othe left'))).toBe(true);
    });
  });
});
