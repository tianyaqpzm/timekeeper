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
    repositoryMock = {
      getTasks: jest.fn().mockReturnValue(of(mockTasks)),
      resumeTask: jest.fn().mockReturnValue(of(void 0)),
      rollbackTask: jest.fn().mockReturnValue(of(void 0))
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AiDevUseCase,
        { provide: AiDevRepository, useValue: repositoryMock }
      ]
    });

    useCase = TestBed.inject(AiDevUseCase);
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
});
