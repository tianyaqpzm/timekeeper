import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface Event {
    id: string;
    title: string;
    category: 'Birthday' | 'Anniversary' | 'Holiday' | 'Other';
    date: Date;
    description?: string;
}

@Component({
    selector: 'app-event-edit-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    templateUrl: './event-edit-dialog.component.html',
    styleUrls: ['./event-edit-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventEditDialogComponent {
    @Input() isOpen = false;
    @Input() event: Event | null = null;

    @Output() save = new EventEmitter<Event>();
    @Output() cancel = new EventEmitter<void>();

    onSave(): void {
        if (this.event) {
            this.save.emit(this.event);
        }
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
