import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-event',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEventComponent {

  // Form State
  title = signal("Sarah's Birthday Party");
  date = signal<Date | null>(new Date('2024-12-25'));
  time = signal("18:00");

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

  // Default Images
  images = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBOWlV08KkBqLG3xtNSj0FHGZvE0qSKr3e3ZyOay4Is9q6OvDXhCcaf9LTVLF105k6kkYY0JlfkGI1cA7hf7-p77sd2q6Ac1Xrp9D-nUZpXmxTvTBXdLvv_E0vsNc1HplwDn12vuvgxrFMLe6_6l-DXm42GqZt5DmqY-mAXNVk3T7uyOlTycdwZDlZ_63PggFrgFz8WAuCcQxf9xaCdJMagcEI9NwNL2YcjVUcDWrXRhgankxsrx_dl5nIKzjlj9obwBoPRH-OYLUlZ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuADa46j_6tKk6hJygeqtaBtsuARpEtp7eMLHTq1sfb58X3nisb7n2JVyIDs7VI-NPrQQ_DZB_l4tU-btNDvWMbHvReGx39ca2QXgxPDBf_gb-RJ8eXpDlqOLh-78PCJnQKxyvByFp6kCApx6CQB817H8LhKwtU5R9SPyd2IIblhBjQh-vI2q26ETbP-sSpluz3g6iLt8WM0R0YuI-EG6PE8w24o2ZyUs40dbdCHB6M3XIjqm4U2l4XZWg7y0IOJaVU2ph22rSGI1-bb',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAI_a-_if4eHdIJVWeV1UmdRmQw4uUZVIa9_nBQWDFKjL3KcqQLXhEkyZLOuo3qNlszlfcBXBQRploPz1ZY_y89tS2otXUbf_JmWJrieFYDQAcrVo7nojCGgmnTuwTgqedCeQYoMrb9Fb2_23Xeqmtb51vwVvw_SC9lEe167I8PkXu-hYKdLHkojWnFl6GIPAu08Ly5OehPe_Wlq8t5YW1ELHM-KAA0CgelAtKMOSj75ZEJwPIuTLvR-oA8iocS7Wsi63gTuYdO00w0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA67RW7fH9-UYBGb9iJ5Z_CYPbImyBmvB6TOJ-t2Sr69kGGMVb0fl_jvw5SI44TcjsbXM0OgrFBNxAzJi8ZMZOZoBWGEuIldt1YAxUbBk_SLdDzitgqz4cAQOZJobCuKI0nz8zuHSXx0X7C8Zn1c8OHKB2IIzeXS1tNKiCeY9vO5Ep9zJbZZyVoLnhjFh3WbQ03EXJoC6OtEAGEZ6kGKlfxpvXCOJthGsGXJ93FPIz8_rmYZDYOxVJCYgrZQMKVphMcbXKs1sq9g8wN'
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
}