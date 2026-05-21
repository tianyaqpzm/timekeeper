import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChatApiAdapter } from '@/app/core/adapters/chat/chat-api.adapter';

describe('ChatApiAdapter', () => {
  let adapter: ChatApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    adapter = TestBed.inject(ChatApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('getHistory should return mapped chat messages', (done) => {
    const mockHistory = [
      { role: 'user', content: 'hello' },
      { role: 'ai', content: 'hi' }
    ];
    const sessionId = 'test-session';

    adapter.getHistory(sessionId).subscribe(messages => {
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('model');
      done();
    });

    const req = httpMock.expectOne(r => r.url === '/rest/biz/v1/history' && r.params.get('sessionId') === sessionId);
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });

  it('getSessions should return sessions list', (done) => {
    const mockSessions = [{ sessionId: '1', title: 'Session 1', lastActiveTime: '' }];

    adapter.getSessions().subscribe(sessions => {
      expect(sessions).toEqual(mockSessions);
      done();
    });

    const req = httpMock.expectOne('/rest/biz/v1/history/sessions');
    req.flush(mockSessions);
  });
});
