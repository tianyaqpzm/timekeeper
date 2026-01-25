import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TimerService } from '../../core/services/timer.service';

import { EventService, TimeLimitedEvent } from '../../core/services/event.service';

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
    private snackBar: MatSnackBar,
    private eventService: EventService
  ) {
    // Auto-update countdown every second
    effect(() => {
      const interval = setInterval(() => {
        this.updateCountdown();
      }, 1000);

      return () => clearInterval(interval);
    });
  }

  event = signal<TimeLimitedEvent | null>(null);
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
        this.router.navigate(['/landing/dashboard']);
      }
    });
  }

  private loadEvent(eventId: string): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        // Ensure date is a Date object (if backend sends string)
        const eventWithDate = {
          ...event,
          date: new Date(event.date)
        };
        this.event.set(eventWithDate);
        this.updateCountdown();
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        this.snackBar.open('Failed to load event', 'Close', { duration: 3000 });
        this.router.navigate(['/landing/dashboard']);
      }
    });
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
    this.router.navigate(['/landing/dashboard']);
  }

  editEvent(): void {
    const event = this.event();
    if (event) {
      // Navigate to create page with event data for editing
      // For now, just go to dashboard where edit dialog can be used
      this.router.navigate(['/landing/dashboard']);
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
    if (!event || !event.id) return;

    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      this.eventService.deleteEvent(event.id).subscribe({
        next: () => {
          this.snackBar.open('Event deleted successfully', 'Close', { duration: 2000 });
          this.router.navigate(['/landing/dashboard']);
        },
        error: (err) => {
          console.error('Failed to delete event:', err);
          this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
        }
      });
    }
  }
}