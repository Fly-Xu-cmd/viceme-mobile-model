import { create } from "zustand"
import type {
  ChatMessage, ChatSession, AgentRecord, AppNotification,
  TabId, PageView, TaskPhase, ClarifyCard, BuildPlan, TaskResult, TaskState,
  PermissionType, PermissionStatus, ImageAttachment, AgentPlan,
} from "@/types"

/* ───────── Demo task flow data ───────── */
const DEMO_CLARIFY_CARDS: ClarifyCard[] = [
  {
    question: "你想要什么格式的报告输出？",
    options: [
      { id: "c1", label: "Notion 文档", desc: "自动写入你的 Notion" },
      { id: "c2", label: "Google Docs", desc: "创建 Google 文档" },
      { id: "c3", label: "Markdown 文件", desc: "下载 MD 文件" },
    ],
    allowCustom: true,
  },
  {
    question: "需要覆盖哪些社交媒体平台？",
    options: [
      { id: "p1", label: "LinkedIn + Twitter + 其他所有能找到的" },
      { id: "p2", label: "仅 LinkedIn 和 Twitter" },
      { id: "p3", label: "让 AI 自行判断" },
    ],
  },
]

const DEMO_BUILD_PLAN: BuildPlan = {
  summary: "将对 Ryan Kay 进行全方位信息挖掘，覆盖 LinkedIn、Twitter、公司官网等渠道，分析社交媒体活跃度，推荐最佳触达方式，并将结果写入 Notion。",
  services: [
    { name: "LinkedIn", icon: "linkedin" },
    { name: "Twitter", icon: "twitter" },
    { name: "Google", icon: "google" },
    { name: "Notion", icon: "notion" },
  ],
  estimatedTime: "约 3-5 分钟",
  steps: [
    "搜索公开网络信息（Google、公司官网）",
    "抓取 LinkedIn 公开资料",
    "抓取 Twitter/X 公开动态",
    "分析各平台活跃度",
    "生成触达方式推荐",
    "格式化并写入 Notion 文档",
  ],
}

const DEMO_TASK_PHASES: TaskPhase[] = [
  { id: "tp1", title: "搜索公开网络信息", status: "pending", detail: "Google 搜索 + 公司官网" },
  { id: "tp2", title: "抓取 LinkedIn 公开资料", status: "pending", detail: "职业经历、教育背景、联系方式" },
  { id: "tp3", title: "抓取 Twitter/X 公开动态", status: "pending", detail: "近期推文、互动数据" },
  {
    id: "tp4", title: "授权 Notion", status: "pending",
    authType: "oauth", authLabel: "授权 Notion 写入权限", serviceName: "Notion", serviceIcon: "notion",
  },
  { id: "tp5", title: "分析各平台活跃度", status: "pending" },
  {
    id: "tp6", title: "写入 Notion 文档", status: "pending",
    children: [
      { id: "tp6-1", title: "创建文档结构", status: "pending" },
      { id: "tp6-2", title: "写入联系方式", status: "pending" },
      { id: "tp6-3", title: "写入社交轨迹分析", status: "pending" },
      { id: "tp6-4", title: "写入触达建议", status: "pending" },
    ],
  },
]

const DEMO_AGENT_PLAN: AgentPlan = {
  id: "plan-research-1",
  name: "深度研究 Agent",
  prompt: "你是一个专业的人物背景调查研究员。你的任务是对目标人物 Ryan Kay 进行全方位的信息挖掘与分析。\n\n**目标：**\n收集 Ryan Kay（Refer.io 频道首席教育官/主持人）的所有公开联系方式、社交媒体轨迹，分析其在不同平台的活跃度，找出最有效的触达方式。\n\n**要求：**\n1. 覆盖 LinkedIn、Twitter/X、YouTube 等主流社交平台\n2. 收集邮箱、电话等直接联系方式\n3. 分析各平台发帖频率和互动数据\n4. 基于活跃度数据推荐最佳触达渠道\n5. 将最终结果格式化写入 Notion 文档",
  steps: [
    "通过 Google 搜索获取基础信息",
    "抓取 LinkedIn 公开档案数据",
    "抓取 Twitter/X 公开动态与互动",
    "扫描 YouTube 频道与内容",
    "交叉验证联系方式的准确性",
    "计算各平台活跃度评分",
    "生成触达方式推荐排序",
    "格式化报告并写入 Notion",
  ],
  tools: ["Google Search", "LinkedIn Scraper", "Twitter API", "Notion API"],
  createdAt: new Date(),
}

const DEMO_RESULT: TaskResult = {
  title: "Ryan Kay 背调报告已完成",
  summary: "找到 2 个邮箱、1 个电话、LinkedIn/Twitter/YouTube 三个活跃平台。LinkedIn 为最佳触达渠道（周活跃 3-4 次）。报告已写入 Notion。",
  detail: "**联系方式**\n• 邮箱: ryan@refer.io (主要), rkay@gmail.com\n• 电话: +1-614-***-8823\n• LinkedIn: linkedin.com/in/ryankay\n\n**社交媒体活跃度**\n• LinkedIn: ⭐⭐⭐⭐⭐ (每周 3-4 次发帖)\n• Twitter/X: ⭐⭐⭐ (每周 1-2 次)\n• YouTube: ⭐⭐⭐⭐ (Refer.io 频道)\n\n**推荐触达方式**\n1. LinkedIn InMail（最高响应率）\n2. 邮件 ryan@refer.io\n3. Twitter DM",
  link: { label: "查看 Notion 文档", url: "https://notion.so/example" },
  completedAt: new Date(),
}

/* ───────── Seed data ───────── */
const now = new Date()

