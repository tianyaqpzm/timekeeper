import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * 新建 AI 团队开发任务对话框组件。
 */
@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTaskDialogComponent {
  taskDescription = '';

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const desc = this.taskDescription.trim();
    if (desc) {
      this.dialogRef.close(desc);
    }
  }
}
