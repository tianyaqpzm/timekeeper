import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-event-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventDetailComponent {
  isFavorite = signal(false);

  toggleFavorite() {
    this.isFavorite.update(value => !value);
  }
}