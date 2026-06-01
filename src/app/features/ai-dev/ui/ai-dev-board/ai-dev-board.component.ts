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

  openCreateTaskDialog(): void {
    const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
      width: '500px',
      panelClass: ['custom-dialog-container', 'animate-fade-in-up']
    });

    dialogRef.afterClosed().subscribe(async (description: string) => {
      if (description) {
        this.isCreating = true;
        await this.useCase.createTask(description);
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
