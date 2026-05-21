import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KnowledgeDocument, KnowledgeRepository, PageResult, Topic } from '../../domain/knowledge/knowledge.model';
import { URLConfig } from '../../infrastructure/constants/url.config';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeApiAdapter implements KnowledgeRepository {
  private http = inject(HttpClient);
  private baseUrl = URLConfig.KNOWLEDGE.BASE;

  async getTopics(): Promise<Topic[]> {
    const data = await firstValueFrom(this.http.get<Topic[]>(`${this.baseUrl}/topics`));
    // map description to desc for the UI mapping
    return data.map(t => ({ ...t, desc: t.description || t.desc || null }));
  }

  async createTopic(topic: Topic): Promise<Topic> {
    const payload = { ...topic };
    if (payload.desc && !payload.description) {
      payload.description = payload.desc;
    }
    return firstValueFrom(this.http.post<Topic>(`${this.baseUrl}/topics`, payload));
  }

  async updateTopic(id: string, topic: Partial<Topic>): Promise<Topic> {
    const payload = { ...topic };
    if (payload.desc && !payload.description) {
      payload.description = payload.desc;
    }
    return firstValueFrom(this.http.put<Topic>(`${this.baseUrl}/topics/${id}`, payload));
  }

  async deleteTopic(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/topics/${id}`));
  }

  async getDocuments(topicId: string, page: number, size: number): Promise<PageResult<KnowledgeDocument>> {
    const result = await firstValueFrom(
      this.http.get<PageResult<KnowledgeDocument>>(`${this.baseUrl}/documents?topicId=${topicId}&page=${page}&size=${size}`)
    );
    return {
      ...result,
      records: result.records.map(doc => ({ ...doc, id: String(doc.id) }))
    };
  }

  async uploadDocument(topicId: string, file: File): Promise<KnowledgeDocument> {
    const formData = new FormData();
    formData.append('topicId', topicId);
    formData.append('file', file);
    return firstValueFrom(this.http.post<KnowledgeDocument>(URLConfig.KNOWLEDGE.UPLOAD, formData));
  }

  async deleteDocument(documentId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`));
  }

  async startIngestTask(documentId: string, configPayload: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.baseUrl}/documents/${documentId}/ingest`, configPayload));
  }

  async triggerRecipeBuild(): Promise<{ status: string, taskId: string }> {
    return firstValueFrom(this.http.post<{ status: string, taskId: string }>(URLConfig.KNOWLEDGE.BUILD_RECIPE, {}));
  }

  async getBuildProgress(taskId: string): Promise<{
    id: string;
    taskType: string;
    status: string;
    totalCount: number;
    processedCount: number;
    currentItemName: string | null;
    errorMessage: string | null;
    createTime: string;
    updateTime: string;
  }> {
    return firstValueFrom(this.http.get<any>(URLConfig.KNOWLEDGE.TASK_PROGRESS(taskId)));
  }

  getDocumentPreviewUrl(documentId: string): string {
    return `${this.baseUrl}/documents/${documentId}/file`;
  }
}