const SEED_SESSIONS: ChatSession[] = []

const SEED_AGENTS: AgentRecord[] = [
  {
    id: "agent-research", name: "深度研究", description: "互联网信息搜集与分析",
    purpose: "分析 GitHub 档案和代码仓库，交叉对比简历，生成全面的四维度评估报告。",
    workflow: ["提取简历内容", "抓取 GitHub 和社交媒体资料", "生成四维度分析", "转换报告为 PDF", "通过邮件发送报告"],
    checklist: [
      { label: "提取简历 PDF 内容", done: true },
      { label: "抓取 GitHub 档案和仓库", done: true },
      { label: "生成四维度分析", done: false },
      { label: "转换报告为 PDF", done: false },
      { label: "通过邮件发送报告", done: false },
    ],
    runCount: 5, lastRunAt: now, sessions: [],
    status: "running", pinned: true,
    runLogs: [
      { id: "run-1", title: "完成《文瑞临 vs 叶阳天 Twin 研发工程师岗位双向对比分析报告》", result: "已以格式化 HTML 邮件形式发送至您的邮箱", taskCount: 4, totalTasks: 5, timestamp: new Date(Date.now() - 2640000), tokenUsage: 203 },
      { id: "run-2", title: "完成《Twin AI 产品经理面试题库（精选10题）》", result: "PDF 已生成并发送至 1036758961@qq.com", taskCount: 2, totalTasks: 5, timestamp: new Date(Date.now() - 10800000), tokenUsage: 100 },
      { id: "run-3", title: "完成三方候选人对比分析报告（PDF）", result: "已生成并发送至您的邮箱", taskCount: 6, totalTasks: 6, timestamp: new Date(Date.now() - 14400000), tokenUsage: 173 },
    ],
  },
  {
    id: "agent-write", name: "写作助手", description: "文案、邮件、报告撰写",
    purpose: "根据用户需求撰写专业文案、邮件、商务报告等文字内容。",
    workflow: ["理解写作需求", "搜集相关素材", "生成初稿", "优化润色", "格式化输出"],
    checklist: [],
    runCount: 0, lastRunAt: now, sessions: [], runLogs: [],
    status: "pending",
  },
  {
    id: "agent-code", name: "编程助手", description: "代码编写与调试",
    purpose: "帮助用户编写、调试和优化代码，支持多种编程语言。",
    workflow: ["分析需求", "编写代码", "运行测试", "调试优化", "输出文档"],
    checklist: [],
    runCount: 0, lastRunAt: now, sessions: [], runLogs: [],
    status: "ready",
  },
]

const SEED_NOTIFICATIONS: AppNotification[] = []

/* ───────── Helpers ───────── */
const CHAT_REPLIES: string[] = [
  "好的，让我来帮你处理这个问题。你能告诉我更多细节吗？",
  "收到！让我从几个角度来分析一下，有什么需要补充的随时说。",
  "好的，我来想想。你觉得需要侧重哪个方面？",
]

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function isTaskRequest(content: string): boolean {
  return /帮我|调研|研究|查找|分析|生成|写入|抓取|搜索|挖掘|制定|创建|整理|对比|监控|追踪|背调|触达/.test(content) && content.length > 10
}

function humanDelay(base: number): number { return base + Math.floor(Math.random() * base * 0.4) }

function syncSession(get: () => AppState, set: (fn: (s: AppState) => Partial<AppState>) => void) {
  const state = get()
  if (!state.activeSessionId || state.messages.length === 0) return
  const firstUser = state.messages.find((m) => m.role === "user")
  const last = state.messages[state.messages.length - 1]
  const existing = state.sessions.find((ss) => ss.id === state.activeSessionId)
  const sess: ChatSession = {
    id: state.activeSessionId,
    title: firstUser?.content.slice(0, 20) ?? "新对话",
    lastMessage: last?.content.slice(0, 40) ?? "",
    updatedAt: new Date(),
    messages: state.messages,
    taskState: state.taskState,
    taskPhases: state.taskPhases.length > 0 ? state.taskPhases : undefined,
    taskResult: existing?.taskResult,
    color: existing?.color ?? "#4F6EF7",
  }
  set((s) => ({ sessions: [sess, ...s.sessions.filter((ss) => ss.id !== sess.id)] }))
}

function updatePhaseStatus(phases: TaskPhase[], id: string, status: TaskPhase["status"]): TaskPhase[] {
  return phases.map((p) => {
    if (p.id === id) return { ...p, status }
    if (p.children) return { ...p, children: p.children.map((c) => c.id === id ? { ...c, status } : c) }
    return p
  })
}

function streamText(full: string, onUpdate: (t: string) => void, onDone: () => void) {
  let idx = 0
  const timer = setInterval(() => {
    idx = Math.min(idx + Math.floor(Math.random() * 4) + 1, full.length)
    onUpdate(full.slice(0, idx))
    if (idx >= full.length) { clearInterval(timer); onDone() }
  }, 25)
  return () => clearInterval(timer)
}

let activeStreamCleanups = new Map<string, () => void>()

function trackStream(key: string, full: string, onUpdate: (t: string) => void, onDone: () => void) {
  const existing = activeStreamCleanups.get(key)
  if (existing) existing()
  const cleanup = streamText(full, onUpdate, () => {
    activeStreamCleanups.delete(key)
    onDone()
  })
  activeStreamCleanups.set(key, cleanup)
}

function clearAllStreams() {
  activeStreamCleanups.forEach((cleanup) => cleanup())
  activeStreamCleanups.clear()
}

