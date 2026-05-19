export type PermissionType = "network" | "tracking" | "notifications" | "camera" | "microphone" | "location" | "photos"
export type PermissionStatus = "not-requested" | "granted" | "denied" | "limited"

export type ChatRole = "user" | "assistant" | "system"
export type MessageStatus = "sending" | "sent" | "failed"
export type TabId = "agents" | "create" | "profile"
export type PageView = "tabs" | "conversation" | "agent-detail" | "result-detail" | "progress-detail" | "agent-plan-detail"

export type TaskPhaseStatus = "pending" | "running" | "done" | "error" | "auth-required" | "paused"

export interface TaskPhase {
  id: string
  title: string
  status: TaskPhaseStatus
  detail?: string
  children?: TaskPhase[]
  authType?: "oauth" | "api-key"
  authLabel?: string
  serviceName?: string
  serviceIcon?: string
}

export interface ClarifyOption {
  id: string
  label: string
  desc?: string
}

export interface ClarifyCard {
  question: string
  options: ClarifyOption[]
  allowCustom?: boolean
}

export interface BuildPlan {
  summary: string
  services: { name: string; icon: string }[]
  estimatedTime: string
  steps: string[]
}

export interface TaskResult {
  title: string
  summary: string
  detail: string
  link?: { label: string; url: string }
  completedAt: Date
}

export type TaskState = "idle" | "clarifying" | "confirming" | "authorizing" | "executing" | "completed" | "paused"

export interface NextAction {
  label: string
  action: string
}

export interface ImageAttachment {
  id: string
  src: string
  width: number
  height: number
}

export interface AgentPlan {
  id: string
  name: string
  prompt: string
  steps: string[]
  tools: string[]
  createdAt: Date
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
  isStreaming?: boolean
  status?: MessageStatus
  clarifyCard?: ClarifyCard
  buildPlan?: BuildPlan
  authCards?: TaskPhase[]
  progressPhases?: TaskPhase[]
  resultCard?: TaskResult
  isProgressCard?: boolean
  isResultCard?: boolean
  isAgentCard?: boolean
  agentPlan?: AgentPlan
  nextActions?: NextAction[]
  images?: ImageAttachment[]
}

export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  updatedAt: Date
  messages: ChatMessage[]
  pinned?: boolean
  taskState: TaskState
  buildPlan?: BuildPlan
  taskPhases?: TaskPhase[]
  taskResult?: TaskResult
  agentId?: string
  color: string
}

export interface AgentRunLog {
  id: string
  title: string
  result: string
  taskCount: number
  totalTasks: number
  timestamp: Date
  tokenUsage: number
  sessionId?: string
}

export type AgentStatus = "ready" | "running" | "pending"

export interface AgentRecord {
  id: string
  name: string
  description: string
  purpose: string
  workflow: string[]
  checklist: { label: string; done: boolean }[]
  runCount: number
  lastRunAt: Date
  sessions: string[]
  runLogs: AgentRunLog[]
  status: AgentStatus
  pinned?: boolean
}

export interface AppNotification {
  id: string
  title: string
  desc: string
  date: string
  sessionId?: string
  read?: boolean
}
