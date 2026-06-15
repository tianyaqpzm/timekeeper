import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoticeBoardUseCase } from '../use-case/notice-board.usecase';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDividerModule } from '@angular/material/divider';
import { AddAnnouncementDialog } from './add-announcement.dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoticeBoardItem } from '../domain/notice-board.model';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CustomPaginatorIntl } from '../../../shared/components/custom-paginator-intl';

@Component({
  selector: 'app-notice-board',
  standalone: true,
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    ClipboardModule,
    MatDividerModule,
    MatDialogModule,
    DatePipe,
    TranslateModule,
    MatPaginatorModule
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './notice-board.component.html',
  styleUrls: ['./notice-board.component.scss']
})
export class NoticeBoardComponent implements OnInit, OnDestroy {
  readonly useCase = inject(NoticeBoardUseCase);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private intervalId: any;
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  topAnnouncements = computed(() => {
    return this.useCase.announcements().slice(0, 5);
  });

  currentAnnouncementIndex = signal(0);

  displayedColumns: string[] = ['title', 'status', 'createTime', 'expireTime', 'extractionCode', 'actions'];

  searchQuery = signal<string>('');

  filteredAnnouncements = computed(() => {
    return this.useCase.announcements();
  });

  ngOnInit(): void {
    this.useCase.loadData();
    
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(keyword => {
      this.useCase.setKeyword(keyword);
    });
    
    // Auto-rotate top announcements
    this.intervalId = setInterval(() => {
      const items = this.topAnnouncements();
      if (items.length > 1) {
        this.currentAnnouncementIndex.update(i => (i + 1) % items.length);
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  openAddAnnouncementDialog(): void {
    this.dialog.open(AddAnnouncementDialog, {
      width: '600px',
      disableClose: true
    });
  }

  copyLink(item: NoticeBoardItem): void {
    // track view when copied
    this.useCase.trackItemView(item.id);
    this.snackBar.open('已复制到剪贴板', '关闭', { duration: 2000, horizontalPosition: 'center', verticalPosition: 'top' });
  }

  deleteAnnouncement(item: any): void {
    if (confirm('确定要删除此公告吗？')) {
      this.useCase.deleteAnnouncement(item.id);
    }
  }

  onPageChange(event: PageEvent): void {
    this.useCase.changePage(event.pageIndex, event.pageSize);
  }
}