let currentExecutionId = 0

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const VALID_TASK_TRANSITIONS: Partial<Record<TaskState, TaskState[]>> = {
  idle: ["clarifying"],
  clarifying: ["confirming", "idle"],
  confirming: ["authorizing", "executing", "idle"],
  authorizing: ["executing", "idle"],
  executing: ["paused", "completed", "authorizing", "idle"],
  paused: ["executing", "idle", "completed"],
  completed: ["clarifying", "idle"],
}

export function safeTransition(from: TaskState, to: TaskState): boolean {
  return VALID_TASK_TRANSITIONS[from]?.includes(to) ?? false
}

/* ───────── Store ───────── */
interface AppState {
  pageView: PageView
  pageHistory: PageView[]
  activeTab: TabId
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: ChatMessage[]
  isTyping: boolean
  inputValue: string
  agents: AgentRecord[]
  notifications: AppNotification[]
  isLoggedIn: boolean
  showLogin: boolean
  loginDismissed: boolean
  phoneNumber: string
  showAgreement: boolean
  taskState: TaskState
  taskPhases: TaskPhase[]
  taskPaused: boolean
  executionId: number
  detailAgentId: string | null
  clarifyStep: number
  toastNotification: { title: string; desc: string; sessionId?: string } | null
  activeResult: TaskResult | null
  activeAgentPlan: AgentPlan | null
  keyboardOpen: boolean
  permissions: Record<PermissionType, PermissionStatus>
  activePermission: PermissionType | null
  permissionQueue: PermissionType[]
  permissionsInitialized: boolean

  setPageView: (v: PageView) => void
  setActiveTab: (t: TabId) => void
  setInputValue: (v: string) => void
  sendMessage: (content: string) => void
  selectClarifyOption: (optionLabel: string) => void
  confirmBuild: () => void
  authorizeService: (phaseId: string) => void
  skipAuth: (phaseId: string) => void
  stopTask: () => void
  resumeTask: () => void
  openSession: (id: string) => void
  newChat: () => void
  deleteSession: (id: string) => void
  goBack: () => void
  setIsLoggedIn: (v: boolean) => void
  setShowLogin: (v: boolean) => void
  dismissLogin: () => void
  loginWithPhone: (phone: string) => void
  setShowAgreement: (v: boolean) => void
  openAgentDetail: (id: string) => void
  toggleAgentPin: (id: string) => void
  resendMessage: (msgId: string) => void
  deleteMessages: (ids: string[]) => void
  dismissToast: () => void
  openResultDetail: (result: TaskResult) => void
  openAgentPlanDetail: (plan: AgentPlan) => void
  markNotificationsRead: () => void
  openProgressDetail: () => void
  setKeyboardOpen: (v: boolean) => void
  sendImages: (images: ImageAttachment[]) => void
  requestPermission: (type: PermissionType) => void
  requestPermissions: (types: PermissionType[]) => void
  respondPermission: (status: PermissionStatus) => void
  initPermissions: () => void
  checkPermission: (type: PermissionType) => PermissionStatus
}

const initialSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const useChatStore = create<AppState>((set, get) => ({
  pageView: "conversation",
  pageHistory: [],
  activeTab: "create",
  sessions: SEED_SESSIONS,
  activeSessionId: initialSessionId,
  messages: [],
  isTyping: false,
  inputValue: "",
  agents: SEED_AGENTS,
  notifications: SEED_NOTIFICATIONS,
  isLoggedIn: false,
  showLogin: false,
  loginDismissed: false,
  phoneNumber: "",
  showAgreement: false,
  taskState: "idle",
  taskPhases: [],
  taskPaused: false,
  executionId: 0,
  detailAgentId: null,
  clarifyStep: 0,
  toastNotification: null,
  activeResult: null,
  activeAgentPlan: null,
  keyboardOpen: false,
  permissions: {
    network: "not-requested",
    tracking: "not-requested",
    notifications: "not-requested",
    camera: "not-requested",
    microphone: "not-requested",
    location: "not-requested",
    photos: "not-requested",
  },
  activePermission: null,
  permissionQueue: [],
  permissionsInitialized: false,

  setPageView: (v) => set({ pageView: v }),
  setActiveTab: (t) => set({ activeTab: t }),
  setInputValue: (v) => set({ inputValue: v }),
  setIsLoggedIn: (v) => set({ isLoggedIn: v }),
  setShowLogin: (v) => set({ showLogin: v }),
  dismissLogin: () => set({ showLogin: false, loginDismissed: true }),
  loginWithPhone: (phone) => set({ isLoggedIn: true, showLogin: false, loginDismissed: true, phoneNumber: phone }),
  setShowAgreement: (v) => set({ showAgreement: v }),
  openAgentDetail: (id) => set((s) => ({ pageView: "agent-detail", detailAgentId: id, pageHistory: [...s.pageHistory, s.pageView] })),
  toggleAgentPin: (id) => set((s) => ({ agents: s.agents.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a) })),
  dismissToast: () => set({ toastNotification: null }),
  openResultDetail: (result) => set((s) => ({ pageView: "result-detail", activeResult: result, pageHistory: [...s.pageHistory, s.pageView] })),
  openAgentPlanDetail: (plan) => set((s) => ({ pageView: "agent-plan-detail", activeAgentPlan: plan, pageHistory: [...s.pageHistory, s.pageView] })),
  markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  openProgressDetail: () => set((s) => ({ pageView: "progress-detail", pageHistory: [...s.pageHistory, s.pageView] })),
  setKeyboardOpen: (v) => set({ keyboardOpen: v }),

  sendImages: (images) => {
    let sid = get().activeSessionId
    if (!sid) { sid = `session-${uid()}`; set((s) => ({ activeSessionId: sid, pageView: "conversation", pageHistory: [...s.pageHistory, s.pageView] })) }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-img`, role: "user",
      content: images.length === 1 ? "发送了一张图片" : `发送了 ${images.length} 张图片`,
      timestamp: new Date(), status: "sending", images,
    }
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }))
    setTimeout(() => set((s) => ({ messages: s.messages.map((m) => m.id === userMsg.id ? { ...m, status: "sent" as const } : m) })), 300)

    setTimeout(() => {
      const replyId = `msg-${Date.now()}-img-r`
      const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
      set((s) => ({ messages: [...s.messages, replyMsg] }))
      const text = images.length === 1
        ? "收到图片，让我看看。你需要我对这张图片做什么处理吗？"
        : `收到 ${images.length} 张图片。你需要我对这些图片做什么处理吗？`
      trackStream("img-reply", text,
        (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })),
        () => {
          set((s) => ({ isTyping: false, messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m) }))
          syncSession(get, set)
        },
      )
    }, humanDelay(600))
  },

  requestPermission: (type) => {
    const s = get()
    if (s.permissions[type] !== "not-requested") return
    if (s.activePermission) {
      set((s) => ({ permissionQueue: [...s.permissionQueue, type] }))
    } else {
      set({ activePermission: type })
    }
  },

  requestPermissions: (types) => {
    const s = get()
    const needed = types.filter((t) => s.permissions[t] === "not-requested")
    if (needed.length === 0) return
    const [first, ...rest] = needed
    set({ activePermission: first, permissionQueue: [...s.permissionQueue, ...rest] })
  },

  respondPermission: (status) => {
    const s = get()
    if (!s.activePermission) return
    const newPerms = { ...s.permissions, [s.activePermission]: status }
    const queue = [...s.permissionQueue]
    const next = queue.shift() ?? null
    set({ permissions: newPerms, activePermission: next, permissionQueue: queue })
  },

  initPermissions: () => {
    if (get().permissionsInitialized) return
    set({ permissionsInitialized: true })
    setTimeout(() => {
      get().requestPermissions(["network", "tracking", "notifications"])
    }, 600)
  },

  checkPermission: (type) => get().permissions[type],

  goBack: () => {
    const s = get()
    const history = [...s.pageHistory]
    const prev = history.pop() ?? "tabs"

    const updates: Partial<AppState> = { pageView: prev, pageHistory: history }

    if (s.pageView === "agent-detail") {
      updates.detailAgentId = null
    }
    if (s.pageView === "result-detail") {
      // activeResult 延迟清除，避免打断退出动画
    }
    if (s.pageView === "agent-plan-detail") {
      // activeAgentPlan 延迟清除
    }
    if (s.pageView === "conversation") {
      clearAllStreams()
      syncSession(get, set)
      const isExecuting = s.taskState === "executing" || s.taskState === "authorizing"
      Object.assign(updates, {
        activeSessionId: null, messages: [], isTyping: false,
        taskState: isExecuting ? s.taskState : "idle",
        taskPhases: isExecuting ? s.taskPhases : [],
        taskPaused: false, clarifyStep: 0,
        activeTab: "create",
      })
    }

    set(() => updates)
  },

  newChat: () => {
    const id = `session-${uid()}`
    set((s) => ({
      pageView: "conversation", activeSessionId: id, messages: [], isTyping: false,
      inputValue: "", taskState: "idle", taskPhases: [], taskPaused: false, clarifyStep: 0,
      pageHistory: [...s.pageHistory, s.pageView],
    }))
  },

  openSession: (id) => {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    set((s) => ({
      pageView: "conversation", activeSessionId: id, messages: session.messages,
      isTyping: false, inputValue: "", taskState: session.taskState,
      taskPhases: session.taskPhases ?? [], taskPaused: false, clarifyStep: 0,
      pageHistory: [...s.pageHistory, s.pageView],
    }))
  },

  deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((ss) => ss.id !== id) })),
  deleteMessages: (ids) => set((s) => ({ messages: s.messages.filter((m) => !ids.includes(m.id)) })),

  resendMessage: (msgId) => {
    const msg = get().messages.find((m) => m.id === msgId)
    if (!msg || msg.role !== "user") return
    set((s) => ({ messages: s.messages.filter((m) => m.id !== msgId) }))
    get().sendMessage(msg.content)
  },

  /* ── Send message: detect task vs chat ── */
  sendMessage: (content) => {
    let sid = get().activeSessionId
    if (!sid) { sid = `session-${uid()}`; set((s) => ({ activeSessionId: sid, pageView: "conversation", pageHistory: [...s.pageHistory, s.pageView] })) }

    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: "user", content, timestamp: new Date(), status: "sending" }
    set((s) => ({ messages: [...s.messages, userMsg], inputValue: "", isTyping: true }))
    setTimeout(() => set((s) => ({ messages: s.messages.map((m) => m.id === userMsg.id ? { ...m, status: "sent" as const } : m) })), 300)

    const tState = get().taskState
    const isTask = isTaskRequest(content)
    const isDismiss = /跳过|取消|不用了|算了|就这样/.test(content)

    if ((tState === "idle" || tState === "completed") && isTask) {
      setTimeout(() => {
        const ackId = `msg-${Date.now()}-ack`
        const ackMsg: ChatMessage = { id: ackId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, ackMsg] }))
        const ackText = "收到，我来帮你处理这个任务。在开始之前，我需要确认几个细节：\n"
        trackStream("ack", ackText, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === ackId ? { ...m, content: t } : m) })), () => {
          set((s) => ({
            isTyping: false,
            messages: s.messages.map((m) => m.id === ackId ? { ...m, isStreaming: false } : m),
          }))
          syncSession(get, set)
          setTimeout(() => {
            const card = DEMO_CLARIFY_CARDS[0]
            const clarifyMsg: ChatMessage = { id: `msg-${Date.now()}-cl`, role: "assistant", content: card.question, timestamp: new Date(), clarifyCard: card }
            set((s) => ({ messages: [...s.messages, clarifyMsg], taskState: "clarifying", clarifyStep: 0 }))
            syncSession(get, set)
          }, 300)
        })
      }, humanDelay(500))
    } else if (tState === "clarifying" && isDismiss) {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-cl-r`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        trackStream("clarify-dismiss", "好的，已跳过。有其他需要随时告诉我。", (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({
            isTyping: false, taskState: "idle" as const, clarifyStep: 0, taskPhases: [],
            messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m),
          }))
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else if (tState === "confirming" && isDismiss) {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-cf-r`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        trackStream("confirm-dismiss", "好的，已取消。有其他需要随时告诉我。", (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({
            isTyping: false, taskState: "idle" as const, clarifyStep: 0, taskPhases: [],
            messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m),
          }))
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else if (tState === "authorizing" && isDismiss) {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-auth-skip`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        trackStream("auth-dismiss", "好的，已跳过授权。相关功能可能受限。", (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          const newPhases = get().taskPhases.map((p) => p.authType && p.status !== "done" ? { ...p, status: "error" as const } : p)
          set((s) => ({
            isTyping: false, taskState: "idle" as const, taskPhases: newPhases,
            messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m),
          }))
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else if (tState === "completed" && isDismiss) {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-done-r`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        trackStream("done-dismiss", "好的。有需要随时告诉我。", (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({
            isTyping: false, taskState: "idle" as const,
            messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m),
          }))
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else if (tState === "executing" || tState === "authorizing") {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-r`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        const text = "收到你的补充信息，我会在执行中考虑进去。当前任务仍在进行中。"
        trackStream("reply", text, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({ isTyping: false, messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m) }))
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else if (tState === "paused") {
      const isResume = /继续构建|恢复/.test(content)
      const isRestart = /从头|重新构建/.test(content)
      const isViewData = /查看|已收集/.test(content)

      setTimeout(() => {
        const replyId = `msg-${Date.now()}-pr`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))

        let text: string
        let afterAction: (() => void) | null = null

        if (isResume) {
          text = "好的，从中断处恢复执行。"
          afterAction = () => {
            const sysMsg: ChatMessage = { id: `msg-${Date.now()}-resume`, role: "system", content: "▶️ 任务已恢复", timestamp: new Date() }
            set((s) => ({ taskState: "executing", taskPaused: false, messages: [...s.messages, sysMsg] }))
            startExecution(set, get)
          }
        } else if (isRestart) {
          text = "好的，我来重新执行这个任务。"
          afterAction = () => {
            const phases = DEMO_TASK_PHASES.map((p) => ({ ...p, status: "pending" as const, children: p.children?.map((c) => ({ ...c, status: "pending" as const })) }))
            const progressMsg: ChatMessage = { id: `msg-${Date.now()}-prog-re`, role: "assistant", content: "任务重新开始执行：", timestamp: new Date(), isProgressCard: true, progressPhases: phases }
            set((s) => ({ taskState: "executing", taskPaused: false, taskPhases: phases, messages: [...s.messages, progressMsg] }))
            startExecution(set, get)
          }
        } else if (isViewData) {
          const donePhases = get().taskPhases.filter((p) => p.status === "done" && !p.authType)
          const doneChildren = get().taskPhases.flatMap((p) => (p.children ?? []).filter((c) => c.status === "done"))
          const allDone = [...donePhases, ...doneChildren]
          text = allDone.length > 0
            ? `已完成的步骤数据：\n${allDone.map((p, i) => `${i + 1}. ${p.title} ✓`).join("\n")}\n\n这些数据已收集完毕，你可以继续构建或选择其他操作。`
            : "目前还没有完成任何步骤的数据采集。"
        } else if (isDismiss) {
          text = "好的，已结束本次任务。如果之后需要，随时告诉我。"
          afterAction = () => set({ taskState: "idle", taskPaused: false, taskPhases: [] })
        } else {
          text = "收到。任务目前处于暂停状态，你可以选择继续构建、从头开始或查看已收集的数据。"
        }

        trackStream("paused-reply", text, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({ isTyping: false, messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m) }))
          if (afterAction) setTimeout(afterAction, 200)
          syncSession(get, set)
        })
      }, humanDelay(400))
    } else {
      setTimeout(() => {
        const replyId = `msg-${Date.now()}-chat`
        const replyMsg: ChatMessage = { id: replyId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, replyMsg] }))
        const text = pickRandom(CHAT_REPLIES)
        trackStream("chat", text, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === replyId ? { ...m, content: t } : m) })), () => {
          set((s) => ({ isTyping: false, messages: s.messages.map((m) => m.id === replyId ? { ...m, isStreaming: false } : m) }))
          syncSession(get, set)
        })
      }, humanDelay(500))
    }
  },

  /* ── Step 2: User picks clarify option ── */
  selectClarifyOption: (optionLabel) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}-uo`, role: "user", content: optionLabel, timestamp: new Date(), status: "sent" }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    const step = get().clarifyStep
    if (step < DEMO_CLARIFY_CARDS.length - 1) {
      setTimeout(() => {
        const nextCard = DEMO_CLARIFY_CARDS[step + 1]
        const msg: ChatMessage = { id: `msg-${Date.now()}-cl2`, role: "assistant", content: nextCard.question, timestamp: new Date(), clarifyCard: nextCard }
        set((s) => ({ messages: [...s.messages, msg], clarifyStep: step + 1 }))
        syncSession(get, set)
      }, 400)
    } else {
      set({ isTyping: true })
      setTimeout(() => {
        const planMsg: ChatMessage = {
          id: `msg-${Date.now()}-plan`, role: "assistant",
          content: "好的，确认完毕。以下是执行方案：",
          timestamp: new Date(), buildPlan: DEMO_BUILD_PLAN,
        }
        set((s) => ({ messages: [...s.messages, planMsg], isTyping: false, taskState: "confirming" }))
        syncSession(get, set)
      }, 600)
    }
  },

  /* ── Step 3: Confirm build ── */
  confirmBuild: () => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}-cb`, role: "user", content: "开始执行", timestamp: new Date(), status: "sent" }
    const phases = DEMO_TASK_PHASES.map((p) => ({ ...p, status: "pending" as const, children: p.children?.map((c) => ({ ...c, status: "pending" as const })) }))
    const authPhases = phases.filter((p) => p.authType)

    if (authPhases.length > 0) {
      const authMsg: ChatMessage = {
        id: `msg-${Date.now()}-auth`, role: "assistant",
        content: "开始之前，需要你授权以下服务：",
        timestamp: new Date(), authCards: authPhases,
      }
      set((s) => ({ messages: [...s.messages, userMsg, authMsg], taskState: "authorizing", taskPhases: phases }))
    } else {
      set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }))
      setTimeout(() => {
        const explainId = `msg-${Date.now()}-explain`
        const explainMsg: ChatMessage = { id: explainId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
        set((s) => ({ messages: [...s.messages, explainMsg] }))
        const explainText = `好的，将挖掘 Ryan Kay（Refer.io 频道首席教育官/主持人，公司 CEO 为 Ryan Kohler）的所有电话、邮箱及线上社交媒体轨迹，涵盖领英、推特等各类社交媒体。分析其在不同社交媒体上的活跃度，找出最有效的触达方式，并将最终结果写入一个 Notion 文档。\n\n本次研究大约需要 ${DEMO_BUILD_PLAN.estimatedTime}，生成好后我会主动发送给你。在此期间你可以继续发新消息或离开当前对话。`
        trackStream("explain", explainText, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === explainId ? { ...m, content: t } : m) })), () => {
          const newPlan = { ...DEMO_AGENT_PLAN, createdAt: new Date() }
          set((s) => ({
            isTyping: false,
            messages: s.messages.map((m) => m.id === explainId ? { ...m, isStreaming: false, agentPlan: newPlan } : m),
            agents: s.agents.map((a) => a.id === "agent-research" ? {
              ...a,
              status: "running" as const,
              purpose: newPlan.prompt,
              workflow: newPlan.steps,
            } : a),
          }))
          syncSession(get, set)
          setTimeout(() => {
            const progressMsg: ChatMessage = { id: `msg-${Date.now()}-prog`, role: "assistant", content: "任务开始执行，以下是实时进度：", timestamp: new Date(), isProgressCard: true, progressPhases: phases }
            set((s) => ({
              messages: [...s.messages, progressMsg],
              taskState: "executing",
              taskPhases: phases,
            }))
            syncSession(get, set)
            startExecution(set, get)
          }, 600)
        })
      }, humanDelay(500))
    }
  },

  /* ── Step 4: Authorize ── */
  authorizeService: (phaseId) => {
    set((s) => ({ taskPhases: updatePhaseStatus(s.taskPhases, phaseId, "running") }))
    setTimeout(() => {
      const sysMsg: ChatMessage = { id: `msg-${Date.now()}-aok`, role: "system", content: "✅ 授权成功", timestamp: new Date() }
      set((s) => ({
        taskPhases: updatePhaseStatus(s.taskPhases, phaseId, "done"),
        messages: [...s.messages, sysMsg],
      }))
      const remaining = get().taskPhases.filter((p) => p.authType && p.status !== "done")
      if (remaining.length === 0) {
        setTimeout(() => {
          const goId = `msg-${Date.now()}-go`
          const goMsg: ChatMessage = { id: goId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
          set((s) => ({ messages: [...s.messages, goMsg] }))
          const goText = `所有授权完成！现在开始执行任务。\n\n本次研究大约需要 ${DEMO_BUILD_PLAN.estimatedTime}，生成好后我会主动发送给你。在此期间你可以继续发新消息或离开当前对话。`
          trackStream("auth-go", goText, (t) => set((s) => ({ messages: s.messages.map((m) => m.id === goId ? { ...m, content: t } : m) })), () => {
            const newPlan2 = { ...DEMO_AGENT_PLAN, createdAt: new Date() }
            set((s) => ({
              messages: s.messages.map((m) => m.id === goId ? { ...m, isStreaming: false, agentPlan: newPlan2 } : m),
              agents: s.agents.map((a) => a.id === "agent-research" ? {
                ...a,
                status: "running" as const,
                purpose: newPlan2.prompt,
                workflow: newPlan2.steps,
              } : a),
            }))
            syncSession(get, set)
            setTimeout(() => {
              const progressMsg: ChatMessage = {
                id: `msg-${Date.now()}-prog`, role: "assistant", content: "任务开始执行，以下是实时进度：",
                timestamp: new Date(), isProgressCard: true,
                progressPhases: get().taskPhases,
              }
              set((s) => ({
                messages: [...s.messages, progressMsg],
                taskState: "executing",
              }))
              syncSession(get, set)
              startExecution(set, get)
            }, 600)
          })
        }, 400)
      }
    }, humanDelay(800))
  },

  skipAuth: (phaseId) => {
    const sysMsg: ChatMessage = { id: `msg-${Date.now()}-skip`, role: "system", content: "⚠️ 已跳过授权，相关功能可能受限", timestamp: new Date() }
    set((s) => ({
      taskPhases: updatePhaseStatus(s.taskPhases, phaseId, "error"),
      messages: [...s.messages, sysMsg],
    }))
    const remaining = get().taskPhases.filter((p) => p.authType && p.status === "pending")
    if (remaining.length === 0) {
      setTimeout(() => {
        const goMsg: ChatMessage = { id: `msg-${Date.now()}-go2`, role: "assistant", content: "开始执行任务…", timestamp: new Date() }
        const progressMsg: ChatMessage = { id: `msg-${Date.now()}-prog2`, role: "assistant", content: "任务开始执行，以下是实时进度：", timestamp: new Date(), isProgressCard: true, progressPhases: get().taskPhases }
        set((s) => ({ messages: [...s.messages, goMsg, progressMsg], taskState: "executing" }))
        startExecution(set, get)
      }, 400)
    }
  },

  /* ── Stop / Resume ── */
  stopTask: () => {
    ++currentExecutionId
    set((s) => {
      const donePhases = s.taskPhases.filter((p) => p.status === "done" && !p.authType)
      const doneChildren = s.taskPhases.flatMap((p) => (p.children ?? []).filter((c) => c.status === "done"))
      const allDone = [...donePhases, ...doneChildren]
      const pendingPhases = s.taskPhases.filter((p) => (p.status === "running" || p.status === "pending") && !p.authType)

      const doneSummary = allDone.length > 0 ? allDone.map((p) => p.title).join("、") : "暂无"
      const interruptAt = pendingPhases.length > 0 ? pendingPhases[0].title : "后续步骤"

      const stopMsg: ChatMessage = {
        id: `msg-${Date.now()}-stop-detail`, role: "assistant",
        content: `构建被手动停止了。已完成：${doneSummary}。在「${interruptAt}」之前被中断。`,
        timestamp: new Date(),
      }
      const continueMsg: ChatMessage = {
        id: `msg-${Date.now()}-continue`, role: "assistant",
        content: "你想怎么继续？",
        timestamp: new Date(),
        nextActions: [
          { label: "继续构建", action: "继续构建，从中断处恢复" },
          { label: "从头重新构建", action: "从头重新构建这个任务" },
          { label: "查看已收集的数据", action: "查看已收集到的详细数据" },
          { label: "不用了", action: "不用了，就这样吧" },
        ],
      }

      return {
        taskState: "paused", taskPaused: true,
        messages: [...s.messages, stopMsg, continueMsg],
        taskPhases: s.taskPhases.map((p) => p.status === "running" ? { ...p, status: "paused" as const } : p),
      }
    })
  },

  resumeTask: () => {
    const sysMsg: ChatMessage = { id: `msg-${Date.now()}-resume`, role: "system", content: "▶️ 任务已恢复", timestamp: new Date() }
    set((s) => ({
      taskState: "executing", taskPaused: false,
      messages: [...s.messages, sysMsg],
    }))
    startExecution(set, get)
  },
}))

