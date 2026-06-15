import { Routes } from '@angular/router';
import { NoticeBoardComponent } from './ui/notice-board.component';

export const NOTICE_BOARD_ROUTES: Routes = [
  {
    path: '',
    component: NoticeBoardComponent
  },
  {
    path: 'a/:id',
    loadComponent: () => import('./ui/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent)
  }
];
