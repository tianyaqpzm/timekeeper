import { Component, inject, OnInit, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { NoticeBoardAdapter } from '../../adapter/notice-board.adapter';
import { Announcement, AnnouncementRequest } from '../../domain/notice-board.model';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/infrastructure/services/auth.service';
import { environment } from '../../../../../environments/environment';

/** Markdown 工具栏操作定义 */
interface ToolbarAction {
  icon: string;
  tooltip: string;
  action: () => void;
  divider?: boolean;
}

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownComponent,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.css']
})
export class AnnouncementDetailComponent implements OnInit {
  @ViewChild('contentTextarea') contentTextareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  private route = inject(ActivatedRoute);
  private adapter = inject(NoticeBoardAdapter);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  announcementId = signal<number | null>(null);
  extractionCode = signal<string>('');
  showCode = signal(false);

  isVerified = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);
  errorMsg = signal<string | null>(null);
  announcement = signal<Announcement | null>(null);

  // 编辑状态
  isEditing = signal(false);
  editTitle = signal('');
  editContent = signal('');
  showPreview = signal(false);

  /** 拖拽 hover 状态 */
  isDragOver = signal(false);

  /** 只有已登录用户才能看到编辑按钮 */
  readonly canEdit = computed(() => this.authService.isLoggedIn());

  /** Markdown 工具栏按钮定义 */
  readonly toolbarActions: ToolbarAction[] = [
    { icon: 'format_bold',        tooltip: '粗体 (Ctrl+B)',   action: () => this.wrapSelection('**', '**') },
    { icon: 'format_italic',      tooltip: '斜体 (Ctrl+I)',   action: () => this.wrapSelection('*', '*') },
    { icon: 'strikethrough_s',    tooltip: '删除线',           action: () => this.wrapSelection('~~', '~~') },
    { icon: 'format_list_bulleted', tooltip: '无序列表',       action: () => this.insertLinePrefix('- '), divider: true },
    { icon: 'format_list_numbered', tooltip: '有序列表',      action: () => this.insertLinePrefix('1. ') },
    { icon: 'format_quote',       tooltip: '引用块',           action: () => this.insertLinePrefix('> ') },
    { icon: 'code',               tooltip: '行内代码',         action: () => this.wrapSelection('`', '`') },
    { icon: 'data_object',        tooltip: '代码块',           action: () => this.insertCodeBlock(), divider: true },
    { icon: 'link',               tooltip: '插入链接',         action: () => this.insertLink() },
    { icon: 'image',              tooltip: '插入图片 URL',     action: () => this.triggerImageUrlInsert() },
    { icon: 'upload',             tooltip: '上传图片',         action: () => this.fileInputRef?.nativeElement.click() },
  ];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.announcementId.set(Number(idParam));
    }
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam) {
      this.extractionCode.set(codeParam);
      this.showCode.set(true);
    }
  }

  toggleShowCode() {
    this.showCode.update(v => !v);
  }

  verifyAndLoad() {
    const id = this.announcementId();
    const code = this.extractionCode();
    if (!id || !code.trim()) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.adapter.getAnnouncementDetail(id, code).pipe(
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('NOTICE_BOARD.DETAIL.ERROR_INVALID_CODE');
        } else if (err.status === 404) {
          this.errorMsg.set('NOTICE_BOARD.DETAIL.ERROR_NOT_FOUND');
        } else {
          this.errorMsg.set('NOTICE_BOARD.DETAIL.ERROR_SERVER');
        }
        return of(null);
      })
    ).subscribe(data => {
      this.isLoading.set(false);
      if (data) {
        this.announcement.set(data);
        this.isVerified.set(true);
      }
    });
  }

  enterEditMode() {
    const ann = this.announcement();
    if (!ann) return;
    this.editTitle.set(ann.title);
    this.editContent.set(ann.content);
    this.showPreview.set(false);
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.showPreview.set(false);
  }

  togglePreview() {
    this.showPreview.update(v => !v);
  }

  saveEdit() {
    const id = this.announcementId();
    const ann = this.announcement();
    if (!id || !ann) return;

    const title = this.editTitle().trim();
    const content = this.editContent().trim();
    if (!title || !content) {
      this.snackBar.open('标题和内容不能为空', '关闭', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);
    const request: AnnouncementRequest = {
      title,
      content,
      status: ann.status,
      expireTime: ann.expireTime,
      extractionCode: ann.extractionCode ?? ''
    };

    this.adapter.updateAnnouncement(id, request).pipe(
      catchError(err => {
        if (err.status === 403) {
          this.snackBar.open('权限不足，请联系管理员', '关闭', { duration: 4000 });
        } else {
          this.snackBar.open('保存失败，请稍后重试', '关闭', { duration: 3000 });
        }
        this.isSaving.set(false);
        return of(null);
      })
    ).subscribe(updated => {
      this.isSaving.set(false);
      if (updated) {
        this.announcement.set(updated);
        this.isEditing.set(false);
        this.showPreview.set(false);
        this.snackBar.open('✅ 保存成功', '关闭', { duration: 2000 });
      }
    });
  }

  // ─── 图片上传 ────────────────────────────────────────────────────────────

  /** 文件选择框改变（点击上传） */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadImageFile(file);
      input.value = ''; // 清空，允许重复上传同名文件
    }
  }

  /** 拖拽进入 */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /** 拖拽离开 */
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  /** 拖拽放置 */
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.uploadImageFile(file);
    }
  }

  /** 粘贴事件（Ctrl+V 粘贴图片） */
  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) this.uploadImageFile(file);
        break;
      }
    }
  }

  /** 核心：上传图片文件，成功后将 Markdown 插入到光标位置 */
  private uploadImageFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('图片不能超过 10MB', '关闭', { duration: 3000 });
      return;
    }

    this.isUploading.set(true);
    const placeholderAlt = file.name.replace(/\.[^.]+$/, '');

    this.adapter.uploadImage(file).pipe(
      catchError(() => {
        this.snackBar.open('图片上传失败', '关闭', { duration: 3000 });
        this.isUploading.set(false);
        return of(null);
      })
    ).subscribe(result => {
      this.isUploading.set(false);
      if (result?.url) {
        // 相对路径 → 拼接 gateway 完整 URL
        const fullUrl = `${environment.VITE_GATEWAY_URL}${result.url}`;
        this.insertAtCursor(`![${placeholderAlt}](${fullUrl})`);
        this.snackBar.open('🖼 图片上传成功', '关闭', { duration: 2000 });
      }
    });
  }

  // ─── Markdown Toolbar Helpers ────────────────────────────────────────────

  /** 在选中文本两侧包裹语法符号 */
  private wrapSelection(before: string, after: string) {
    const ta = this.contentTextareaRef?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    this.spliceContent(start, end, replacement);
    // 移动光标到内容中间
    setTimeout(() => {
      const cursorPos = start + before.length + (selected || 'text').length;
      ta.setSelectionRange(cursorPos, cursorPos);
      ta.focus();
    });
  }

  /** 在行首插入前缀 */
  private insertLinePrefix(prefix: string) {
    const ta = this.contentTextareaRef?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    this.spliceContent(lineStart, lineStart, prefix);
    setTimeout(() => { ta.focus(); });
  }

  /** 插入代码块 */
  private insertCodeBlock() {
    const ta = this.contentTextareaRef?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const block = `\`\`\`\n${selected || 'code'}\n\`\`\``;
    this.spliceContent(start, end, block);
    setTimeout(() => { ta.focus(); });
  }

  /** 插入链接 */
  private insertLink() {
    const ta = this.contentTextareaRef?.nativeElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const replacement = `[${selected || '链接文字'}](https://)`;
    this.spliceContent(start, end, replacement);
    setTimeout(() => { ta.focus(); });
  }

  /** 弹出 URL prompt 插入图片 */
  private triggerImageUrlInsert() {
    const url = window.prompt('请输入图片 URL：');
    if (url?.trim()) {
      const alt = window.prompt('图片描述（可选）：') || 'image';
      this.insertAtCursor(`![${alt}](${url.trim()})`);
    }
  }

  /** 在当前光标位置插入文字 */
  private insertAtCursor(text: string) {
    const ta = this.contentTextareaRef?.nativeElement;
    if (!ta) {
      this.editContent.update(c => c + '\n' + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    this.spliceContent(start, end, text);
    setTimeout(() => {
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
      ta.focus();
    });
  }

  /** 替换 textarea 内容中 [start, end) 范围的文字，同步更新 Signal */
  private spliceContent(start: number, end: number, replacement: string) {
    const current = this.editContent();
    const next = current.substring(0, start) + replacement + current.substring(end);
    this.editContent.set(next);
  }
}
