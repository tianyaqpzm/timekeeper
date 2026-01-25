import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TimeLimitedEvent } from '../../../core/services/event.service';

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
    providers: [provideNativeDateAdapter()],
    templateUrl: './event-edit-dialog.component.html',
    styleUrls: ['./event-edit-dialog.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventEditDialogComponent {
    @Input() isOpen = false;
    @Input() event: TimeLimitedEvent | null = null;

    @Output() save = new EventEmitter<TimeLimitedEvent>();
    @Output() cancel = new EventEmitter<void>();

    onSave(): void {
        console.log('Save button clicked!');
        if (this.event) {
            console.log('Event data:', this.event);
            // Ensure date is properly formatted
            const updatedEvent = {
                ...this.event,
                date: this.event.date instanceof Date ? this.event.date : new Date(this.event.date)
            };
            console.log('Emitting updated event:', updatedEvent);
            this.save.emit(updatedEvent as TimeLimitedEvent);
        } else {
            console.log('No event to save!');
        }
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
