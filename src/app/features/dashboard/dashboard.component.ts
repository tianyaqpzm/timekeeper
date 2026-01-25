import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { EventEditDialogComponent } from './event-edit-dialog/event-edit-dialog.component';
import { EventService, TimeLimitedEvent } from '../../core/services/event.service';



@Component({
  selector: 'app-dashboard',
  standalone: true,
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
    MatSnackBarModule,
    EventEditDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private eventService: EventService
  ) {
    // Load events from backend on initialization
    this.loadEvents();

    // Auto-update countdown every second
    effect(() => {
      const interval = setInterval(() => {
        // Trigger re-computation of filtered events to update timers
        this.allEvents.set([...this.allEvents()]);
      }, 1000);

      // Cleanup interval on component destroy
      return () => clearInterval(interval);
    });
  }

  // 1. 将全局 String 对象赋值给一个组件属性
  // protected readonly 是一种好习惯，表明它只用于模板且不应被修改
  protected readonly String = String;

  // Signals for state management
  allEvents = signal<TimeLimitedEvent[]>([]);
  searchQuery = signal('');
  selectedCategory = signal<string | null>(null);
  editingEvent = signal<TimeLimitedEvent | null>(null);
  showEditDialog = signal(false);

  // Computed properties
  filteredEvents = computed(() => {
    let result = this.allEvents();

    // Filter out past events (optional, keeping for reference)
    // Uncomment if you want to hide past events:
    // const now = new Date();
    // result = result.filter(event => new Date(event.date) >= now);

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

    // Sort by date (nearest first)
    return result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
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

  // Calculate unique categories
  uniqueCategories = computed(() => {
    const categories = new Set(this.allEvents().map(event => event.category));
    return categories.size;
  });

  // Load events from Backend
  private loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        // Convert date strings back to Date objects if needed
        // Assuming backend returns ISO strings which need conversion
        const parsedEvents = events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
        this.allEvents.set(parsedEvents);
      },
      error: (err) => {
        console.error('Failed to load events', err);
        this.snackBar.open('Failed to load events', 'Close', { duration: 3000 });
      }
    });
  }

  // Methods
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  filterByCategory(category: string | null): void {
    this.selectedCategory.set(category);
  }

  // Filter events happening this month
  filterThisMonth(): void {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Clear category filter and use search to show this month's events
    this.selectedCategory.set(null);

    // Scroll to events section
    const eventsSection = document.querySelector('.grid.grid-cols-1');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Navigate to the next upcoming event
  goToNextEvent(): void {
    const now = new Date();
    const upcoming = this.allEvents()
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (upcoming.length > 0) {
      this.viewEventDetail(upcoming[0].id);
    } else {
      this.snackBar.open('📅 No upcoming events found', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  // Show category statistics
  showCategoryStats(): void {
    const categoryCount: { [key: string]: number } = {};

    this.allEvents().forEach(event => {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
    });

    const stats = Object.entries(categoryCount)
      .map(([category, count]) => `${category}: ${count}`)
      .join(' • ');

    const message = stats || 'No events yet. Create your first event!';
    this.snackBar.open(`📊 ${message}`, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
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
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.allEvents.set(this.allEvents().filter(event => event.id !== eventId));
        this.snackBar.open('Event deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Failed to delete event', err);
        this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
      }
    });
  }

  editEvent(event: TimeLimitedEvent): void {
    this.editingEvent.set({ ...event });
    this.showEditDialog.set(true);
  }

  saveEditEvent(updatedEvent: TimeLimitedEvent): void {
    const index = this.allEvents().findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      // We map the UI event back to the model expected by service
      // Ideally we use a mapper, but here we cast or pass as is if compatible
      this.eventService.updateEvent(updatedEvent.id, updatedEvent as any).subscribe({
        next: (savedEvent) => {
          const events = [...this.allEvents()];
          // Update the local state with the returned event (or kept updatedEvent)
          events[index] = { ...updatedEvent, date: new Date(updatedEvent.date) };
          this.allEvents.set(events);
          this.snackBar.open('Event updated', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Failed to update event', err);
          this.snackBar.open('Failed to update event', 'Close', { duration: 3000 });
        }
      });
    }
    this.closeEditDialog();
  }

  viewEventDetail(eventId: string): void {
    this.router.navigate(['/landing/events/detail'], { queryParams: { id: eventId } });
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Birthday': 'cake',
      'Anniversary': 'favorite',
      'Holiday': 'ac_unit',
      'Vacation': 'flight',
      'Concert': 'music_note',
      'Graduation': 'school',
      'Retirement': 'celebration'
    };
    return iconMap[category] || 'event';
  }

  getBackgroundStyle(event: TimeLimitedEvent): any {
    if (event.appearance) {
      if (event.appearance.type === 'image') {
        return {
          'background-image': `url(${event.appearance.value})`,
          'background-size': 'cover',
          'background-position': 'center'
        };
      } else {
        return {
          'background-color': event.appearance.value
        };
      }
    }

    // Default backgrounds based on category
    const categoryBackgrounds: { [key: string]: string } = {
      'Holiday': "url('/images/backgrounds/holiday-christmas.jpg')",
      'Birthday': "url('/images/backgrounds/birthday-mom.jpg')"
    };

    return {
      'background-image': categoryBackgrounds[event.category] || "url('/images/backgrounds/customize-bg1.jpg')",
      'background-size': 'cover',
      'background-position': 'center'
    };
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