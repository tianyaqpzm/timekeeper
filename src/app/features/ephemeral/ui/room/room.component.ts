import { Component, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EphemeralUseCase } from '../../usecase/ephemeral.usecase';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-ephemeral-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatIconModule, MatCardModule, TranslateModule],
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
  host: {
    class: 'block h-full'
  }
})
export class RoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public useCase = inject(EphemeralUseCase);
  private translate = inject(TranslateService);

  room = this.useCase.room;
  messages = this.useCase.messages;
  isDestroyed = this.useCase.isDestroyed;
  isPasswordValid = this.useCase.isPasswordValid;

  password = '';
  passwordError = signal<string | null>(null);
  isVerifying = signal(false);

  newMessage = '';
  isBlurred = signal(false);

  private intervalId: any;
  timeLeft = signal<string>('');

  ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.useCase.loadRoom(code);
    } else {
      this.router.navigate(['/']);
    }

    // 更新倒计时
    this.intervalId = setInterval(() => {
      this.updateTimeLeft();
    }, 1000);
  }

  ngOnDestroy() {
    this.useCase.cleanup();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async verifyPassword() {
    if (!this.password || this.isVerifying()) return;
    
    this.isVerifying.set(true);
    this.passwordError.set(null);
    try {
      const success = await this.useCase.verifyPasswordAndJoin(this.password);
      if (!success) {
        this.passwordError.set(this.translate.instant('EPHEMERAL.ROOM.PWD_ERROR'));
      }
    } catch (e) {
      this.passwordError.set(this.translate.instant('EPHEMERAL.ROOM.SERVER_ERROR'));
    } finally {
      this.isVerifying.set(false);
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    const text = this.newMessage;
    this.newMessage = ''; // optimistically clear
    await this.useCase.sendMessage(text);
  }

  async leaveRoom() {
    if (confirm(this.translate.instant('EPHEMERAL.ROOM.LEAVE_CONFIRM'))) {
      await this.useCase.leaveRoom();
      this.router.navigate(['/']);
    }
  }

  async destroyRoom() {
    if (confirm(this.translate.instant('EPHEMERAL.ROOM.DESTROY_CONFIRM'))) {
      await this.useCase.destroyRoom();
    }
  }

  updateTimeLeft() {
    const r = this.room();
    if (!r || !r.expireAt) return;
    
    const expire = new Date(r.expireAt).getTime();
    const now = Date.now();
    const diff = expire - now;

    if (diff <= 0) {
      this.timeLeft.set(this.translate.instant('EPHEMERAL.ROOM.EXPIRED'));
    } else {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      this.timeLeft.set(`${minutes}${this.translate.instant('EPHEMERAL.ROOM.MIN')}${seconds}${this.translate.instant('EPHEMERAL.ROOM.SEC')}`);
    }
  }

  getTimeLeft() {
    return this.timeLeft();
  }

  // L2 隐私防护：页面失去焦点或隐藏时模糊内容
  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    this.isBlurred.set(document.hidden);
  }

  @HostListener('window:blur')
  onBlur() {
    // 移动端失焦也进行模糊
    this.isBlurred.set(true);
  }

  @HostListener('window:focus')
  onFocus() {
    this.isBlurred.set(false);
  }

  // 恢复显示
  @HostListener('click')
  onClick() {
    if (this.isBlurred()) {
      this.isBlurred.set(false);
    }
  }
}
