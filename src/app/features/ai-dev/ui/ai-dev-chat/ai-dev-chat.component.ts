import { Component, OnInit, Signal, inject, DestroyRef, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { AiDevUseCase } from '../../application/ai-dev.usecase';
import { AiDevChatMessage, AiDevAgentProfile } from '../../domain/ai-dev.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { AgentProfileDialogComponent } from './agent-profile-dialog.component';



@Component({
  selector: 'app-ai-dev-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatInputModule, MarkdownModule, TextFieldModule],
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
          @for (node of profiles(); track node.id) {
            <div 
              class="p-3 rounded-lg border cursor-pointer transition-all duration-200 flex flex-col gap-2"
              [ngClass]="{
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedNode?.id === node.id,
                'border-slate-200 dark:border-[#444746] hover:border-blue-300 dark:hover:border-blue-700': selectedNode?.id !== node.id
              }"
              (click)="selectNode(node)">
              
              <div class="flex items-center justify-between">
                <div class="font-medium text-sm flex items-center gap-2">
                  <mat-icon class="!w-4 !h-4 !text-[16px] text-slate-500">{{ node.avatar || 'smart_toy' }}</mat-icon>
                  {{ node.roleName }}
                </div>
                <button mat-icon-button (click)="configureRole(node, $event)" class="!w-6 !h-6" title="Configure">
                  <mat-icon class="!text-[14px]">settings</mat-icon>
                </button>
              </div>
              
              <div *ngIf="selectedNode?.id === node.id" class="text-xs text-slate-600 dark:text-slate-300 mt-2 border-t border-slate-200 dark:border-[#444746] pt-2">
                <p><strong>Model:</strong> {{ node.modelName }}</p>
                <p class="mt-1 font-mono text-[10px] bg-slate-100 dark:bg-black/20 p-1.5 rounded text-slate-500 dark:text-slate-400 line-clamp-3">
                  {{ node.systemPrompt }}
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
        
        <div #scrollContainer class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
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
                   [ngClass]="msg.senderRole === 'HUMAN' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-[#2a2b2d] text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-[#444746]'"
                   [innerHTML]="highlightMentions(msg.content) | markdown | async">
              </div>
              <span class="text-[10px] text-slate-400 mt-1 mx-2">{{ msg.createTime | date:'shortTime' }}</span>
            </div>
          }
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-[#444746] bg-white dark:bg-[#1e1f20]">
          <div class="flex items-end gap-2 max-w-5xl mx-auto relative bg-slate-50 dark:bg-[#131314] rounded-2xl border border-slate-200 dark:border-[#444746] shadow-sm focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-400 transition-all p-2 pl-4">
            <label class="flex-1 flex flex-col justify-center py-2 cursor-text">
              <textarea 
                cdkTextareaAutosize
                cdkAutosizeMinRows="1"
                cdkAutosizeMaxRows="6"
                [(ngModel)]="newMessage" 
                placeholder="Type a message..." 
                (input)="onInput($event)" 
                (keydown)="onKeyDown($event)"
                class="w-full bg-transparent border-none focus:ring-0 resize-none p-0 text-slate-800 dark:text-slate-200 text-sm outline-none m-0 leading-5 overflow-hidden block"
              ></textarea>
            </label>
            <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim()" class="shrink-0 bg-blue-600 !text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:!text-slate-400 transition-colors" style="width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <mat-icon class="!text-[18px] m-0">arrow_upward</mat-icon>
            </button>

            <!-- Mention Suggestions Overlay -->
            @if (showMentionSuggestions) {
              <div class="absolute bottom-[calc(100%+8px)] left-0 w-64 bg-white dark:bg-[#1e1f20] rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-[#444746] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div class="px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100 dark:border-[#444746] bg-slate-50 dark:bg-black/20">
                  Mention an Agent
                </div>
                <div class="max-h-48 overflow-y-auto p-1">
                  @for (agent of filteredAgents(); track agent.id; let i = $index) {
                    <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                         [ngClass]="i === selectedMentionIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-[#2a2b2d]'"
                         (click)="selectMention(agent)">
                      <mat-icon class="!w-4 !h-4 !text-[16px] opacity-70">{{ agent.avatar || 'smart_toy' }}</mat-icon>
                      <span class="text-sm font-medium">{{ agent.roleName }}</span>
                    </div>
                  }
                  @if (filteredAgents().length === 0) {
                    <div class="px-3 py-4 text-center text-sm text-slate-400">
                      No agents found
                    </div>
                  }
                </div>
              </div>
            }
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
    
    /* Elegant Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.4);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.6);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(100, 116, 139, 0.4);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(100, 116, 139, 0.6);
    }
  `]
})
export class AiDevChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private useCase = inject(AiDevUseCase);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  
  taskId: string = '';
  messages: Signal<AiDevChatMessage[]>;
  profiles: Signal<AiDevAgentProfile[]>;
  newMessage: string = '';

  selectedNode: AiDevAgentProfile | null = null;
  
  showMentionSuggestions = false;
  mentionSearchQuery = '';
  selectedMentionIndex = 0;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    this.messages = this.useCase.currentMessages;
    this.profiles = this.useCase.agentProfiles;
    
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const msgs = this.messages();
      if (msgs && msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('taskId');
      if (id) {
        this.taskId = id;
        this.useCase.loadMessages(this.taskId);
        this.useCase.loadProfiles();
        
        // Auto select first node
        if (this.profiles().length > 0) {
          this.selectedNode = this.profiles()[0];
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

  selectNode(node: AiDevAgentProfile) {
    this.selectedNode = node;
  }

  configureRole(node: AiDevAgentProfile, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AgentProfileDialogComponent, {
      data: node,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.useCase.updateProfile(node.roleName, result);
      }
    });
  }

  highlightMentions(content: string): string {
    if (!content) return content;
    return content.replace(/@([a-zA-Z0-9_-]+)/g, (match, name) => {
      return `<span class="text-blue-600 dark:text-blue-400 font-medium bg-blue-100/60 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md mx-0.5 cursor-pointer hover:bg-blue-200/60 dark:hover:bg-blue-800/60 transition-colors">@${name}</span>`;
    });
  }

  filteredAgents(): AiDevAgentProfile[] {
    const query = this.mentionSearchQuery.toLowerCase();
    return this.profiles().filter(p => p.roleName.toLowerCase().includes(query));
  }

  onInput(event: any) {
    const input = event.target as HTMLTextAreaElement;
    const cursor = input.selectionStart || 0;
    const textBeforeCursor = input.value.substring(0, cursor);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    if (match) {
      this.showMentionSuggestions = true;
      this.mentionSearchQuery = match[1];
      this.selectedMentionIndex = 0;
    } else {
      this.showMentionSuggestions = false;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.showMentionSuggestions) {
      const agents = this.filteredAgents();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedMentionIndex = (this.selectedMentionIndex + 1) % Math.max(agents.length, 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedMentionIndex = (this.selectedMentionIndex - 1 + agents.length) % Math.max(agents.length, 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (agents.length > 0) {
          this.selectMention(agents[this.selectedMentionIndex]);
        }
      } else if (event.key === 'Escape') {
        this.showMentionSuggestions = false;
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectMention(agent: AiDevAgentProfile) {
    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    const cursor = inputElement ? (inputElement.selectionStart || this.newMessage.length) : this.newMessage.length;
    const textBeforeCursor = this.newMessage.substring(0, cursor);
    const textAfterCursor = this.newMessage.substring(cursor);
    
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    
    if (match) {
      const replaceStart = textBeforeCursor.substring(0, textBeforeCursor.length - match[0].length + (match[0].startsWith(' ') || match[0].startsWith('\n') ? 1 : 0));
      this.newMessage = `${replaceStart}@${agent.roleName} ${textAfterCursor}`;
      
      this.showMentionSuggestions = false;
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          const newCursorPos = replaceStart.length + agent.roleName.length + 2;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    } else {
      this.showMentionSuggestions = false;
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.taskId) {
      this.useCase.sendMessage(this.taskId, this.newMessage);
      this.newMessage = '';
      this.showMentionSuggestions = false;
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

