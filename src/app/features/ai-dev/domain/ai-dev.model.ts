export interface AiDevTask {
  id: string;
  title: string;
  description: string;
  status: AiDevTaskStatus;
  branchName: string;
  totalCost: number;
  createTime: string;
  updateTime: string;
}

export interface AiDevChatMessage {
  id: string;
  taskId: string;
  senderRole: string;
  content: string;
  createTime: string;
}

export interface AiDevAgentProfile {
  id?: string;
  roleName: string;
  baseUrl: string;
  apiToken: string;
  modelName: string;
  avatar: string;
  systemPrompt: string;
}

export enum AiDevTaskStatus {
  PENDING = 'PENDING',               // 已创建，等待 ms-ai-devops 拾取
  RUNNING = 'RUNNING',               // 已被常驻服务拾取，执行中
  STARTING = 'STARTING',
  PLANNING = 'PLANNING',
  WAITING_ON_APPROVAL = 'WAITING_ON_APPROVAL',
  WAITING_RESUME = 'WAITING_RESUME', // HITL 节点，等待人类批准后继续
  GENERATING = 'GENERATING',
  EVALUATING = 'EVALUATING',
  ROLLBACK_REQUESTED = 'ROLLBACK_REQUESTED',
  COMPLETED = 'COMPLETED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED'
}
