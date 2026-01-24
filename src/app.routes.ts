import { Routes } from '@angular/router';
import { CreateEventComponent } from './app/features/create-event/create-event.component';
import { CustomizeComponent } from './app/features/customize/customize.component';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { EventDetailComponent } from './app/features/event-detail/event-detail.component';
import { EventListComponent } from './app/features/event-list/event-list.component';
import { LandingComponent } from './app/features/landing/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'create', component: CreateEventComponent },
  { path: 'events', component: EventListComponent },
  { path: 'events/detail', component: EventDetailComponent },
  { path: 'customize', component: CustomizeComponent },
];