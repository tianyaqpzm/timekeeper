import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { KnowledgeApiAdapter } from '@/app/core/adapters/knowledge/knowledge-api.adapter';
import { URLConfig } from '@/app/core/infrastructure/constants/url.config';

describe('KnowledgeApiAdapter', () => {
  let adapter: KnowledgeApiAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KnowledgeApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    adapter = TestBed.inject(KnowledgeApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getTopics should fetch topics from correct URL', async () => {
    const mockTopics = [{ id: '1', name: 'Topic 1', icon: 'Folder', desc: 'Desc' }];
    const promise = adapter.getTopics();

    const req = httpMock.expectOne(`${URLConfig.KNOWLEDGE.BASE}/topics`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTopics);

    const topics = await promise;
    expect(topics.length).toBe(1);
    expect(topics[0].name).toBe('Topic 1');
  });

  it('uploadDocument should post to upload URL', async () => {
    const mockDoc = { id: 'd1', topicId: 't1', title: 'test.pdf', status: 'READY', author: 'User' };
    const file = new File([''], 'test.pdf');
    const promise = adapter.uploadDocument('t1', file);

    const req = httpMock.expectOne(URLConfig.KNOWLEDGE.UPLOAD);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockDoc);

    const doc = await promise;
    expect(doc.id).toBe('d1');
  });

  it('startIngestTask should post to ingest URL', async () => {
    const promise = adapter.startIngestTask('d1', { size: 100 });

    const req = httpMock.expectOne(`${URLConfig.KNOWLEDGE.BASE}/documents/d1/ingest`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'ok' });

    const res = await promise;
    expect(res.status).toBe('ok');
  });

  it('triggerRecipeBuild should post to build recipe URL', async () => {
    const promise = adapter.triggerRecipeBuild();

    const req = httpMock.expectOne(URLConfig.KNOWLEDGE.BUILD_RECIPE);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'RUNNING', taskId: 'task-123' });

    const res = await promise;
    expect(res.status).toBe('RUNNING');
    expect(res.taskId).toBe('task-123');
  });

  it('getBuildProgress should fetch from task progress URL', async () => {
    const promise = adapter.getBuildProgress('task-123');

    const req = httpMock.expectOne(URLConfig.KNOWLEDGE.TASK_PROGRESS('task-123'));
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'task-123',
      taskType: 'RECIPE_BUILD',
      status: 'RUNNING',
      totalCount: 10,
      processedCount: 4,
      currentItemName: 'curry.md'
    });

    const res = await promise;
    expect(res.id).toBe('task-123');
    expect(res.processedCount).toBe(4);
    expect(res.currentItemName).toBe('curry.md');
  });
});
