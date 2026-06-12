import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AiDevUseCase } from '../../application/ai-dev.usecase';

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
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTaskDialogComponent implements OnInit {
  taskTitle = '';
  taskDescription = '';
  priority = 'Medium';
  constraints = '';
  relatedIssues = '';
  targetBranch = '';

  separatorKeysCodes: number[] = [ENTER, COMMA];
  projectCtrl = new FormControl('');
  filteredProjects: Observable<string[]>;
  affectedProjects: string[] = [];
  allProjects: string[] = ['ms-java-biz', 'ms-ng-view', 'ms-py-agent', 'ms-java-gateway', 'ms-ai-devops', 'ms-project-docs'];

  @ViewChild('projectInput') projectInput!: ElementRef<HTMLInputElement>;
  
  public useCase = inject(AiDevUseCase);

  constructor(
    public dialogRef: MatDialogRef<CreateTaskDialogComponent>
  ) {
    this.filteredProjects = this.projectCtrl.valueChanges.pipe(
      startWith(null),
      map((project: string | null) => (project ? this._filter(project) : this.allProjects.filter(p => !this.affectedProjects.includes(p)).slice()))
    );
  }

  ngOnInit(): void {
    this.useCase.loadProfiles();
  }

  add(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.affectedProjects.includes(value)) {
      this.affectedProjects.push(value);
    }
    event.chipInput!.clear();
    this.projectCtrl.setValue(null);
  }

  remove(project: string): void {
    const index = this.affectedProjects.indexOf(project);
    if (index >= 0) {
      this.affectedProjects.splice(index, 1);
      this.projectCtrl.setValue(null);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.affectedProjects.includes(value)) {
      this.affectedProjects.push(value);
    }
    this.projectInput.nativeElement.value = '';
    this.projectCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allProjects.filter(project => project.toLowerCase().includes(filterValue) && !this.affectedProjects.includes(project));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    const title = this.taskTitle.trim();
    const desc = this.taskDescription.trim();
    if (title && desc) {
      this.dialogRef.close({
        title,
        description: desc,
        priority: this.priority,
        constraints: this.constraints.trim(),
        relatedIssues: this.relatedIssues.trim(),
        targetBranch: this.targetBranch.trim(),
        affectedProjects: this.affectedProjects
      });
    }
  }
}
