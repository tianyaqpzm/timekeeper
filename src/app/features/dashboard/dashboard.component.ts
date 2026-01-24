import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { EventEditDialogComponent } from './event-edit-dialog/event-edit-dialog.component';

interface Event {
  id: string;
  title: string;
  category: 'Birthday' | 'Anniversary' | 'Holiday' | 'Other';
  date: Date;
  description?: string;
  daysUntil?: number;
  hoursUntil?: number;
  minutesUntil?: number;
  secondsUntil?: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    EventEditDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {

  // 1. 将全局 String 对象赋值给一个组件属性
  // protected readonly 是一种好习惯，表明它只用于模板且不应被修改
  protected readonly String = String;

  // Sample events data
  private sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Christmas',
      category: 'Holiday',
      date: new Date('2024-12-25'),
      description: 'Celebrating the holiday season'
    },
    {
      id: '2',
      title: 'Wedding Anniversary',
      category: 'Anniversary',
      date: new Date('2024-09-12'),
      description: 'Our special day'
    },
    {
      id: '3',
      title: "Mom's Birthday",
      category: 'Birthday',
      date: new Date('2024-08-28'),
      description: 'Mom turns a year older'
    }
  ];

  // Signals for state management
  allEvents = signal<Event[]>(this.sampleEvents);
  searchQuery = signal('');
  selectedCategory = signal<string | null>(null);
  editingEvent = signal<Event | null>(null);
  showEditDialog = signal(false);

  // Computed properties
  filteredEvents = computed(() => {
    let result = this.allEvents();

    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (this.selectedCategory()) {
      result = result.filter(event => event.category === this.selectedCategory());
    }

    return result;
  });

  // Statistics
  totalEvents = computed(() => this.allEvents().length);
  upcomingThisMonth = computed(() => {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.allEvents().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= monthEnd;
    }).length;
  });

  nextEvent = computed(() => {
    const now = new Date();
    const upcoming = this.allEvents()
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0]?.title || 'None';
  });

  // Auto-update countdown every second
  constructor() {
    effect(() => {
      const interval = setInterval(() => {
        // Trigger re-computation of filtered events to update timers
        this.allEvents.set([...this.allEvents()]);
      }, 1000);

      // Cleanup interval on component destroy
      return () => clearInterval(interval);
    });
  }

  // Methods
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  filterByCategory(category: string | null): void {
    this.selectedCategory.set(category);
  }

  calculateTimeUntil(date: Date): { days: number; hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = eventDate.getTime() - now.getTime();

    if (diffMs < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  deleteEvent(eventId: string): void {
    this.allEvents.set(this.allEvents().filter(event => event.id !== eventId));
  }

  editEvent(event: Event): void {
    this.editingEvent.set({ ...event });
    this.showEditDialog.set(true);
  }

  saveEditEvent(updatedEvent: Event): void {
    const index = this.allEvents().findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      const events = [...this.allEvents()];
      events[index] = updatedEvent;
      this.allEvents.set(events);
    }
    this.closeEditDialog();
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.editingEvent.set(null);
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  }
}