import { TestBed } from '@angular/core/testing';
import { AiDevUseCase } from './ai-dev.usecase';
import { AiDevRepository } from '../adapter/ai-dev.repository';
import { of, throwError } from 'rxjs';
import { AiDevTaskStatus } from '../domain/ai-dev.model';

describe('AiDevUseCase', () => {
  let useCase: AiDevUseCase;
  let repositoryMock: jest.Mocked<AiDevRepository>;

  const mockTasks = [
    {
      id: '1', title: 'Task 1', description: 'Desc 1',
      status: AiDevTaskStatus.PLANNING, branchName: 'branch-1',
      totalCost: 1.0, createTime: '', updateTime: ''
    }
  ];

  beforeEach(() => {
    // Clear localStorage to isolate tests
    localStorage.clear();

    repositoryMock = {
      getTasks: jest.fn().mockReturnValue(of(mockTasks)),
      resumeTask: jest.fn().mockReturnValue(of(void 0)),
      rollbackTask: jest.fn().mockReturnValue(of(void 0)),
      checkHealth: jest.fn().mockReturnValue(of({ status: 'running' }))
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AiDevUseCase,
        { provide: AiDevRepository, useValue: repositoryMock }
      ]
    });

    useCase = TestBed.inject(AiDevUseCase);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should load tasks successfully', async () => {
    await useCase.loadTasks();
    expect(repositoryMock.getTasks).toHaveBeenCalled();
    expect(useCase.tasks()).toEqual(mockTasks);
    expect(useCase.isLoading()).toBe(false);
    expect(useCase.error()).toBeNull();
  });

  it('should handle load tasks error', async () => {
    repositoryMock.getTasks.mockReturnValueOnce(throwError(() => new Error('Network error')));
    await useCase.loadTasks();
    expect(useCase.tasks()).toEqual([]);
    expect(useCase.error()).toBe('Network error');
    expect(useCase.isLoading()).toBe(false);
  });

  it('should resume task and reload tasks', async () => {
    await useCase.resumeTask('1');
    expect(repositoryMock.resumeTask).toHaveBeenCalledWith('1');
    expect(repositoryMock.getTasks).toHaveBeenCalled(); // reload tasks
  });

  it('should rollback task and reload tasks', async () => {
    await useCase.rollbackTask('1');
    expect(repositoryMock.rollbackTask).toHaveBeenCalledWith('1');
    expect(repositoryMock.getTasks).toHaveBeenCalled(); // reload tasks
  });

  it('should initialize config from localStorage', () => {
    localStorage.setItem('ms-ai-devops-path', '/custom/path');
    localStorage.setItem('ms-ai-devops-url', 'http://custom:9000');
    
    const newUseCase = new AiDevUseCase(repositoryMock);
    expect(newUseCase.msAiDevopsPath()).toBe('/custom/path');
    expect(newUseCase.msAiDevopsUrl()).toBe('http://custom:9000');
  });

  it('should update config and save to localStorage', () => {
    useCase.updateDevopsConfig('/new/path', 'http://new:9000');
    expect(useCase.msAiDevopsPath()).toBe('/new/path');
    expect(useCase.msAiDevopsUrl()).toBe('http://new:9000');
    expect(localStorage.getItem('ms-ai-devops-path')).toBe('/new/path');
    expect(localStorage.getItem('ms-ai-devops-url')).toBe('http://new:9000');
  });

  it('should check connection and update status on success', async () => {
    repositoryMock.checkHealth.mockReturnValueOnce(of({ status: 'running' }));
    await useCase.checkDevopsConnection();
    expect(repositoryMock.checkHealth).toHaveBeenCalledWith(useCase.msAiDevopsUrl());
    expect(useCase.devopsConnectionStatus()).toBe('CONNECTED');
  });

  it('should check connection and update status on failure', async () => {
    repositoryMock.checkHealth.mockReturnValueOnce(throwError(() => new Error('Connection failed')));
    await useCase.checkDevopsConnection();
    expect(useCase.devopsConnectionStatus()).toBe('DISCONNECTED');
  });
});
