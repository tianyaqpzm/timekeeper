import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { firstValueFrom } from 'rxjs';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatMenuModule
    ],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    protected isSidebarOpen = signal(true);
    protected isDarkMode = signal(true); // Default to dark to match previous behavior
    protected userInput = signal('');
    protected messages = signal<ChatMessage[]>([]);
    protected selectedFiles = signal<File[]>([]);
    protected isRecording = signal(false);
    protected isCameraOpen = signal(false);

    private mediaStream: MediaStream | null = null;
    private cameraStream: MediaStream | null = null;
    private sessionId = '';

    constructor(
        @Inject(DOCUMENT) private document: Document,
        private http: HttpClient
    ) {
        // Initialize theme based on default signal
        effect(() => {
            if (this.isDarkMode()) {
                this.document.documentElement.classList.add('dark');
            } else {
                this.document.documentElement.classList.remove('dark');
            }
        });

        this.initSession();
    }

    private initSession() {
        // Simple UUID generation or load from storage
        let stored = localStorage.getItem('chat_session_id');
        if (!stored) {
            stored = crypto.randomUUID();
            localStorage.setItem('chat_session_id', stored);
        }
        this.sessionId = stored;
        this.loadHistory();
    }

    private async loadHistory() {
        try {
            const history = await firstValueFrom(
                this.http.get<any[]>(`/rest/dark/v1/history`, {
                    params: { sessionId: this.sessionId }
                })
            );

            const uiMessages: ChatMessage[] = history.map(h => ({
                role: h.role === 'ai' ? 'model' : 'user',
                content: h.content
            }));

            this.messages.set(uiMessages);

            if (this.messages().length === 0) {
                this.messages.set([{ role: 'model', content: 'Hello! How can I help you today?' }]);
            }
        } catch (err) {
            console.error('Failed to load history', err);
            // Fallback
            if (this.messages().length === 0) {
                this.messages.set([{ role: 'model', content: 'Hello! How can I help you today? (Offline Mode)' }]);
            }
        }
    }

    protected toggleSidebar() {
        this.isSidebarOpen.update(v => !v);
    }

    protected toggleTheme() {
        this.isDarkMode.update(v => !v);
    }

    protected onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const newFiles = Array.from(input.files);
            this.selectedFiles.update(files => [...files, ...newFiles]);
            input.value = ''; // Reset input so same file can be selected again
        }
    }

    protected removeFile(index: number) {
        this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    }

    protected async toggleRecording() {
        if (this.isRecording()) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    private async startRecording() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.isRecording.set(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please allow permissions.');
        }
    }

    private stopRecording() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.isRecording.set(false);
    }

    protected async openCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.isCameraOpen.set(true);
            setTimeout(() => {
                if (this.videoElement && this.videoElement.nativeElement) {
                    this.videoElement.nativeElement.srcObject = this.cameraStream;
                }
            }, 100); // Allow render cycle
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please allow permissions.');
        }
    }

    protected closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        this.isCameraOpen.set(false);
    }

    protected capturePhoto() {
        if (!this.videoElement || !this.canvasElement) return;

        const video = this.videoElement.nativeElement;
        const canvas = this.canvasElement.nativeElement;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
                    this.selectedFiles.update(files => [...files, file]);
                    this.closeCamera();
                }
            }, 'image/png');
        }
    }

    protected async sendMessage() {
        const content = this.userInput().trim();
        const files = this.selectedFiles();

        if (!content && files.length === 0) return;

        // Prepare User Message
        const fileNames = files.map(f => `[File: ${f.name}]`).join(' ');
        const fullContent = [content, fileNames].filter(Boolean).join('\n');

        // Optimistically add user message
        this.messages.update(msgs => [...msgs, { role: 'user', content: fullContent }]);
        this.userInput.set('');
        this.selectedFiles.set([]);

        // Placeholder for AI response
        const aiMsgIndex = this.messages().length;
        this.messages.update(msgs => [...msgs, { role: 'model', content: '' }]);

        let aiContent = '';

        this.http.post(
            `/rest/dark/v1/agent/chat`,
            {
                session_id: this.sessionId,
                message: fullContent
            },
            {
                observe: 'events',
                responseType: 'text',
                reportProgress: true
            }
        ).subscribe({
            next: (event) => {
                if (event.type === HttpEventType.DownloadProgress) {
                    // Angular HttpClient streams the full response up to the current point
                    // in partialText, so we need to process it.
                    const partialText = (event as any).partialText as string;
                    if (partialText) {
                        const lines = partialText.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        aiContent = parsed.content;
                                        // Update the specific message in the signal array
                                        this.messages.update(msgs => {
                                            const newMsgs = [...msgs];
                                            if (newMsgs[aiMsgIndex]) {
                                                newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: aiContent };
                                            }
                                            return newMsgs;
                                        });
                                    }
                                } catch (e) {
                                    // ignore json parse error for partial lines
                                }
                            }
                        }
                    }
                } else if (event.type === HttpEventType.Response) {
                    // Final response received
                    const body = event.body;
                    if (body) {
                        const lines = body.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') break;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        aiContent = parsed.content;
                                        // Update the specific message in the signal array
                                        this.messages.update(msgs => {
                                            const newMsgs = [...msgs];
                                            if (newMsgs[aiMsgIndex]) {
                                                newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: aiContent };
                                            }
                                            return newMsgs;
                                        });
                                    }
                                } catch (e) {
                                    // ignore json parse error for partial lines
                                }
                            }
                        }
                    }
                }
            },
            error: (error) => {
                console.error('Chat error:', error);
                this.messages.update(msgs => {
                    const newMsgs = [...msgs];
                    // Remove the empty AI message on error or show error text
                    if (newMsgs[aiMsgIndex]) {
                        newMsgs[aiMsgIndex] = { ...newMsgs[aiMsgIndex], content: 'Error: Could not reach the agent. Please check connection.' };
                    }
                    return newMsgs;
                });
            }
        });
    }
}
