import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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

  ngOnInit(): void {
    this.profile = { ...this.data };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close(this.profile);
  }
}
