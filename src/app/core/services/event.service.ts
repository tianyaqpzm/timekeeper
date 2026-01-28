import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TimeLimitedEvent {
    id?: string;
    title: string;
    category: string;
    date: Date;
    time: string;
    description?: string;
    repeatYearly: boolean;
    appearance?: {
        type: string;
        value: string;
    };
    createdAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private http = inject(HttpClient);
    // Using relative path for proxying through Vite (dev) or Cloudflare Pages (prod)
    private apiUrl = '/rest/dark/v1/time-limit-events';

    createEvent(event: TimeLimitedEvent): Observable<TimeLimitedEvent> {
        return this.http.post<TimeLimitedEvent>(this.apiUrl, event);
    }

    getAllEvents(): Observable<TimeLimitedEvent[]> {
        return this.http.get<TimeLimitedEvent[]>(this.apiUrl);
    }

    getEventById(id: string): Observable<TimeLimitedEvent> {
        return this.http.get<TimeLimitedEvent>(`${this.apiUrl}/${id}`);
    }

    updateEvent(id: string, event: TimeLimitedEvent): Observable<TimeLimitedEvent> {
        return this.http.put<TimeLimitedEvent>(`${this.apiUrl}/${id}`, event);
    }

    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
