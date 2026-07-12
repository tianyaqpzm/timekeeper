export interface AiDevTask {
  id: string;
  title: string;
  description: string;
  status: AiDevTaskStatus;
  branchName: string;
  totalCost: number;
  createTime: string;
  updateTime: string;
  /** 头脑风暴最大讨论轮数 */
  maxBrainstormingRounds: number;
  /** 滑动窗口历史消息条数 */
  contextSlidingWindow: number;
  
  targetBranch?: string;
  relatedIssues?: string;
  constraints?: string;
  priority?: string;
  affectedProjects?: string[];
  labels?: string[];
  relatedWorkspaces?: string[];
  engineMode?: string;
  assignedRoles?: string[];
}

export interface AiDevCreateRequest {
  title: string;
  description: string;
  targetBranch?: string;
  relatedIssues?: string;
  constraints?: string;
  priority?: string;
  affectedProjects?: string[];
  labels?: string[];
  engineMode?: string;
  assignedRoles?: string[];
  importFromGithub?: boolean;
}

export interface AiDevChatMessage {
  id: string;
  taskId: string;
  senderRole: string;
  content: string;
  createTime: string;
  githubSyncStatus?: string;
  githubSyncError?: string;
}

export interface AiDevAgentProfile {
  id?: string;
  roleName: string;
  baseUrl: string;
  apiToken: string;
  modelName: string;
  avatar: string;
  systemPrompt: string;
  localSyncPath?: string;
  agentType?: string;
}

export enum AiDevTaskStatus {
  IMPORT_REQUESTED = 'IMPORT_REQUESTED', // 新增：正在从 GitHub 导入中
  PENDING = 'PENDING',               // 已创建，等待 ms-ai-devops 拾取
  RUNNING = 'RUNNING',               // 已被常驻服务拾取，执行中
  STARTING = 'STARTING',
  PLANNING = 'PLANNING',
  BRAINSTORMING = 'BRAINSTORMING',   // 多智能体头脑风暴讨论中
  WAITING_ON_APPROVAL = 'WAITING_ON_APPROVAL',
  WAITING_RESUME = 'WAITING_RESUME', // HITL 节点，等待人类批准后继续
  GENERATING = 'GENERATING',
  EVALUATING = 'EVALUATING',
  ROLLBACK_REQUESTED = 'ROLLBACK_REQUESTED',
  COMPLETED = 'COMPLETED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED'
}

export interface PhaseMetric {
  phase: string;
  agentRole: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  durationMs: number;
  callCount: number;
}

export interface TokenSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  totalDurationMs: number;
  phases: PhaseMetric[];
}