/* ── Execution engine ── */

function syncPhasesToSession(s: AppState, phases: TaskPhase[]): Partial<AppState> {
  const sid = s.activeSessionId ?? s.sessions.find((ss) => ss.taskState === "executing")?.id
  if (!sid) return {}
  return {
    sessions: s.sessions.map((ss) =>
      ss.id === sid ? { ...ss, taskPhases: phases, messages: ss.messages.map((m) => m.isProgressCard ? { ...m, progressPhases: phases } : m) } : ss,
    ),
  }
}

function getNextAuthPhase(phases: TaskPhase[]): TaskPhase | null {
  return phases.find((p) => p.authType && p.status === "pending") ?? null
}

function startExecution(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  get: () => AppState,
) {
  const execId = ++currentExecutionId
  set(() => ({ executionId: execId }))

  const isStale = () => currentExecutionId !== execId || get().taskPaused || get().taskState !== "executing"

  const phases = get().taskPhases
  const pending = getAllPending(phases)
  if (pending.length === 0) {
    const pendingAuth = getNextAuthPhase(phases)
    if (pendingAuth) {
      triggerAuthInterrupt(set, get, pendingAuth)
      return
    }
    completeTask(set, get)
    return
  }

  let delay = 200
  let hitAuth = false

  for (const item of pending) {
    if (item.authType && item.status !== "done") continue

    const allPhases = get().taskPhases
    const pendingAuth = getNextAuthPhase(allPhases)
    if (pendingAuth) {
      const normalPending = getAllPending(allPhases).filter((p) => !p.authType)
      const authIndex = allPhases.findIndex((p) => p.id === pendingAuth.id)
      const itemIndex = allPhases.findIndex((p) => p.id === item.id)
      if (itemIndex >= authIndex && normalPending.filter((p) => allPhases.findIndex((pp) => pp.id === p.id) < authIndex).length === 0) {
        hitAuth = true
        break
      }
    }

    const d = delay
    setTimeout(() => {
      if (isStale()) return
      set((s) => {
        const np = updatePhaseStatus(s.taskPhases, item.id, "running")
        return {
          taskPhases: np,
          messages: s.messages.map((m) => m.isProgressCard ? { ...m, progressPhases: np } : m),
          ...syncPhasesToSession(s, np),
        }
      })

      setTimeout(() => {
        if (isStale()) return
        set((s) => {
          const np = updatePhaseStatus(s.taskPhases, item.id, "done")
          return {
            taskPhases: np,
            messages: s.messages.map((m) => m.isProgressCard ? { ...m, progressPhases: np } : m),
            ...syncPhasesToSession(s, np),
          }
        })
        const remaining = getAllPending(get().taskPhases)
        if (remaining.length === 0) {
          const auth = getNextAuthPhase(get().taskPhases)
          if (auth) {
            triggerAuthInterrupt(set, get, auth)
          } else {
            completeTask(set, get)
          }
        }
      }, humanDelay(800))
    }, d)
    delay += humanDelay(1000)
  }

  if (hitAuth) {
    const pendingAuth = getNextAuthPhase(get().taskPhases)!
    setTimeout(() => {
      if (isStale()) return
      triggerAuthInterrupt(set, get, pendingAuth)
    }, delay)
  }
}

