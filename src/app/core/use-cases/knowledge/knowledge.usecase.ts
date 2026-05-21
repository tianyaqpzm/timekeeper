import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { KnowledgeApiAdapter } from '../../adapters/knowledge/knowledge-api.adapter';
import { KnowledgeDocument, Topic } from '../../domain/knowledge/knowledge.model';

/**
 * 知识库业务用例层 (Use Case)
 * 负责编排知识库主题（Topic）与文档（Document）的业务逻辑。
 * 维护全局共享的知识库状态（Signals）。
 */
@Injectable({
  providedIn: 'root'
})
export class KnowledgeUseCase {
  private adapter = inject(KnowledgeApiAdapter);

  // State
  /** 所有的主题列表 */
  topics = signal<Topic[]>([]);
  /** 当前选定主题下的文档列表 */
  documents = signal<KnowledgeDocument[]>([]);
  /** 当前选定的主题 ID */
  selectedTopicId = signal<string | null>(null);
  
  /** 提交中状态 */
  isSubmitting = signal<boolean>(false);
  /** 上传中状态 */
  isUploading = signal<boolean>(false);
  /** 搜索关键词 */
  searchQuery = signal<string>('');

  // Pagination State
  currentPage = signal<number>(0);
  pageSize = signal<number>(10);
  totalDocuments = signal<number>(0);

  constructor() {
    // Reset page to 0 when selected topic changes
    effect(() => {
      this.selectedTopicId();
      this.currentPage.set(0);
    });

    // Fetch documents whenever topic, page, or page size changes
    effect(() => {
      const topicId = this.selectedTopicId();
      const page = this.currentPage();
      const size = this.pageSize();
      
      if (topicId) {
        this.fetchDocuments(topicId, page + 1, size);
      } else {
        this.documents.set([]);
        this.totalDocuments.set(0);
      }
    });
  }

  async fetchDocuments(topicId: string, page: number, size: number) {
    try {
      const pageResult = await this.adapter.getDocuments(topicId, page, size);
      this.documents.set(pageResult.records);
      this.totalDocuments.set(pageResult.total);
    } catch (e) {
      console.error('Failed to load documents', e);
      this.documents.set([]);
      this.totalDocuments.set(0);
    }
  }

  // Computed
  selectedTopic = computed(() => {
    const id = this.selectedTopicId();
    if (!id) return null;
    return this.topics().find(t => t.id === id) || null;
  });

  filteredDocuments = computed(() => {
    const topicId = this.selectedTopicId();
    const query = this.searchQuery().toLowerCase();

    return this.documents().filter(doc =>
      doc.topicId === topicId &&
      doc.title.toLowerCase().includes(query)
    );
  });

  /**
   * 刷新知识库主题（Topic）列表。
   */
  async refreshTopics() {
    try {
      const data = await this.adapter.getTopics();
      this.topics.set(data);
    } catch (e) {
      console.error('Failed to load topics', e);
    }
  }

  /**
   * 选中一个主题并加载其关联的文档。
   * @param id - 主题 ID。
   */
  async selectTopic(id: string) {
    this.selectedTopicId.set(id);
    this.searchQuery.set('');
  }

  /**
   * 保存或更新主题信息。
   * @param id - 如果为 null 则创建新主题，否则更新现有主题。
   * @param payload - 主题数据。
   */
  async saveTopic(id: string | null, payload: any) {
    this.isSubmitting.set(true);
    try {
      if (id) {
        await this.adapter.updateTopic(id, payload);
        await this.refreshTopics();
        this.selectTopic(id);
      } else {
        const created = await this.adapter.createTopic(payload);
        await this.refreshTopics();
        if (created.id) {
          this.selectTopic(created.id);
        }
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * 删除主题及其关联。
   * @param id - 主题 ID。
   */
  async deleteTopic(id: string) {
    await this.adapter.deleteTopic(id);
    if (this.selectedTopicId() === id) {
      this.selectedTopicId.set(null);
      this.documents.set([]);
    }
    await this.refreshTopics();
  }

  /**
   * 删除特定的知识文档。
   * @param documentId - 文档 ID。
   */
  async deleteDocument(documentId: string) {
    await this.adapter.deleteDocument(documentId);
    const topicId = this.selectedTopicId();
    if (topicId) {
      await this.fetchDocuments(topicId, this.currentPage() + 1, this.pageSize());
    }
  }

  /**
   * 启动文档的向量化/解析任务。
   * @param documentId - 文档 ID。
   * @param configPayload - 任务配置。
   * @returns 任务启动结果。
   */
  async startIngestTask(documentId: string, configPayload: any) {
    return this.adapter.startIngestTask(documentId, configPayload);
  }

  /**
   * 上传文件到指定主题下。
   * @param topicId - 主题 ID。
   * @param file - 待上传的文件。
   */
  async uploadDocument(topicId: string, file: File) {
    this.isUploading.set(true);
    try {
      await this.adapter.uploadDocument(topicId, file);
      if (topicId) {
        await this.fetchDocuments(topicId, this.currentPage() + 1, this.pageSize());
      }
    } finally {
      this.isUploading.set(false);
    }
  }

  async triggerRecipeBuild(): Promise<{ status: string, taskId: string }> {
    return this.adapter.triggerRecipeBuild();
  }

  async getBuildProgress(taskId: string): Promise<any> {
    return this.adapter.getBuildProgress(taskId);
  }

  /**
   * 获取文档的预览 URL。
   * @param documentId - 文档 ID。
   * @returns 预览链接。
   */
  getDocumentPreviewUrl(documentId: string): string {
    return this.adapter.getDocumentPreviewUrl(documentId);
  }
}
