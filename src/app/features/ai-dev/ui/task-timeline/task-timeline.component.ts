import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenSummary } from '../../domain/ai-dev.model';

@Component({
  selector: 'app-task-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-timeline.component.html',
  styles: [`
    @keyframes progress-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
    .animate-stripes {
      background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
      background-size: 1rem 1rem;
      animation: progress-stripes 1s linear infinite;
    }
  `]
})
export class TaskTimelineComponent {
  @Input() tokenSummary: TokenSummary | null = null;
  @Input() totalDurationLabel: string = 'Total Duration';
  @Input() isRunning: boolean = false;
  
  get phases() {
    return this.tokenSummary?.phases || [];
  }
  
  get maxDuration() {
    if (!this.phases.length) return 0;
    return Math.max(...this.phases.map(p => p.durationMs));
  }
  
  get totalDuration() {
    return this.tokenSummary?.totalDurationMs || 0;
  }
  
  getWidthPercentage(durationMs: number): number {
    const total = this.totalDuration;
    if (total === 0) return 0;
    return Math.min(100, Math.max(2, (durationMs / total) * 100)); // min 2% width
  }
}
