import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoticeBoardAdapter } from './notice-board.adapter';
import { environment } from '../../../../environments/environment';
import { Announcement, NoticeBoardItem, AnnouncementRequest, NoticeBoardItemRequest } from '../domain/notice-board.model';

describe('NoticeBoardAdapter', () => {
  let adapter: NoticeBoardAdapter;
  let httpMock: HttpTestingController;
  const basePath = `${environment.VITE_GATEWAY_URL}/rest/biz/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NoticeBoardAdapter]
    });
    adapter = TestBed.inject(NoticeBoardAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should get announcements', () => {
    const mockAnnouncements: Announcement[] = [
      { id: 1, title: 'Title', content: 'Content', status: 'PUBLISHED', createTime: '2023-01-01', updateTime: '2023-01-01' }
    ];

    adapter.getAnnouncements().subscribe(data => {
      expect(data).toEqual(mockAnnouncements);
    });

    const req = httpMock.expectOne(`${basePath}/announcements`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAnnouncements);
  });

  it('should create an announcement', () => {
    const request: AnnouncementRequest = { title: 'Title', content: 'Content', status: 'PUBLISHED', extractionCode: '123' };
    const mockAnnouncement: Announcement = { id: 1, ...request, createTime: '2023-01-01', updateTime: '2023-01-01' };

    adapter.createAnnouncement(request).subscribe(data => {
      expect(data).toEqual(mockAnnouncement);
    });

    const req = httpMock.expectOne(`${basePath}/announcements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockAnnouncement);
  });

  it('should get notice board items', () => {
    const mockItems: NoticeBoardItem[] = [
      { id: 1, targetClient: 'Client', usageDetails: 'Details', referenceUrl: 'url', contentUrl: 'curl', expireTime: '2023-01-01', lastViewedTime: '2023-01-01', createTime: '2023-01-01', updateTime: '2023-01-01' }
    ];

    adapter.getNoticeBoardItems().subscribe(data => {
      expect(data).toEqual(mockItems);
    });

    const req = httpMock.expectOne(`${basePath}/notice-board-items`);
    expect(req.request.method).toBe('GET');
    req.flush(mockItems);
  });

  it('should create a notice board item', () => {
    const request: NoticeBoardItemRequest = { targetClient: 'Client', contentUrl: 'curl', expireTime: '2023-01-01' };
    const mockItem: NoticeBoardItem = { id: 1, ...request, usageDetails: '', referenceUrl: '', lastViewedTime: '', createTime: '2023-01-01', updateTime: '2023-01-01' };

    adapter.createNoticeBoardItem(request).subscribe(data => {
      expect(data).toEqual(mockItem);
    });

    const req = httpMock.expectOne(`${basePath}/notice-board-items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockItem);
  });

  it('should track item view', () => {
    adapter.trackItemView(1).subscribe();

    const req = httpMock.expectOne(`${basePath}/notice-board-items/1/track-view`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });
});
