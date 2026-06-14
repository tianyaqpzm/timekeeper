import { Routes } from '@angular/router';
import { ChatComponent } from './app/features/chat/chat.component';
import { CreateEventComponent } from './app/features/countdown/pages/create-event/create-event.component';
import { CustomizeComponent } from './app/features/countdown/pages/customize/customize.component';
import { DashboardComponent } from './app/features/countdown/pages/dashboard/dashboard.component';
import { EventDetailComponent } from './app/features/countdown/pages/event-detail/event-detail.component';
import { EventListComponent } from './app/features/countdown/pages/event-list/event-list.component';
import { KnowledgeEmbeddingComponent } from './app/features/knowledge/pages/knowledge-embedding/knowledge-embedding.component';
import { KnowledgeComponent } from './app/features/knowledge/pages/knowledge-main/knowledge.component';
import { CountdownComponent } from './app/features/countdown/countdown.component';
import { PromptComponent } from './app/features/prompt/prompt.component';
import { authGuard } from './app/core/infrastructure/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'countdown', component: CountdownComponent },
  { path: 'countdown/dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'countdown/create-event', component: CreateEventComponent, canActivate: [authGuard] },
  { path: 'countdown/events', component: EventListComponent, canActivate: [authGuard] },
  { path: 'countdown/events/detail', component: EventDetailComponent, canActivate: [authGuard] },
  { path: 'countdown/customize', component: CustomizeComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'chat/:sessionId', component: ChatComponent, canActivate: [authGuard] },
  { path: 'knowledge', component: KnowledgeComponent, canActivate: [authGuard] },
  { path: 'knowledge/embedding', component: KnowledgeEmbeddingComponent, canActivate: [authGuard] },
  { path: 'knowledge/embedding/:id', component: KnowledgeEmbeddingComponent, canActivate: [authGuard] },
  { path: 'prompt', component: PromptComponent, canActivate: [authGuard] },
  { 
    path: 'mcp-market', 
    loadComponent: () => import('./app/features/mcp-market/mcp-market.component').then(m => m.McpMarketComponent),
    canActivate: [authGuard] 
  },
  {
    path: 'ephemeral/create',
    loadComponent: () => import('./app/features/ephemeral/ui/room-creator/room-creator.component').then(m => m.RoomCreatorComponent)
  },
  {
    path: 'room/:code',
    loadComponent: () => import('./app/features/ephemeral/ui/room/room.component').then(m => m.RoomComponent)
  },
  {
    path: 'ai-dev',
    loadComponent: () => import('./app/features/ai-dev/ui/ai-dev-board/ai-dev-board.component').then(m => m.AiDevBoardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ai-dev/chat/:taskId',
    loadComponent: () => import('./app/features/ai-dev/ui/ai-dev-chat/ai-dev-chat.component').then(m => m.AiDevChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notice-board',
    loadChildren: () => import('./app/features/notice-board/notice-board.routes').then(m => m.NOTICE_BOARD_ROUTES)
  }
];