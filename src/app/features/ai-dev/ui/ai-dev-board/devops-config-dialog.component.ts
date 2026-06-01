import { Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AiDevRepository } from '../../adapter/ai-dev.repository';
import { firstValueFrom } from 'rxjs';

/**
 * ms-ai-devops 常驻服务配置对话框组件。
 */
@Component({
  selector: 'app-devops-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './devops-config-dialog.component.html',
  styleUrls: ['./devops-config-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevopsConfigDialogComponent implements OnInit {
  public readonly dialogRef = inject(MatDialogRef<DevopsConfigDialogComponent>);
  public readonly data = inject(MAT_DIALOG_DATA) as { path: string; url: string };
  private readonly repository = inject(AiDevRepository);
  private readonly cdr = inject(ChangeDetectorRef);

  devopsPath = '';
  devopsUrl = '';

  isTesting = false;
  testStatus: 'SUCCESS' | 'FAILED' | null = null;

  ngOnInit(): void {
    this.devopsPath = this.data.path || '';
    this.devopsUrl = this.data.url || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close({
      path: this.devopsPath.trim(),
      url: this.devopsUrl.trim()
    });
  }

  async onTestConnection(): Promise<void> {
    const url = this.devopsUrl.trim();
    if (!url) return;

    this.isTesting = true;
    this.testStatus = null;
    this.cdr.markForCheck();

    try {
      await firstValueFrom(this.repository.checkHealth(url));
      this.testStatus = 'SUCCESS';
    } catch (err) {
      this.testStatus = 'FAILED';
    } finally {
      this.isTesting = false;
      this.cdr.markForCheck();
    }
  }
}
