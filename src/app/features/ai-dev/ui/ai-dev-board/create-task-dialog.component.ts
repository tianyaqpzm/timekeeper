import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * 新建 AI 团队开发任务对话框组件。
 */
@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule
  ],
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTaskDialogComponent {
  taskDescription = '';

  separatorKeysCodes: number[] = [ENTER, COMMA];
  projectCtrl = new FormControl('');
  filteredProjects: Observable<string[]>;
  relatedWorkspaces: string[] = [];
  allProjects: string[] = ['ms-java-biz', 'ms-ng-view', 'ms-py-agent', 'ms-java-gateway', 'ms-ai-devops', 'ms-project-docs'];

  @ViewChild('projectInput') projectInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>
  ) {
    this.filteredProjects = this.projectCtrl.valueChanges.pipe(
      startWith(null),
      map((project: string | null) => (project ? this._filter(project) : this.allProjects.filter(p => !this.relatedWorkspaces.includes(p)).slice()))
    );
  }

  add(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.relatedWorkspaces.includes(value)) {
      this.relatedWorkspaces.push(value);
    }
    event.chipInput!.clear();
    this.projectCtrl.setValue(null);
  }

  remove(project: string): void {
    const index = this.relatedWorkspaces.indexOf(project);
    if (index >= 0) {
      this.relatedWorkspaces.splice(index, 1);
      this.projectCtrl.setValue(null);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.relatedWorkspaces.includes(value)) {
      this.relatedWorkspaces.push(value);
    }
    this.projectInput.nativeElement.value = '';
    this.projectCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allProjects.filter(project => project.toLowerCase().includes(filterValue) && !this.relatedWorkspaces.includes(project));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const desc = this.taskDescription.trim();
    if (desc) {
      this.dialogRef.close({ description: desc, relatedWorkspaces: this.relatedWorkspaces });
    }
  }
}
