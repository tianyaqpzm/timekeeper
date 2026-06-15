import { Injectable, inject, signal } from '@angular/core';
import { NoticeBoardAdapter } from '../adapter/notice-board.adapter';
import { Announcement, AnnouncementRequest, NoticeBoardItem, NoticeBoardItemRequest } from '../domain/notice-board.model';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NoticeBoardUseCase {
  private readonly adapter = inject(NoticeBoardAdapter);
  private readonly snackBar = inject(MatSnackBar);

  // State Signals
  readonly announcements = signal<Announcement[]>([]);
  readonly totalAnnouncements = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly noticeBoardItems = signal<NoticeBoardItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly keyword = signal<string>('');

  // Mock Admin State (Should be wired up to actual Auth UseCase)
  readonly isAdmin = signal<boolean>(true); // Placeholder for actual auth logic

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load Announcements (Paged)
    this.adapter.getAnnouncements(this.currentPage(), this.pageSize(), this.keyword()).pipe(
      tap(data => {
        if ('records' in data) {
          this.announcements.set(data.records);
          this.totalAnnouncements.set(data.total);
        } else {
          this.announcements.set(data as Announcement[]);
          this.totalAnnouncements.set((data as Announcement[]).length);
        }
      }),
      catchError(err => {
        console.error('Failed to load announcements', err);
        return EMPTY;
      })
    ).subscribe();

    // Load Notice Board Items
    this.adapter.getNoticeBoardItems().pipe(
      tap(data => {
        this.noticeBoardItems.set(data);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Failed to load secure notice board items.');
        this.isLoading.set(false);
        return EMPTY;
      })
    ).subscribe();
  }

  createAnnouncement(request: AnnouncementRequest, onSuccess?: () => void): void {
    this.adapter.createAnnouncement(request).subscribe({
      next: (newAnnouncement) => {
        this.announcements.update(list => [newAnnouncement, ...list]);
        this.snackBar.open('Announcement created successfully', 'Close', { duration: 3000 });
        if (onSuccess) onSuccess();
      },
      error: () => this.snackBar.open('Failed to create announcement', 'Close', { duration: 3000 })
    });
  }

  createNoticeBoardItem(request: NoticeBoardItemRequest, onSuccess?: () => void): void {
    this.adapter.createNoticeBoardItem(request).subscribe({
      next: (newItem) => {
        this.noticeBoardItems.update(list => [newItem, ...list]);
        this.snackBar.open('Notice board item created successfully', 'Close', { duration: 3000 });
        if (onSuccess) onSuccess();
      },
      error: () => this.snackBar.open('Failed to create item', 'Close', { duration: 3000 })
    });
  }

  trackItemView(id: number): void {
    this.adapter.trackItemView(id).subscribe({
      next: () => {
        // Optimistically update the UI to show the new view time
        this.noticeBoardItems.update(items => items.map(item => {
          if (item.id === id) {
            return { ...item, lastViewedTime: new Date().toISOString() };
          }
          return item;
        }));
      }
    });
  }

  deleteNoticeBoardItem(id: number, onSuccess?: () => void): void {
    this.adapter.deleteNoticeBoardItem(id).subscribe({
      next: () => {
        this.noticeBoardItems.update(list => list.filter(item => item.id !== id));
        this.snackBar.open('Item deleted successfully', 'Close', { duration: 3000 });
        if (onSuccess) onSuccess();
      },
      error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 })
    });
  }

  deleteAnnouncement(id: number, onSuccess?: () => void): void {
    this.adapter.deleteAnnouncement(id).subscribe({
      next: () => {
        this.announcements.update(list => list.filter(item => item.id !== id));
        this.totalAnnouncements.update(total => total > 0 ? total - 1 : 0);
        this.snackBar.open('Announcement deleted successfully', 'Close', { duration: 3000 });
        if (onSuccess) onSuccess();
      },
      error: () => this.snackBar.open('Failed to delete announcement', 'Close', { duration: 3000 })
    });
  }

  changePage(pageIndex: number, pageSize: number): void {
    // Angular Material Paginator is 0-indexed, our backend is 1-indexed
    this.currentPage.set(pageIndex + 1);
    this.pageSize.set(pageSize);
    this.loadData();
  }

  setKeyword(keyword: string): void {
    this.keyword.set(keyword);
    this.currentPage.set(1);
    this.loadData();
  }
}
