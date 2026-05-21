import { TestBed } from '@angular/core/testing';
import { KnowledgeUseCase } from '@/app/core/use-cases/knowledge/knowledge.usecase';
import { KnowledgeApiAdapter } from '@/app/core/adapters/knowledge/knowledge-api.adapter';
import { Topic, KnowledgeDocument } from '@/app/core/domain/knowledge/knowledge.model';

describe('KnowledgeUseCase', () => {
  let useCase: KnowledgeUseCase;
  let adapterMock: jest.Mocked<KnowledgeApiAdapter>;

  const mockTopics: Topic[] = [
    { id: 't1', name: 'Topic 1', icon: 'icon1', desc: 'Desc 1', description: 'Description 1' }
  ];

  const mockDocs: KnowledgeDocument[] = [
    { id: 'd1', topicId: 't1', title: 'Doc 1', status: 'READY', author: 'Test User' }
  ];

  beforeEach(() => {
    adapterMock = {
      getTopics: jest.fn().mockResolvedValue(mockTopics),
      getDocuments: jest.fn().mockResolvedValue({
        records: mockDocs,
        total: 1,
        size: 10,
        current: 1,
        pages: 1
      }),
      createTopic: jest.fn(),
      updateTopic: jest.fn(),
      deleteTopic: jest.fn().mockResolvedValue(undefined),
      uploadDocument: jest.fn(),
      deleteDocument: jest.fn().mockResolvedValue(undefined),
      startIngestTask: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        KnowledgeUseCase,
        { provide: KnowledgeApiAdapter, useValue: adapterMock }
      ]
    });

    useCase = TestBed.inject(KnowledgeUseCase);
  });

  it('should load topics and NOT auto-select', async () => {
    useCase.selectedTopicId.set(null);
    await useCase.refreshTopics();
    expect(adapterMock.getTopics).toHaveBeenCalled();
    expect(useCase.topics().length).toBe(1);
    expect(useCase.selectedTopicId()).toBeNull();
  });

  it('should select topic and load documents', async () => {
    await useCase.selectTopic('t1');
    TestBed.flushEffects();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(useCase.selectedTopicId()).toBe('t1');
    expect(adapterMock.getDocuments).toHaveBeenCalledWith('t1', 1, 10);
    expect(useCase.documents().length).toBe(1);
  });

  it('should delete topic and clear documents', async () => {
    useCase.selectedTopicId.set('t1');
    adapterMock.getTopics.mockResolvedValue([]);
    await useCase.deleteTopic('t1');
    expect(adapterMock.deleteTopic).toHaveBeenCalledWith('t1');
    expect(useCase.selectedTopicId()).toBeNull();
    expect(useCase.documents()).toEqual([]);
  });
});
