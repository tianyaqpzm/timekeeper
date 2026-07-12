import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { AiDevAgentProfile } from '../../domain/ai-dev.model';

@Component({
  selector: 'app-agent-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './agent-profile-dialog.component.html',
  styles: [`
    .hide-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentProfileDialogComponent implements OnInit {
  public readonly dialogRef = inject(MatDialogRef<AgentProfileDialogComponent>);
  public readonly data = inject(MAT_DIALOG_DATA) as AiDevAgentProfile;

  profile: Partial<AiDevAgentProfile> = {};
  agentTypes = ['Hermes Agent', 'Antigravity CLI', 'Codex', 'Claude Code', 'GLM', 'MiniMax'];

  get syncPathHint(): string {
    if (this.profile.localSyncPath) {
      // 规范化斜杠为 Windows 格式展示
      return `${this.profile.localSyncPath}/SOUL.md`.replace(/\//g, '\\');
    }
    const role = (this.profile.roleName || '').toLowerCase();
    const isWin = typeof navigator !== 'undefined' && 
      (navigator.platform.indexOf('Win') > -1 || navigator.userAgent.indexOf('Windows') > -1);
    if (isWin) {
      return `%LOCALAPPDATA%\\hermes\\profiles\\${role}\\SOUL.md`;
    }
    return `~/.hermes/profiles/${role}/SOUL.md`;
  }

  get defaultPathPlaceholder(): string {
    const role = (this.profile.roleName || '').toLowerCase();
    const isWin = typeof navigator !== 'undefined' && 
      (navigator.platform.indexOf('Win') > -1 || navigator.userAgent.indexOf('Windows') > -1);
    if (isWin) {
      return `%LOCALAPPDATA%\\hermes\\profiles\\${role}`;
    }
    return `~/.hermes/profiles/${role}`;
  }

  isNew = false;

  ngOnInit(): void {
    this.profile = { ...this.data };
    this.isNew = !this.profile.roleName;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    // 简单校验，如果是新建角色，角色名称不能为空
    if (this.isNew && (!this.profile.roleName || !this.profile.roleName.trim())) {
      alert('Role Name is required');
      return;
    }
    this.dialogRef.close(this.profile);
  }
}