function triggerAuthInterrupt(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  get: () => AppState,
  authPhase: TaskPhase,
) {
  const state = get()
  const sid = state.activeSessionId ?? findExecutingSession(state)
  const np = updatePhaseStatus(state.taskPhases, authPhase.id, "auth-required" as TaskPhase["status"])

  const interruptMsg: ChatMessage = {
    id: `msg-${Date.now()}-interrupt`, role: "assistant",
    content: `执行过程中需要你的授权：${authPhase.serviceName ?? authPhase.title}`,
    timestamp: new Date(), authCards: [authPhase],
  }

  set((s) => {
    const update: Partial<AppState> = {
      taskState: "authorizing",
      taskPhases: np,
      toastNotification: {
        title: "需要你的操作",
        desc: `${authPhase.serviceName ?? authPhase.title} 需要授权才能继续`,
        sessionId: sid ?? undefined,
      },
    }

    if (s.pageView === "conversation" && s.activeSessionId === sid) {
      update.messages = [...s.messages, interruptMsg]
    }

    if (sid) {
      const session = s.sessions.find((ss) => ss.id === sid)
      if (session) {
        const msgs = s.activeSessionId === sid ? [...s.messages, interruptMsg] : [...session.messages, interruptMsg]
        update.sessions = s.sessions.map((ss) =>
          ss.id === sid ? { ...ss, messages: msgs, taskState: "authorizing" as const, taskPhases: np } : ss,
        )
      }
    }

    return update
  })
  setTimeout(() => set(() => ({ toastNotification: null })), 5000)
}

