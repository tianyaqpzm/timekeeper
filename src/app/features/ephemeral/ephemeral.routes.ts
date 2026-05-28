import { Routes } from '@angular/router';

export const ephemeralRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./ui/room-creator/room-creator.component').then(m => m.RoomCreatorComponent)
  },
  // 房间页（通过网关 /s/{code} 302 跳转到这里，前端实际处理的是这个路由，
  // 为了让 URL 好看，也可以直接绑定到根部的 /room/:code 路由，这里定义好供外部挂载）
  {
    path: ':code',
    loadComponent: () => import('./ui/room/room.component').then(m => m.RoomComponent)
  }
];
