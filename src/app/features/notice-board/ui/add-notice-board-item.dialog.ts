import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { NoticeBoardUseCase } from '../use-case/notice-board.usecase';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-notice-board-item-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './add-notice-board-item.dialog.html'
})
export class AddNoticeBoardItemDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddNoticeBoardItemDialog>);
  private readonly useCase = inject(NoticeBoardUseCase);

  form = this.fb.nonNullable.group({
    targetClient: ['', Validators.required],
    referenceUrl: [''],
    contentUrl: ['', Validators.required],
    expireTime: [new Date(), Validators.required],
    usageDetails: ['']
  });

  submit(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const request = {
        ...formValue,
        expireTime: formValue.expireTime.toISOString()
      };
      
      this.useCase.createNoticeBoardItem(request, () => {
        this.dialogRef.close(true);
      });
    }
  }
}
