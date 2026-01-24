import { Injectable, signal, computed } from '@angular/core';

export interface TimeParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private now = signal(Date.now());

  constructor() {
    setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  getTimeParts(targetDate: Date): TimeParts {
    const diff = targetDate.getTime() - this.now();
    
    if (diff <= 0) {
      return { days: '00', hours: '00', minutes: '00', seconds: '00' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days: days.toString().padStart(2, '0'),
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  }
}