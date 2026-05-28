import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EphemeralUseCase } from '../../usecase/ephemeral.usecase';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-room-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatIconModule, TranslateModule],
  templateUrl: './room-creator.component.html',
  styleUrls: ['./room-creator.component.css'],
  host: {
    class: 'block h-full'
  }
})
export class RoomCreatorComponent {
  private useCase = inject(EphemeralUseCase);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private translate = inject(TranslateService);

  title = '';
  ttlSeconds = 3600;
  
  isCreating = signal(false);
  createdCode = signal<string | null>(null);

  async createRoom() {
    if (!this.title || this.isCreating()) return;
    
    this.isCreating.set(true);
    try {
      const shortCode = await this.useCase.createRoom(this.title, this.ttlSeconds);
      if (!shortCode) {
        this.snackBar.open(this.translate.instant('EPHEMERAL.CREATOR.CREATE_FAILED'), 'OK', { duration: 3000 });
        return;
      }
      this.createdCode.set(shortCode);
    } catch (e) {
      console.error('Create room failed', e);
      this.snackBar.open(this.translate.instant('EPHEMERAL.CREATOR.CREATE_FAILED'), 'OK', { duration: 3000 });
    } finally {
      this.isCreating.set(false);
    }
  }

  getShareLink(): string {
    const code = this.createdCode();
    return `${window.location.origin}/s/${code}`;
  }

  copyLink() {
    const link = this.getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open(this.translate.instant('EPHEMERAL.CREATOR.COPY_SUCCESS'), 'OK', { duration: 3000 });
    });
  }

  goToRoom() {
    const code = this.createdCode();
    if (code) {
      this.router.navigate(['/room', code]);
    }
  }
}
