import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiDevUseCase } from '../../application/ai-dev.usecase';
import { AiDevTask, AiDevTaskStatus } from '../../domain/ai-dev.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteConfirmDialogComponent } from '../../../chat/delete-confirm-dialog.component';
import { CreateTaskDialogComponent } from './create-task-dialog.component';
import { DevopsConfigDialogComponent } from './devops-config-dialog.component';

@Component({
  selector: 'app-ai-dev-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DevopsConfigDialogComponent
  ],
  templateUrl: './ai-dev-board.component.html',
  styleUrls: ['./ai-dev-board.component.css']
})
export class AiDevBoardComponent implements OnInit, OnDestroy {
  public readonly useCase = inject(AiDevUseCase);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  
  // Expose enum to template
  public AiDevTaskStatus = AiDevTaskStatus;

  isCreating = false;
  devopsPath = '';
  devopsUrl = '';

  private pollInterval: any;

  ngOnInit(): void {
    this.useCase.loadTasks();
    this.devopsPath = this.useCase.msAiDevopsPath();
    this.devopsUrl = this.useCase.msAiDevopsUrl();
    this.useCase.checkDevopsConnection();
    
    // Poll every 15 seconds
    this.pollInterval = setInterval(() => {
      this.useCase.loadTasks();
      this.useCase.checkDevopsConnection();
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  openDevopsConfigDialog(): void {
    const dialogRef = this.dialog.open(DevopsConfigDialogComponent, {
      width: '500px',
      panelClass: ['custom-dialog-container', 'animate-fade-in-up'],
      data: {
        path: this.useCase.msAiDevopsPath(),
        url: this.useCase.msAiDevopsUrl()
      }
    });

    dialogRef.afterClosed().subscribe((result: { path: string; url: string }) => {
      if (result) {
        this.useCase.updateDevopsConfig(result.path, result.url);
      }
    });
  }

  getTasksByStatus(status: AiDevTaskStatus): AiDevTask[] {
    return this.useCase.tasks().filter(t => t.status === status);
  }

  getTasksByStatuses(statuses: AiDevTaskStatus[]): AiDevTask[] {
    return this.useCase.tasks().filter(t => statuses.includes(t.status));
  }

  getStatusBadgeClass(status: AiDevTaskStatus): string {
    switch (status) {
      case AiDevTaskStatus.PENDING:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      case AiDevTaskStatus.STARTING:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case AiDevTaskStatus.PLANNING:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case AiDevTaskStatus.BRAINSTORMING:
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800';
      case AiDevTaskStatus.RUNNING:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case AiDevTaskStatus.GENERATING:
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case AiDevTaskStatus.EVALUATING:
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      case AiDevTaskStatus.WAITING_ON_APPROVAL:
      case AiDevTaskStatus.WAITING_RESUME:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case AiDevTaskStatus.COMPLETED:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case AiDevTaskStatus.ROLLED_BACK:
      case AiDevTaskStatus.ROLLBACK_REQUESTED:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case AiDevTaskStatus.FAILED:
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getStatusLabel(status: AiDevTaskStatus): string {
    switch (status) {
      case AiDevTaskStatus.PENDING: return 'Pending Pickup';
      case AiDevTaskStatus.STARTING: return 'Starting';
      case AiDevTaskStatus.PLANNING: return 'Planning';
      case AiDevTaskStatus.BRAINSTORMING: return 'Brainstorming';
      case AiDevTaskStatus.RUNNING: return 'Running';
      case AiDevTaskStatus.GENERATING: return 'Generating';
      case AiDevTaskStatus.EVALUATING: return 'Evaluating';
      case AiDevTaskStatus.WAITING_ON_APPROVAL: return 'Awaiting Approval';
      case AiDevTaskStatus.WAITING_RESUME: return 'Awaiting Resume';
      case AiDevTaskStatus.COMPLETED: return 'Completed';
      case AiDevTaskStatus.ROLLED_BACK: return 'Rolled Back';
      case AiDevTaskStatus.ROLLBACK_REQUESTED: return 'Rollback Requested';
      case AiDevTaskStatus.FAILED: return 'Failed';
      default: return status;
    }
  }

  openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '500px',
      panelClass: ['custom-dialog-container', 'animate-fade-in-up']
    });

    dialogRef.afterClosed().subscribe(async (result: { description: string, relatedWorkspaces: string[] } | undefined) => {
      if (result && result.description) {
        this.isCreating = true;
        await this.useCase.createTask(result.description, result.relatedWorkspaces);
        this.isCreating = false;
      }
    });
  }

  onResume(taskId: string): void {
    this.useCase.resumeTask(taskId);
  }

  onRollback(taskId: string): void {
    this.useCase.rollbackTask(taskId);
  }

  onReopen(taskId: string): void {
    this.useCase.reopenTask(taskId);
  }

  onDeleteTask(taskId: string, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      panelClass: 'custom-dialog-container',
      data: {
        title: 'AI_DEV.DELETE_TITLE',
        message: 'AI_DEV.DELETE_CONFIRM'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.useCase.deleteTask(taskId);
      }
    });
  }

  openChat(taskId: string): void {
    window.open(`/#/ai-dev/chat/${taskId}`, '_blank');
  }
}
