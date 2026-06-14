import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Announcement, AnnouncementRequest, NoticeBoardItem, NoticeBoardItemRequest, PageResult } from '../domain/notice-board.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NoticeBoardAdapter {
  private readonly http = inject(HttpClient);
  private readonly basePath = `${environment.VITE_GATEWAY_URL}/rest/biz/v1`;

  getAnnouncements(page?: number, size?: number): Observable<PageResult<Announcement> | Announcement[]> {
    let url = `${this.basePath}/announcements`;
    if (page !== undefined && size !== undefined) {
      url += `?page=${page}&size=${size}`;
    }
    return this.http.get<PageResult<Announcement> | Announcement[]>(url);
  }

  getAnnouncementDetail(id: number, code?: string): Observable<Announcement> {
    const url = code ? `${this.basePath}/announcements/${id}?code=${code}` : `${this.basePath}/announcements/${id}`;
    return this.http.get<Announcement>(url);
  }

  updateAnnouncement(id: number, request: AnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.basePath}/announcements/${id}`, request);
  }

  /**
   * 上传图片，复用统一上传框架 POST /rest/biz/v1/upload/image。
   * 返回图片的相对 URL（需前端拼接 gateway base URL 使用）。
   */
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.basePath}/upload/image`, formData);
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/announcements/${id}`);
  }

  createAnnouncement(request: AnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.basePath}/announcements`, request);
  }

  getNoticeBoardItems(): Observable<NoticeBoardItem[]> {
    return this.http.get<NoticeBoardItem[]>(`${this.basePath}/notice-board-items`);
  }

  createNoticeBoardItem(request: NoticeBoardItemRequest): Observable<NoticeBoardItem> {
    return this.http.post<NoticeBoardItem>(`${this.basePath}/notice-board-items`, request);
  }

  trackItemView(id: number): Observable<void> {
    return this.http.post<void>(`${this.basePath}/notice-board-items/${id}/track-view`, {});
  }

  deleteNoticeBoardItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/notice-board-items/${id}`);
  }
}
