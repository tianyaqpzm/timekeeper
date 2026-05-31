import { Component, OnInit, Signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { AiDevUseCase } from '../../application/ai-dev.usecase';
import { AiDevChatMessage } from '../../domain/ai-dev.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  description: string;
  memory: string;
}

@Component({
  selector: 'app-ai-dev-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MarkdownModule],
  template: `
    <div class="flex h-screen w-full bg-slate-50 dark:bg-[#131314] text-slate-900 dark:text-[#e3e3e3]">
      
      <!-- Left Sidebar: Online Nodes -->
      <div class="w-80 border-r border-slate-200 dark:border-[#444746] bg-white dark:bg-[#1e1f20] flex flex-col">
        <div class="p-4 border-b border-slate-200 dark:border-[#444746]">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <mat-icon class="text-blue-500">group_work</mat-icon>
            AI Dev Team
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Online Agents & Roles</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          @for (node of nodes; track node.id) {
            <div 
              class="p-3 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col gap-2"
              [ngClass]="{
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedNode?.id === node.id,
                'border-slate-200 dark:border-[#444746] hover:border-blue-300 dark:hover:border-blue-700': selectedNode?.id !== node.id
              }"
              (click)="selectNode(node)">
              
              <div class="flex items-center justify-between">
                <div class="font-medium text-sm flex items-center gap-2">
                  {{ node.name }}
                  <span class="w-2 h-2 rounded-full" 
                    [ngClass]="{
                      'bg-green-500': node.status === 'online',
                      'bg-yellow-500': node.status === 'busy',
                      'bg-slate-400': node.status === 'offline'
                    }"></span>
                </div>
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {{ node.role }}
                </span>
              </div>
              
              <div *ngIf="selectedNode?.id === node.id" class="text-xs text-slate-600 dark:text-slate-300 mt-2 border-t border-slate-200 dark:border-[#444746] pt-2">
                <p><strong>Responsibility:</strong> {{ node.description }}</p>
                <p class="mt-1 font-mono text-[10px] bg-slate-100 dark:bg-black/20 p-1.5 rounded text-slate-500 dark:text-slate-400">
                  Memory: {{ node.memory }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#131314]">
        <div class="p-4 border-b border-slate-200 dark:border-[#444746] bg-white dark:bg-[#1e1f20] flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 class="text-lg font-medium m-0 flex items-center gap-2">
              <mat-icon>chat</mat-icon> Task Discussion
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5" *ngIf="taskId">Task ID: {{ taskId }}</p>
          </div>
          <button mat-icon-button (click)="closePage()" title="Close Tab">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div *ngIf="messages().length === 0" class="flex flex-col items-center justify-center h-full text-slate-400">
            <mat-icon class="!w-12 !h-12 !text-[48px] mb-4 opacity-50">forum</mat-icon>
            <p>No messages yet. Start clarifying the requirements!</p>
          </div>

          @for (msg of messages(); track msg.id) {
            <div class="flex flex-col" [ngClass]="{'items-end': msg.senderRole === 'HUMAN', 'items-start': msg.senderRole !== 'HUMAN'}">
              <span class="text-xs text-slate-500 dark:text-slate-400 mb-1 mx-2 font-medium flex items-center gap-1">
                <mat-icon *ngIf="msg.senderRole !== 'HUMAN'" class="!text-[14px] !w-[14px] !h-[14px]">smart_toy</mat-icon>
                <mat-icon *ngIf="msg.senderRole === 'HUMAN'" class="!text-[14px] !w-[14px] !h-[14px]">person</mat-icon>
                {{ msg.senderRole }}
              </span>
              <div class="px-5 py-3 rounded-2xl max-w-[80%] shadow-sm" 
                   [ngClass]="msg.senderRole === 'HUMAN' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-[#2a2b2d] text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-[#444746]'">
                <markdown [data]="msg.content"></markdown>
              </div>
              <span class="text-[10px] text-slate-400 mt-1 mx-2">{{ msg.createTime | date:'shortTime' }}</span>
            </div>
          }
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-[#444746] bg-white dark:bg-[#1e1f20]">
          <div class="flex items-center gap-3 max-w-5xl mx-auto">
            <mat-form-field appearance="outline" class="flex-1 hide-subscript">
              <input matInput [(ngModel)]="newMessage" placeholder="Type a message or approval to clarify requirements..." (keyup.enter)="sendMessage()">
            </mat-form-field>
            <button mat-fab extended color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim()" class="!h-14">
              <mat-icon>send</mat-icon> Send
            </button>
          </div>
          <div class="mt-3 flex justify-center gap-3">
            <button mat-stroked-button (click)="approve()" [disabled]="!canApprove()" class="text-green-600 border-green-600">
              <mat-icon>check_circle</mat-icon> Approve & Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
    .hide-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    ::ng-deep markdown p {
      margin-bottom: 0.5rem;
    }
    ::ng-deep markdown p:last-child {
      margin-bottom: 0;
    }
    ::ng-deep markdown pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    .dark ::ng-deep markdown pre {
      background-color: rgba(0, 0, 0, 0.3);
    }
  `]
})
export class AiDevChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private useCase = inject(AiDevUseCase);
  private destroyRef = inject(DestroyRef);
  
  taskId: string = '';
  messages: Signal<AiDevChatMessage[]>;
  newMessage: string = '';

  // Mock data for nodes
  nodes: AgentNode[] = [
    {
      id: 'node-orch',
      name: 'Orchestrator',
      role: 'Master',
      status: 'online',
      description: 'Coordinates tasks, manages Kanban board, and delegates subtasks to other nodes.',
      memory: 'State: Waiting for User Approval. Subtasks: 3 completed.'
    },
    {
      id: 'node-plan',
      name: 'Planner',
      role: 'Analyst',
      status: 'online',
      description: 'Understands requirements, generates plan.md, and creates system design.',
      memory: 'Last output: plan.md (v2). Context: FE001-ai-dev-team.md.'
    },
    {
      id: 'node-gen',
      name: 'Generator',
      role: 'Coder',
      status: 'busy',
      description: 'Writes code, implements features, follows TDD on feature branch.',
      memory: 'Active branch: feat/task-102. Current file: app.routes.ts.'
    },
    {
      id: 'node-eval',
      name: 'Evaluator',
      role: 'Reviewer',
      status: 'online',
      description: 'Reviews code, runs tests in Docker sandbox, checks for regressions.',
      memory: 'Tests passed: 42/42. No critical issues found.'
    }
  ];

  selectedNode: AgentNode | null = null;

  constructor() {
    this.messages = this.useCase.currentMessages;
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('taskId');
      if (id) {
        this.taskId = id;
        this.useCase.loadMessages(this.taskId);
        
        // Auto select first node
        if (this.nodes.length > 0) {
          this.selectedNode = this.nodes[0];
        }

        // Poll messages every 3 seconds to keep receiving updates
        const intervalId = setInterval(() => {
          this.useCase.loadMessages(this.taskId);
        }, 3000);

        this.destroyRef.onDestroy(() => {
          clearInterval(intervalId);
        });
      }
    });
  }

  selectNode(node: AgentNode) {
    this.selectedNode = node;
  }

  sendMessage() {
    if (this.newMessage.trim() && this.taskId) {
      this.useCase.sendMessage(this.taskId, this.newMessage);
      this.newMessage = '';
    }
  }

  approve() {
    const feedback = this.newMessage.trim() || 'Approved to proceed.';
    if (this.taskId) {
      this.useCase.resumeTaskWithFeedback(this.taskId, feedback);
      this.newMessage = '';
    }
  }

  canApprove(): boolean {
    return !!this.taskId;
  }

  closePage() {
    window.close();
  }
}

