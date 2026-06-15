import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';

export interface TaskConfigData {
  brainstormRounds: number;
  contextWindow: number;
  isReadOnly: boolean;
}

@Component({
  selector: 'app-task-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule, MatSliderModule],
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-[#1e1f20] text-slate-900 dark:text-slate-200">
      <div class="px-6 py-4 border-b border-slate-200 dark:border-[#444746] flex items-center justify-between bg-slate-50 dark:bg-black/10">
        <h2 class="text-lg font-semibold m-0 flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <mat-icon class="!w-5 !h-5 !text-[20px] flex items-center justify-center">psychology</mat-icon>
          头脑风暴配置
        </h2>
        <button mat-icon-button (click)="close()" class="!text-slate-400 hover:!text-slate-600 dark:hover:!text-slate-200 !w-8 !h-8 flex items-center justify-center transition-colors">
          <mat-icon class="!text-[20px]">close</mat-icon>
        </button>
      </div>
      
      <div class="p-6 flex-1 overflow-y-auto space-y-6">
        <!-- Max Brainstorming Rounds -->
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">最大讨论轮数</span>
            <span class="text-sm font-bold text-purple-600 dark:text-purple-400 min-w-[24px] text-right bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">{{ data.brainstormRounds }}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">设置多轮头脑风暴的最大迭代次数，决定 AI Agent 之间讨论的深度。</p>
          <mat-slider min="1" max="10" step="1" class="w-full mt-2" discrete [disabled]="data.isReadOnly">
            <input matSliderThumb [(ngModel)]="data.brainstormRounds" [disabled]="data.isReadOnly" />
          </mat-slider>
        </div>

        <!-- Context Sliding Window -->
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">滑动窗口条数</span>
            <span class="text-sm font-bold text-purple-600 dark:text-purple-400 min-w-[24px] text-right bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">{{ data.contextWindow }}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">配置给 AI 上下文记忆的保留条数，防止单次 Token 超限。</p>
          <mat-slider min="1" max="5" step="1" class="w-full mt-2" discrete [disabled]="data.isReadOnly">
            <input matSliderThumb [(ngModel)]="data.contextWindow" [disabled]="data.isReadOnly" />
          </mat-slider>
        </div>
      </div>
      
      <div class="px-6 py-4 border-t border-slate-200 dark:border-[#444746] flex justify-end gap-3 bg-slate-50 dark:bg-black/10">
        <button mat-stroked-button (click)="close()" class="border-slate-300 dark:border-slate-600">取消</button>
        <button mat-flat-button color="primary" (click)="save()" [disabled]="data.isReadOnly" class="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <mat-icon class="mr-1">check</mat-icon>保存配置
        </button>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 12px !important;
      overflow: hidden;
    }
  `]
})
export class TaskConfigDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TaskConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskConfigData
  ) {}

  close() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close({
      brainstormRounds: this.data.brainstormRounds,
      contextWindow: this.data.contextWindow
    });
  }
}
