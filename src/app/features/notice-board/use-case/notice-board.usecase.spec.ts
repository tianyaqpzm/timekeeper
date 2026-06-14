import { TestBed } from '@angular/core/testing';
import { NoticeBoardUseCase } from './notice-board.usecase';
import { NoticeBoardAdapter } from '../adapter/notice-board.adapter';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Announcement, NoticeBoardItem, AnnouncementRequest, NoticeBoardItemRequest } from '../domain/notice-board.model';

describe('NoticeBoardUseCase', () => {
  let useCase: NoticeBoardUseCase;
  let adapterMock: any;
  let snackBarMock: any;

  beforeEach(() => {
    adapterMock = {
      getAnnouncements: jest.fn(),
      createAnnouncement: jest.fn(),
      getNoticeBoardItems: jest.fn(),
      createNoticeBoardItem: jest.fn(),
      trackItemView: jest.fn()
    };
    snackBarMock = {
      open: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        NoticeBoardUseCase,
        { provide: NoticeBoardAdapter, useValue: adapterMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ]
    });

    useCase = TestBed.inject(NoticeBoardUseCase);
  });

  it('should load data successfully', () => {
    const mockAnnouncements: Announcement[] = [{ id: 1, title: 'Test', content: 'Content', status: 'PUBLISHED', createTime: '2023-01-01', updateTime: '2023-01-01' }];
    const mockItems: NoticeBoardItem[] = [{ id: 1, targetClient: 'T', usageDetails: 'U', referenceUrl: 'R', contentUrl: 'C', expireTime: '', lastViewedTime: '', createTime: '', updateTime: '' }];
    
    adapterMock.getAnnouncements.mockReturnValue(of(mockAnnouncements));
    adapterMock.getNoticeBoardItems.mockReturnValue(of(mockItems));

    useCase.loadData();

    expect(useCase.isLoading()).toBe(false);
    expect(useCase.announcements()).toEqual(mockAnnouncements);
    expect(useCase.noticeBoardItems()).toEqual(mockItems);
    expect(useCase.error()).toBeNull();
  });

  it('should handle error when loading data', () => {
    adapterMock.getAnnouncements.mockReturnValue(throwError(() => new Error('Error')));
    adapterMock.getNoticeBoardItems.mockReturnValue(throwError(() => new Error('Error')));

    useCase.loadData();

    expect(useCase.isLoading()).toBe(false);
    expect(useCase.error()).toBe('Failed to load secure notice board items.');
  });

  it('should create an announcement successfully', () => {
    const request: AnnouncementRequest = { title: 'A', content: 'C', status: 'PUBLISHED', extractionCode: '123' };
    const mockAnnouncement: Announcement = { id: 1, ...request, createTime: '', updateTime: '' };
    adapterMock.createAnnouncement.mockReturnValue(of(mockAnnouncement));
    
    const onSuccessSpy = jest.fn();

    useCase.createAnnouncement(request, onSuccessSpy);

    expect(useCase.announcements()).toContainEqual(mockAnnouncement);
    expect(snackBarMock.open).toHaveBeenCalledWith('Announcement created successfully', 'Close', { duration: 3000 });
    expect(onSuccessSpy).toHaveBeenCalled();
  });

  it('should handle error when creating announcement', () => {
    const request: AnnouncementRequest = { title: 'A', content: 'C', status: 'PUBLISHED', extractionCode: '123' };
    adapterMock.createAnnouncement.mockReturnValue(throwError(() => new Error('Error')));

    useCase.createAnnouncement(request);

    expect(snackBarMock.open).toHaveBeenCalledWith('Failed to create announcement', 'Close', { duration: 3000 });
  });

  it('should create a notice board item successfully', () => {
    const request: NoticeBoardItemRequest = { targetClient: 'T', contentUrl: 'C', expireTime: '' };
    const mockItem: NoticeBoardItem = { id: 1, ...request, usageDetails: '', referenceUrl: '', lastViewedTime: '', createTime: '', updateTime: '' };
    adapterMock.createNoticeBoardItem.mockReturnValue(of(mockItem));
    
    const onSuccessSpy = jest.fn();

    useCase.createNoticeBoardItem(request, onSuccessSpy);

    expect(useCase.noticeBoardItems()).toContainEqual(mockItem);
    expect(snackBarMock.open).toHaveBeenCalledWith('Notice board item created successfully', 'Close', { duration: 3000 });
    expect(onSuccessSpy).toHaveBeenCalled();
  });

  it('should track item view and optimistically update UI', () => {
    const mockItems: NoticeBoardItem[] = [{ id: 1, targetClient: 'T', usageDetails: 'U', referenceUrl: 'R', contentUrl: 'C', expireTime: '', lastViewedTime: 'oldTime', createTime: '', updateTime: '' }];
    useCase.noticeBoardItems.set(mockItems);
    adapterMock.trackItemView.mockReturnValue(of(undefined));

    useCase.trackItemView(1);

    const updatedItem = useCase.noticeBoardItems().find(i => i.id === 1);
    expect(updatedItem?.lastViewedTime).not.toBe('oldTime');
    expect(adapterMock.trackItemView).toHaveBeenCalledWith(1);
  });
});
