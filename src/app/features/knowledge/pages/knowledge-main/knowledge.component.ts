import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnDestroy, OnInit, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Topic } from '../../../../core/domain/knowledge/knowledge.model';
import { SidebarService } from '../../../../core/infrastructure/services/sidebar.service';
import { KnowledgeUseCase } from '../../../../core/use-cases/knowledge/knowledge.usecase';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title class="m-0 text-lg font-medium">{{ data.title }}</h2>
    <mat-dialog-content class="mt-4">
      <p class="text-neutral-600">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="mb-2 mr-2">
      <button mat-button mat-dialog-close class="mr-2">{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">{{ 'COMMON.DELETE' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string }
  ) { }
}

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule, TranslateModule],
  templateUrl: './knowledge.component.html'
})
export class KnowledgeComponent implements OnInit, OnDestroy {
  protected useCase = inject(KnowledgeUseCase);
  private sidebarService = inject(SidebarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  protected get isSidebarOpen() { return this.sidebarService.isOpen; }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  // Recipe Build Task states
  private pollingInterval: any = null;
  buildTaskId = signal<string | null>(null);
  buildStatus = signal<string>('IDLE'); // IDLE, RUNNING, SUCCESS, FAILED
  totalCount = signal<number>(0);
  processedCount = signal<number>(0);
  currentItemName = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  buildPercent = signal<number>(0);

  // UI-only states
  editingTopicId = signal<string | null>(null);
  isCreateModalOpen = signal<boolean>(false);

  newTopicName = signal('');
  newTopicDesc = signal('');
  newTopicVisibility = signal('全员公开');
  newTopicTemplate = signal('空白模板');

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async startRecipeBuild() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.buildStatus.set('RUNNING');
    this.totalCount.set(0);
    this.processedCount.set(0);
    this.currentItemName.set('正在连接调度服务...');
    this.errorMessage.set(null);
    this.buildPercent.set(0);

    try {
      const res = await this.useCase.triggerRecipeBuild();
      if (res && res.taskId) {
        this.buildTaskId.set(res.taskId);
        this.startPollingProgress(res.taskId);
      } else {
        throw new Error('未获取到任务ID');
      }
    } catch (e: any) {
      this.buildStatus.set('FAILED');
      this.errorMessage.set(e.message || '启动向量构建任务失败');
      this.currentItemName.set(null);
    }
  }

  private startPollingProgress(taskId: string) {
    this.pollingInterval = setInterval(async () => {
      try {
        const progress = await this.useCase.getBuildProgress(taskId);
        if (progress) {
          this.buildStatus.set(progress.status);
          this.totalCount.set(progress.totalCount || 0);
          this.processedCount.set(progress.processedCount || 0);
          this.currentItemName.set(progress.currentItemName || null);
          this.errorMessage.set(progress.errorMessage || null);

          const total = progress.totalCount || 0;
          const processed = progress.processedCount || 0;
          if (total > 0) {
            this.buildPercent.set(Math.round((processed / total) * 100));
          } else {
            this.buildPercent.set(0);
          }

          if (progress.status === 'SUCCESS' || progress.status === 'FAILED') {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            // Refresh topics
            this.useCase.refreshTopics();
            const currentTopicId = this.selectedTopicId();
            if (currentTopicId) {
              this.useCase.selectTopic(currentTopicId);
            }
          }
        }
      } catch (e: any) {
        console.error('Error polling recipe build progress:', e);
      }
    }, 15000);
  }

  // Delegated states for template access
  topics = this.useCase.topics;
  documents = this.useCase.documents;
  selectedTopicId = this.useCase.selectedTopicId;
  selectedTopic = this.useCase.selectedTopic;
  filteredDocuments = this.useCase.filteredDocuments;
  isSubmitting = this.useCase.isSubmitting;
  isUploading = this.useCase.isUploading;
  searchQuery = this.useCase.searchQuery;

  // Pagination states delegated to UseCase
  currentPage = this.useCase.currentPage;
  pageSize = this.useCase.pageSize;
  pageSizeOptions = [5, 10, 20, 50];

