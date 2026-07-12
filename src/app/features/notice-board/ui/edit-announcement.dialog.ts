import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NoticeBoardUseCase } from '../use-case/notice-board.usecase';
import { TranslateModule } from '@ngx-translate/core';
import { Announcement, AnnouncementRequest } from '../domain/notice-board.model';

@Component({
  selector: 'app-edit-announcement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './edit-announcement.dialog.html'
})
export class EditAnnouncementDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditAnnouncementDialog>);
  private readonly useCase = inject(NoticeBoardUseCase);
  readonly data = inject<{ announcement: Announcement }>(MAT_DIALOG_DATA);

  // 表单定义，包括标题、内容、状态、过期时间和提取码
  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED' | 'EXPIRED', Validators.required],
    expireTime: [''],
    extractionCode: ['', Validators.required]
  });

  ngOnInit(): void {
    const ann = this.data.announcement;
    // 将已有的公告数据回填到表单中
    this.form.patchValue({
      title: ann.title,
      content: ann.content,
      status: ann.status,
      expireTime: this.formatToLocalDateTime(ann.expireTime),
      extractionCode: ann.extractionCode || ''
    });
  }

  /**
   * 将后端的 ISO 时间格式转换为 HTML datetime-local 接收的格式 (YYYY-MM-DDTHH:mm)
   */
  private formatToLocalDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // 提交修改
  submit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const request: AnnouncementRequest = {
        title: raw.title,
        content: raw.content,
        status: raw.status,
        expireTime: raw.expireTime ? new Date(raw.expireTime).toISOString() : undefined,
        extractionCode: raw.extractionCode
      };
      
      // 调用 UseCase 执行更新
      this.useCase.updateAnnouncement(this.data.announcement.id, request, () => {
        this.dialogRef.close(true);
      });
    }
  }
}
