import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { TimerService } from '../../core/services/timer.service';

@Component({
  selector: 'app-create-event',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEventComponent {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private timerService: TimerService
  ) {
    // Monitor signal changes for live preview countdown
    effect(() => {
      const currentDate = this.date();
      const currentTime = this.time();
      this.updatePreviewCountdown();
    });
  }

  // Form State
  title = signal("Sarah's Birthday Party");
  date = signal<Date | null>(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  time = signal("18:00");
  description = signal('');
  repeatYearly = signal(true);

  // Preview countdown
  previewCountdown = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  // Event handlers for form inputs
  onTitleChange(value: string): void {
    this.title.set(value);
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const selectedDate = new Date(input.value);
      // Ensure valid date
      if (!isNaN(selectedDate.getTime())) {
        this.date.set(selectedDate);
      }
    }
  }

  onTimeChange(value: string): void {
    this.time.set(value);
    this.updatePreviewCountdown();
  }

  onDescriptionChange(value: string): void {
    this.description.set(value);
  }

  // Update preview countdown
  private updatePreviewCountdown(): void {
    if (this.date() && this.time()) {
      const targetDate = this.getTargetDateTime();
      if (targetDate) {
        const timeParts = this.timerService.getTimeParts(targetDate);
        this.previewCountdown.set(timeParts);
      }
    } else {
      // Reset to zeros if no valid date/time
      this.previewCountdown.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
    }
  }

  // Get combined date and time
  private getTargetDateTime(): Date | null {
    if (!this.date()) return null;

    const dateValue = new Date(this.date()!);
    const [hours, minutes] = this.time().split(':').map(Number);

    dateValue.setHours(hours, minutes, 0, 0);
    return dateValue;
  }

  // Format time from Date for Material time input
  getTimeFromDate(): string {
    if (!this.date()) return this.time();
    const date = this.date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Pre-defined categories
  categories = signal([
    'Birthday',
    'Anniversary',
    'Holiday',
    'Vacation',
    'Concert',
    'Graduation',
    'Retirement'
  ]);

  // State for the selected category
  selectedCategory = signal('Birthday');
  customCategoryName = signal('');

  // Computed display for category in preview
  displayCategory = computed(() => {
    if (this.selectedCategory() === 'Custom') {
      return this.customCategoryName() || 'Custom Event';
    }
    return this.selectedCategory();
  });

  // Debug: Show validation details
  validationDetails = computed(() => {
    return {
      hasTitle: !!this.title()?.trim(),
      hasDate: !!this.date(),
      hasTime: !!this.time(),
      hasCategory: !!this.selectedCategory(),
      isFutureDateTime: this.date() && this.time() ?
        (this.getTargetDateTime()?.getTime() || 0) > Date.now() : false,
      error: this.getValidationError()
    };
  });

  // Appearance Logic
  appearanceType = signal<'image' | 'color'>('image');

  // Default Images (local paths)
  images = [
    '/images/backgrounds/customize-bg1.jpg',
    '/images/backgrounds/customize-bg2.jpg',
    '/images/backgrounds/customize-bg3.jpg',
    '/images/backgrounds/birthday-celebration.jpg'
  ];

  // Colors
  colors = [
    '#2b6cee', // Primary
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#1e293b', // Slate
    '#000000', // Black
  ];

  selectedImage = signal(this.images[3]);
  selectedColor = signal(this.colors[0]);

  scrollToPreview() {
    const element = document.getElementById('preview-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onCategoryChange(value: string) {
    this.selectedCategory.set(value);
  }

  setAppearanceType(type: 'image' | 'color') {
    this.appearanceType.set(type);
  }

  selectImage(img: string) {
    this.selectedImage.set(img);
    this.appearanceType.set('image');
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
    this.appearanceType.set('color');
  }

  toggleRepeatYearly(checked: boolean) {
    this.repeatYearly.set(checked);
  }

  // Form validation
  isFormValid(): boolean {
    const hasTitle = !!this.title()?.trim();
    const hasDate = !!this.date();
    const hasTime = !!this.time();
    const hasCategory = !!this.selectedCategory() &&
      (this.selectedCategory() !== 'Custom' || !!this.customCategoryName()?.trim());

    // Check if date and time combination is in the future
    let isFutureDateTime = false;
    if (this.date() && this.time()) {
      const targetDateTime = this.getTargetDateTime();
      if (targetDateTime) {
        isFutureDateTime = targetDateTime.getTime() > Date.now();
      }
    }

    return hasTitle && hasDate && hasTime && hasCategory && isFutureDateTime;
  }

  // Get validation error message
  getValidationError(): string {
    if (!this.title()?.trim()) return 'Title is required';
    if (!this.date()) return 'Date is required';
    if (!this.time()) return 'Time is required';
    if (!this.selectedCategory()) return 'Category is required';
    if (this.selectedCategory() === 'Custom' && !this.customCategoryName()?.trim()) {
      return 'Custom category name is required';
    }
    if (this.date() && this.time()) {
      const targetDateTime = this.getTargetDateTime();
      if (targetDateTime && targetDateTime.getTime() <= Date.now()) {
        return 'Date and time must be in the future';
      }
    }
    return '';
  }

  // Save event
  saveEvent(): void {
    console.log('Save button clicked!');
    console.log('Form validation:', {
      title: this.title(),
      date: this.date(),
      time: this.time(),
      category: this.selectedCategory(),
      isValid: this.isFormValid(),
      error: this.getValidationError()
    });

    if (!this.isFormValid()) {
      const error = this.getValidationError();
      this.snackBar.open(error || 'Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Create event object
    const newEvent = {
      id: Date.now().toString(),
      title: this.title().trim(),
      category: this.selectedCategory() === 'Custom' ? this.customCategoryName().trim() : this.selectedCategory(),
      date: this.date(),
      time: this.time(),
      description: this.description().trim(),
      repeatYearly: this.repeatYearly(),
      appearance: {
        type: this.appearanceType(),
        value: this.appearanceType() === 'image' ? this.selectedImage() : this.selectedColor()
      },
      createdAt: new Date()
    };

    // Save to localStorage
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));

    // Show success message
    this.snackBar.open('🎉 Event created successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // Navigate back to dashboard
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 500);
  }
}