function findExecutingSession(state: AppState): string | null {
  return state.sessions.find((s) => s.taskState === "executing")?.id ?? null
}

function getAllPending(phases: TaskPhase[]): TaskPhase[] {
  const result: TaskPhase[] = []
  for (const p of phases) {
    if (p.status === "pending" && !p.authType) result.push(p)
    if (p.children) {
      for (const c of p.children) { if (c.status === "pending") result.push(c) }
    }
  }
  return result
}

const NEXT_ACTIONS = [
  { label: "生成邮件草稿", action: "帮我根据报告内容生成一封触达邮件" },
  { label: "深入分析", action: "帮我进一步分析这个人的社交活跃时段" },
  { label: "导出 PDF", action: "帮我把报告导出为 PDF" },
  { label: "再查一个人", action: "帮我用同样的方式查另一个人" },
]

function completeTask(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  get: () => AppState,
) {
  const resultMsg: ChatMessage = {
    id: `msg-${Date.now()}-result`, role: "assistant", content: "任务已完成，报告如下：",
    timestamp: new Date(), isResultCard: true, resultCard: DEMO_RESULT,
  }
  const nextActionMsg: ChatMessage = {
    id: `msg-${Date.now()}-next`, role: "assistant",
    content: "接下来你想做什么？",
    timestamp: new Date(), nextActions: NEXT_ACTIONS,
  }
  const newMsgs = [resultMsg, nextActionMsg]

  const state = get()
  const executingSessionId = state.activeSessionId ?? findExecutingSession(state)

  set((s) => {
    const update: Partial<AppState> = {
      taskState: "completed",
      notifications: [
        { id: `notif-${Date.now()}`, title: DEMO_RESULT.title, desc: DEMO_RESULT.summary.slice(0, 40), date: "刚刚", sessionId: executingSessionId ?? undefined },
        ...s.notifications,
      ],
      toastNotification: { title: DEMO_RESULT.title, desc: DEMO_RESULT.summary.slice(0, 50), sessionId: executingSessionId ?? undefined },
      agents: s.agents.map((a) => a.id === "agent-research" ? {
        ...a,
        runCount: a.runCount + 1,
        lastRunAt: new Date(),
        sessions: executingSessionId ? [...new Set([...a.sessions, executingSessionId])] : a.sessions,
      } : a),
    }

    if (s.pageView === "conversation" && s.activeSessionId === executingSessionId) {
      update.messages = [...s.messages, ...newMsgs]
    }

    if (executingSessionId) {
      const existingSession = s.sessions.find((ss) => ss.id === executingSessionId)
      if (existingSession) {
        const updatedMessages = s.activeSessionId === executingSessionId
          ? [...s.messages, ...newMsgs]
          : [...existingSession.messages, ...newMsgs]
        update.sessions = s.sessions.map((ss) =>
          ss.id === executingSessionId
            ? { ...ss, messages: updatedMessages, taskState: "completed" as const, taskResult: DEMO_RESULT, lastMessage: DEMO_RESULT.title, updatedAt: new Date() }
            : ss,
        )
      }
    }

    return update
  })
  setTimeout(() => set(() => ({ toastNotification: null })), 5000)
}
