import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../../../../shared/components/settings-dialog/settings-dialog.component';
import { TimeLimitedEvent } from '../../../../core/domain/event/event.model';
import { EventUseCase } from '../../../../core/use-cases/event/event.usecase';
import { SidebarService } from '../../../../core/infrastructure/services/sidebar.service';
import { EventEditDialogComponent } from './event-edit-dialog/event-edit-dialog.component';
import { MsHeaderComponent } from '../../../../shared/components/ms-header/ms-header.component';

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
    MatTooltipModule,
    MatDialogModule,
    EventEditDialogComponent,
    MsHeaderComponent,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  protected useCase = inject(EventUseCase);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private sidebarService = inject(SidebarService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  protected readonly String = String;

  // UI-only states
  editingEvent = signal<TimeLimitedEvent | null>(null);
  showEditDialog = signal(false);

  protected toggleSidebar() {
    this.sidebarService.toggle();
  }

  protected openSettings() {
    this.dialog.open(SettingsDialogComponent, {
      width: '400px',
      panelClass: ['custom-dialog-container', 'animate-fade-in-up']
    });
  }

  isSidebarOpen = this.sidebarService.isOpen;

  // Delegated states for template
  allEvents = this.useCase.allEvents;
  filteredEvents = this.useCase.filteredEvents;
  totalEvents = this.useCase.totalEvents;
  upcomingThisMonth = this.useCase.upcomingThisMonth;
  nextEvent = this.useCase.nextEvent;
  uniqueCategories = this.useCase.uniqueCategories;
  searchQuery = this.useCase.searchQuery;
  selectedCategory = this.useCase.selectedCategory;

  setSearchQuery(query: string): void {
    this.useCase.searchQuery.set(query);
  }

  filterByCategory(category: string | null): void {
    this.useCase.selectedCategory.set(category);
  }

  filterThisMonth(): void {
    this.useCase.selectedCategory.set(null);
    const eventsSection = document.querySelector('.grid.grid-cols-1');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goToNextEvent(): void {
    const now = new Date();
    const upcoming = this.allEvents()
      .filter(event => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (upcoming.length > 0) {
      this.viewEventDetail(upcoming[0].id!);
    } else {
      this.snackBar.open(this.translate.instant('COUNTDOWN.NO_UPCOMING_FOUND'), this.translate.instant('COMMON.CLOSE'), {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

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

  calculateTimeUntil(date: Date) {
    return this.useCase.calculateTimeUntil(date);
  }

  async deleteEvent(eventId: string) {
    try {
      await this.useCase.deleteEvent(eventId);
      this.snackBar.open('Event deleted', 'Close', { duration: 2000 });
    } catch (err) {
      console.error('Failed to delete event', err);
      this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
    }
  }

  editEvent(event: TimeLimitedEvent): void {
    this.editingEvent.set({ ...event });
    this.showEditDialog.set(true);
  }

  async saveEditEvent(updatedEvent: TimeLimitedEvent) {
    try {
      await this.useCase.updateEvent(updatedEvent.id!, updatedEvent);
      this.snackBar.open('Event updated', 'Close', { duration: 2000 });
      this.closeEditDialog();
    } catch (err) {
      console.error('Failed to update event', err);
      this.snackBar.open('Failed to update event', 'Close', { duration: 3000 });
    }
  }

  viewEventDetail(eventId: string): void {
    this.router.navigate(['/countdown/events/detail'], { queryParams: { id: eventId } });
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