  paginatedDocuments = computed(() => {
    return this.filteredDocuments();
  });

  totalDocuments = this.useCase.totalDocuments;
  
  totalPages = computed(() => {
    const total = this.totalDocuments();
    const size = this.pageSize();
    return Math.ceil(total / size) || 1;
  });

  startIndex = computed(() => this.currentPage() * this.pageSize() + 1);
  endIndex = computed(() => {
    const end = (this.currentPage() + 1) * this.pageSize();
    const total = this.totalDocuments();
    return end > total ? total : end;
  });

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    const delta = 1;
    const left = current - delta;
    const right = current + delta;
    
    for (let i = 0; i < total; i++) {
      if (i === 0 || i === total - 1 || (i >= left && i <= right)) {
        pages.push(i);
      }
    }
    
    const visible: (number | null)[] = [];
    let prev: number | null = null;
    for (const p of pages) {
      if (prev !== null && p - prev > 1) {
        visible.push(null);
      }
      visible.push(p);
      prev = p;
    }
    return visible;
  });

  constructor() {
    // Reset page to 0 when search query changes
    effect(() => {
      this.searchQuery();
      this.currentPage.set(0);
    });
  }

  ngOnInit() {
    this.useCase.refreshTopics();
    const currentTopicId = this.selectedTopicId();
    if (currentTopicId) {
      this.useCase.selectTopic(currentTopicId);
    }
  }

  selectTopic(id: string) {
    this.useCase.selectTopic(id);
    // 移动端点击后自动收起侧边栏
    if (window.innerWidth < 768) {
      this.sidebarService.setOpen(false);
    }
  }

  openCreateModal() {
    this.resetForm();
    this.editingTopicId.set(null);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(topic: Topic) {
    this.editingTopicId.set(topic.id || null);
    this.newTopicName.set(topic.name);
    this.newTopicDesc.set(topic.desc || topic.description || '');
    this.newTopicVisibility.set(topic.visibleScope || '全员公开');
    this.newTopicTemplate.set(topic.templateName || '空白模板');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
    this.resetForm();
  }

  async confirmCreate() {
    if (this.isSubmitting() || !this.newTopicName().trim()) return;

    const payload = {
      name: this.newTopicName(),
      icon: 'Folder',
      desc: this.newTopicDesc(),
      description: this.newTopicDesc(),
      visibleScope: this.newTopicVisibility(),
      templateName: this.newTopicTemplate()
    };

    try {
      await this.useCase.saveTopic(this.editingTopicId(), payload);
      this.closeCreateModal();
    } catch (e) {
      console.error('Failed to save topic', e);
    }
  }

  async deleteTopic(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('KNOWLEDGE.DELETE_CONFIRM.TOPIC_TITLE'),
        message: this.translate.instant('KNOWLEDGE.DELETE_CONFIRM.TOPIC_MSG')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.useCase.deleteTopic(id);
        } catch (e) {
          console.error('Failed to delete topic', e);
        }
      }
    });
  }

  async deleteDocument(documentId: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('KNOWLEDGE.DELETE_CONFIRM.DOC_TITLE'),
        message: this.translate.instant('KNOWLEDGE.DELETE_CONFIRM.DOC_MSG')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.useCase.deleteDocument(documentId);
        } catch (e) {
          console.error('Failed to delete document', e);
        }
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    const topicId = this.selectedTopicId();
    if (!file || !topicId || this.isUploading()) return;

    try {
      await this.useCase.uploadDocument(topicId, file);
      event.target.value = '';
    } catch (e) {
      console.error('Failed to upload document', e);
    }
  }

  previewDocument(documentId: string) {
    const url = this.useCase.getDocumentPreviewUrl(documentId);
    window.open(url, '_blank');
  }

  resetForm() {
    this.newTopicName.set('');
    this.newTopicDesc.set('');
    this.newTopicVisibility.set('全员公开');
    this.newTopicTemplate.set('空白模板');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case '进行中': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50';
      case '已审阅': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50';
      case '已发布': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700/50';
    }
  }
}
