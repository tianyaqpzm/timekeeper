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
    // Assuming the backend is running on default Spring Boot port 8080 or configuring via proxy.
    // Using direct URL for now, allowing CORS on backend.
    private apiUrl = 'http://localhost:8080/rest/dark/v1/time-limit-events';

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
