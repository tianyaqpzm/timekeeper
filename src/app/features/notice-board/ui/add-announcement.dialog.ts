import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NoticeBoardUseCase } from '../use-case/notice-board.usecase';
import { TranslateModule } from '@ngx-translate/core';
import { AnnouncementRequest } from '../domain/notice-board.model';

@Component({
  selector: 'app-add-announcement-dialog',
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
  templateUrl: './add-announcement.dialog.html'
})
export class AddAnnouncementDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddAnnouncementDialog>);
  private readonly useCase = inject(NoticeBoardUseCase);

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED', Validators.required],
    expireTime: [''],
    extractionCode: ['', Validators.required]
  });

  submit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const request: AnnouncementRequest = {
        title: raw.title,
        content: raw.content,
        status: raw.status as 'DRAFT' | 'PUBLISHED' | 'EXPIRED',
        expireTime: raw.expireTime ? new Date(raw.expireTime).toISOString() : undefined,
        extractionCode: raw.extractionCode
      };
      this.useCase.createAnnouncement(request, () => {
        this.dialogRef.close(true);
      });
    }
  }
}
