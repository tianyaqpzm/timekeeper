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
  constructor(private snackBar: MatSnackBar, private router: Router) {
    // Monitor signal changes
    effect(() => {
      const currentDate = this.date();
      const currentTime = this.time();
      // Signals are reactive, any change will trigger this effect
      console.log('Date/Time updated:', currentDate, currentTime);
    });
  }

  // Form State
  title = signal("Sarah's Birthday Party");
  date = signal<Date | null>(new Date('2024-12-25'));
  time = signal("18:00");

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

  // Form validation
  isFormValid(): boolean {
    return !!(
      this.title() &&
      this.date() &&
      this.time() &&
      this.selectedCategory() &&
      (this.selectedCategory() !== 'Custom' || this.customCategoryName())
    );
  }

  // Save event
  saveEvent(): void {
    if (!this.isFormValid()) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Create event object
    const newEvent = {
      id: Date.now().toString(),
      title: this.title(),
      category: this.selectedCategory() === 'Custom' ? this.customCategoryName() : this.selectedCategory(),
      date: this.date(),
      time: this.time(),
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
    this.snackBar.open('Event created successfully!', 'Close', { duration: 3000 });

    // Navigate back to dashboard
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 500);
  }
}