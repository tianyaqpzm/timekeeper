import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerService } from '../../core/services/timer.service';

interface Event {
  id: string;
  title: string;
  category: string;
  date: Date | string;
  time?: string;
  description?: string;
  appearance?: {
    type: 'image' | 'color';
    value: string;
  };
  repeatYearly?: boolean;
}

@Component({
  selector: 'app-event-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule

  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventDetailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private timerService: TimerService,
    private snackBar: MatSnackBar
  ) {
    // Auto-update countdown every second
    effect(() => {
      const interval = setInterval(() => {
        this.updateCountdown();
      }, 1000);

      return () => clearInterval(interval);
    });
  }

  event = signal<Event | null>(null);
  countdown = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  isFavorite = signal(false);

  ngOnInit(): void {
    // Get event ID from query params
    this.route.queryParams.subscribe(params => {
      const eventId = params['id'];
      if (eventId) {
        this.loadEvent(eventId);
      } else {
        // No event ID, redirect to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private loadEvent(eventId: string): void {
    try {
      const stored = localStorage.getItem('events');
      if (stored) {
        const events = JSON.parse(stored);
        const foundEvent = events.find((e: any) => e.id === eventId);

        if (foundEvent) {
          // Convert date string to Date object
          foundEvent.date = new Date(foundEvent.date);
          this.event.set(foundEvent);
          this.updateCountdown();
        } else {
          this.snackBar.open('Event not found', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        }
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      this.snackBar.open('Failed to load event', 'Close', { duration: 3000 });
      this.router.navigate(['/dashboard']);
    }
  }

  private updateCountdown(): void {
    const event = this.event();
    if (event && event.date) {
      let targetDate = new Date(event.date);

      // If time is provided, set it
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        targetDate.setHours(hours, minutes, 0, 0);
      }

      const timeParts = this.timerService.getTimeParts(targetDate);
      this.countdown.set(timeParts);
    }
  }

  getBackgroundStyle(): any {
    const event = this.event();
    if (!event) return {};

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

    // Default background
    return {
      'background-image': "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCQE9vU8Q-aaq02U5iibrartVjiQSD5nExJMpwDwxmnUUh7ps4K3BTkIKOWKMcv9Rxmp21l-2k3b6f9PmygRLBGGREg9__-EJsDWHJd5Uebo6iiC6-k0kzXoD8GW3bv1YSMJGha6YOmWm05TKxQmgFEIQXJMK-t7-sNCcz8Sr_qCvzSzQLLDuqjmKbPPO2sjznCQ8feaYOUhTlUgb_3hF4sfuGWKPpgCru_TmZxC4XQcEtxyOXpeSPLp2bc9DuyDVJQGOOZKeOIoD-I')",
      'background-size': 'cover',
      'background-position': 'center'
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  editEvent(): void {
    const event = this.event();
    if (event) {
      // Navigate to create page with event data for editing
      // For now, just go to dashboard where edit dialog can be used
      this.router.navigate(['/dashboard']);
    }
  }

  shareEvent(): void {
    const event = this.event();
    if (!event) return;

    const shareText = `Check out this event: ${event.title} on ${new Date(event.date).toLocaleDateString()}`;

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: shareText,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        this.copyToClipboard();
      });
    } else {
      this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    const event = this.event();
    if (!event) return;

    const shareText = `${event.title} - ${new Date(event.date).toLocaleDateString()}`;

    navigator.clipboard.writeText(shareText).then(() => {
      this.snackBar.open('Event details copied to clipboard!', 'Close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  deleteEvent(): void {
    const event = this.event();
    if (!event) return;

    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      try {
        const stored = localStorage.getItem('events');
        if (stored) {
          const events = JSON.parse(stored);
          const filteredEvents = events.filter((e: any) => e.id !== event.id);
          localStorage.setItem('events', JSON.stringify(filteredEvents));

          this.snackBar.open('Event deleted successfully', 'Close', { duration: 2000 });
          this.router.navigate(['/dashboard']);
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
        this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
      }
    }
  }
}