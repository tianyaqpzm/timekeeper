export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
  expireTime?: string;
  extractionCode?: string;
  createTime: string;
  updateTime: string;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED';
  expireTime?: string;
  extractionCode: string;
}

export interface NoticeBoardItem {
  id: number;
  targetClient: string;
  usageDetails: string;
  referenceUrl: string;
  contentUrl: string;
  expireTime: string;
  lastViewedTime: string;
  createTime: string;
  updateTime: string;
}

export interface NoticeBoardItemRequest {
  targetClient: string;
  usageDetails?: string;
  referenceUrl?: string;
  contentUrl: string;
  expireTime: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
