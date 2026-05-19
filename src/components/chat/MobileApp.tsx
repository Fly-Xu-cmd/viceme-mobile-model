import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  ArrowUp, Mic, Trash2, Search, Pencil, ChevronLeft, ChevronRight, ChevronDown,
  Check, CheckCheck, AlertCircle,
  Compass, Bell, User, Camera, X, MessageCircle,
  Settings, BookOpen, Type, ShieldCheck, Volume2,
  Globe, ExternalLink, Pause, Play,
  Loader2, CheckCircle2, Circle, Shield,
  Copy, ThumbsUp, ThumbsDown, FileText, Share2, Bookmark, MoreHorizontal,
  Image as ImageIcon, Phone, Paperclip,
} from "lucide-react"
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/stores/chatStore"
import { SkillHashGlyph } from "@/components/common/SkillHashGlyph"
import type { ChatMessage, ChatSession, TaskPhase, TabId, ClarifyCard, NextAction, AgentStatus, PermissionType, PermissionStatus, ImageAttachment } from "@/types"

/* ══════ Helpers ══════ */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>
}

function formatRelDate(d: Date) {
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400_000)
  if (days === 0) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  if (days === 1) return "昨天"
  if (days < 7) return `${days}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* ══════ Tab Bar ══════ */
function TabBar() {
  const activeTab = useChatStore((s) => s.activeTab)
  const setActiveTab = useChatStore((s) => s.setActiveTab)
  const pageView = useChatStore((s) => s.pageView)
  const newChat = useChatStore((s) => s.newChat)

  const isInConversation = pageView === "conversation"

  const goBack = useChatStore((s) => s.goBack)

  const handleTabClick = (id: string) => {
    if (id === "create") {
      setActiveTab("create" as TabId)
      if (isInConversation) return
      if (pageView !== "tabs") goBack()
      newChat()
    } else {
      if (pageView !== "tabs") goBack()
      setActiveTab(id as TabId)
    }
  }

  const tabs = [
    { id: "create", label: "创建", icon: <span className="text-[22px] leading-none font-light">+</span> },
    { id: "agents", label: "智能体", icon: <Compass className="size-5" /> },
    { id: "profile", label: "我的", icon: <Settings className="size-5" /> },
  ]

  return (
    <div className="shrink-0 flex items-end justify-around bg-white/95 backdrop-blur-md border-t border-slate-100 px-2 pt-1.5 pb-1 safe-bottom">
      {tabs.map((tab) => {
        const isActive = tab.id === "create"
          ? isInConversation
          : pageView === "tabs" && activeTab === tab.id

        return (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className={cn("flex flex-col items-center gap-0.5 min-w-[64px] py-1 relative", isActive ? "text-[#4F6EF7]" : "text-slate-400")}>
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ══════ Chat List ══════ */
function ChatListPage() {
  const sessions = useChatStore((s) => s.sessions)
  const openSession = useChatStore((s) => s.openSession)
  const newChat = useChatStore((s) => s.newChat)
  const deleteSession = useChatStore((s) => s.deleteSession)

  const sorted = useMemo(() => [...sessions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()), [sessions])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 bg-gradient-to-b from-purple-100 via-pink-50 to-[#F7F8FA] px-4 pt-3 pb-2 safe-top">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[17px] font-bold text-slate-800">工作区</span>
          <button className="flex size-8 items-center justify-center rounded-full text-slate-500"><Search className="size-5" /></button>
        </div>
      </div>
      {/* ViceMe 入口行 */}
      <button onClick={newChat} className="flex w-full items-center gap-3 px-4 py-3.5 bg-blue-50/60 active:bg-blue-50 transition-colors">
        <SkillHashGlyph seedText="viceme-ai" size={40} />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-semibold text-slate-800">ViceMe</p>
            <span className="text-[10px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 font-medium">AI</span>
          </div>
          <p className="text-[13px] text-slate-400 mt-0.5">聊聊新话题</p>
        </div>
      </button>
      <div className="flex-1 overflow-y-auto scrollbar-none bg-[#F7F8FA]">
        {sorted.map((s) => (
          <SwipeRow key={s.id} session={s} onOpen={() => openSession(s.id)} onDelete={() => deleteSession(s.id)} />
        ))}
        <div className="h-4" />
      </div>
    </div>
  )
}

function SwipeRow({ session, onOpen, onDelete }: { session: ChatSession; onOpen: () => void; onDelete: () => void }) {
  const x = useMotionValue(0)
  const bgOp = useTransform(x, [-80, 0], [1, 0])
  const handleDragEnd = () => { animate(x, x.get() < -40 ? -80 : 0, { duration: 0.2 }) }

  const taskIndicator = session.taskState === "executing" ? "🔵" : session.taskState === "completed" ? "✅" : session.taskState === "paused" ? "⏸" : null

  return (
    <div className="relative overflow-hidden">
      <motion.div className="absolute inset-y-0 right-0 flex items-stretch" style={{ opacity: bgOp, width: 80 }}>
        <button onClick={() => { onDelete(); animate(x, 0, { duration: 0.2 }) }} className="flex-1 flex items-center justify-center bg-red-500 text-white"><Trash2 className="size-4" /></button>
      </motion.div>
      <motion.div style={{ x }} drag="x" dragConstraints={{ left: -80, right: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd} className="relative bg-[#F7F8FA]">
        <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-white/60 transition-colors">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: session.color + "20" }}>
            <MessageCircle className="size-5" style={{ color: session.color }} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-semibold text-slate-800 truncate">{taskIndicator && <span className="mr-1">{taskIndicator}</span>}{session.title}</p>
            {session.lastMessage && <p className="text-[13px] text-slate-400 truncate mt-0.5">{session.lastMessage}</p>}
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 self-start mt-1.5">{formatRelDate(session.updatedAt)}</span>
        </button>
      </motion.div>
    </div>
  )
}

/* ══════ Agent History ══════ */
const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ready: { label: "就绪", color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="size-3 text-green-500" /> },
  running: { label: "进行中", color: "text-blue-600", bg: "bg-blue-50", icon: <Loader2 className="size-3 text-blue-500 animate-spin" /> },
  pending: { label: "待确认", color: "text-amber-600", bg: "bg-amber-50", icon: <AlertCircle className="size-3 text-amber-500" /> },
}

function AgentHistoryPage() {
  const agents = useChatStore((s) => s.agents)
  const openAgentDetail = useChatStore((s) => s.openAgentDetail)

  const sorted = useMemo(() => [...agents].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  }), [agents])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2 bg-white safe-top">
        <h1 className="text-[20px] font-bold text-slate-800 text-center">Agent</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-2">
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-50">
          {sorted.map((agent) => {
            const sc = STATUS_CONFIG[agent.status]
            return (
              <button key={agent.id} onClick={() => openAgentDetail(agent.id)} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors">
                <div className="relative shrink-0">
                  <SkillHashGlyph seedText={agent.id} size={44} />
                  {agent.status === "running" && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-3">
                      <span className="animate-ping absolute inline-flex size-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-blue-500" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-slate-800 truncate">{agent.name}</p>
                    {agent.pinned && <Bookmark className="size-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[13px] text-slate-400 mt-0.5">{agent.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", sc.bg, sc.color)}>
                      {sc.icon} {sc.label}
                    </span>
                    <span className="text-[11px] text-slate-400">运行 {agent.runCount} 次 · 最近 {formatRelDate(agent.lastRunAt)}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-slate-400 shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ══════ Agent Detail ══════ */
function AgentDetailPage() {
  const agents = useChatStore((s) => s.agents)
  const detailAgentId = useChatStore((s) => s.detailAgentId)
  const sessions = useChatStore((s) => s.sessions)
  const taskState = useChatStore((s) => s.taskState)
  const goBack = useChatStore((s) => s.goBack)
  const openResultDetail = useChatStore((s) => s.openResultDetail)
  const [editingPlan, setEditingPlan] = useState(false)
  const [planText, setPlanText] = useState("")

  const agent = agents.find((a) => a.id === detailAgentId)
  const isRunning = agent ? (taskState === "executing" || taskState === "paused") && agent.id === "agent-research" : false

  const latestResult = useMemo(() => {
    if (!agent) return null
    for (const sid of [...agent.sessions].reverse()) {
      const sess = sessions.find((s) => s.id === sid)
      if (sess?.taskResult) return sess.taskResult
    }
    return null
  }, [agent, sessions])

  useEffect(() => {
    if (agent) setPlanText(agent.purpose)
  }, [agent])

  if (!agent) return null

  const currentTask = agent.runLogs[0]
  const historyTasks = agent.runLogs.slice(1)

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-30 flex flex-col bg-white">
      <div className="shrink-0 flex items-center px-3 py-2.5 bg-white border-b border-slate-100 safe-top">
        <button onClick={goBack} className="shrink-0 text-slate-500 mr-2"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800 flex-1 truncate">{agent.name}</span>
        <button className="flex items-center gap-1 text-slate-400 active:text-slate-600 transition-colors">
          <Play className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="px-5 pt-4 pb-6">

          <ScheduleReminder />

          {currentTask && (
            <button
              onClick={() => latestResult && !isRunning && openResultDetail(latestResult)}
              className={cn("rounded-xl border border-slate-100 bg-slate-50 overflow-hidden mb-6 w-full text-left", !isRunning && latestResult && "active:bg-slate-100 transition-colors")}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {isRunning ? (
                  <Loader2 className="size-5 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 truncate">{currentTask.title}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">{currentTask.result}</p>
                </div>
                {!isRunning && latestResult && <ChevronRight className="size-4 text-slate-400 shrink-0" />}
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{isRunning ? "正在执行…" : formatRelDate(currentTask.timestamp)}</span>
                <span className="text-[11px] text-slate-400">{currentTask.tokenUsage} tokens</span>
              </div>
            </button>
          )}

          <AgentDocSection
            title="Plan"
            level={1}
            action={<button onClick={() => setEditingPlan(!editingPlan)} className="text-[12px] text-slate-500 font-medium active:opacity-70 transition-opacity">{editingPlan ? "完成" : "编辑"}</button>}
          >
            {editingPlan ? (
              <textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-[#4F6EF7] transition-colors"
                rows={10}
              />
            ) : (
              <ExpandableText text={planText} maxLines={5} />
            )}
          </AgentDocSection>

          {agent.checklist.length > 0 && (
            <CollapsibleDocSection title="检查清单" level={2} badge={`${agent.checklist.length}`}>
              <AgentChecklist steps={agent.workflow} agentChecklist={agent.checklist} />
            </CollapsibleDocSection>
          )}

          {agent.workflow.length > 0 && (
            <CollapsibleDocSection title="工作流" level={2} badge={`${agent.workflow.length} 步`}>
              <div className="space-y-2">
                {agent.workflow.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[13px] text-slate-400 font-medium shrink-0 w-5 text-right">{i + 1}.</span>
                    <span className="text-[14px] text-slate-700 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </CollapsibleDocSection>
          )}

          {historyTasks.length > 0 && (
            <CollapsibleDocSection title="历史" level={2} badge={`${historyTasks.length}`}>
              {historyTasks.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 leading-snug">{log.title}</p>
                    <span className="text-[11px] text-slate-400">{formatRelDate(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </CollapsibleDocSection>
          )}
        </div>
        <div className="h-8 safe-bottom" />
      </div>
    </motion.div>
  )
}

/* ══════ Notifications ══════ */
export function NotificationsPage() {
  const notifications = useChatStore((s) => s.notifications)
  const openSession = useChatStore((s) => s.openSession)
  const markNotificationsRead = useChatStore((s) => s.markNotificationsRead)

  useEffect(() => { markNotificationsRead() }, [markNotificationsRead])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2 bg-white safe-top">
        <h1 className="text-[20px] font-bold text-slate-800 text-center">通知</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-2">
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-50">
          {notifications.map((n) => (
            <button key={n.id} onClick={() => n.sessionId && openSession(n.sessionId)} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50"><Bell className="size-5 text-blue-400" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-slate-800">{n.title}</p>
                <p className="text-[13px] text-slate-400 mt-0.5">{n.desc}</p>
                <p className="text-[11px] text-slate-300 mt-1">{n.date}</p>
              </div>
              {n.sessionId && <ChevronRight className="size-4 text-slate-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════ Profile ══════ */
function ProfilePage() {
  const setShowLogin = useChatStore((s) => s.setShowLogin)
  const isLoggedIn = useChatStore((s) => s.isLoggedIn)

  const groups = [
    [{ icon: <User className="size-5" />, label: "ViceMe 形象", color: "text-pink-500" }, { icon: <Volume2 className="size-5" />, label: "声音", color: "text-blue-500", detail: "温柔桃子 1.0 倍" }, { icon: <Type className="size-5" />, label: "字号与背景", color: "text-purple-500" }],
    [{ icon: <BookOpen className="size-5" />, label: "记忆", color: "text-blue-500", detail: "已开启" }, { icon: <Search className="size-5" />, label: "查找聊天内容", color: "text-blue-500" }],
    [{ icon: <ShieldCheck className="size-5" />, label: "未成年人模式", color: "text-green-500" }, { icon: <Settings className="size-5" />, label: "设置", color: "text-slate-500" }],
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-2 bg-white safe-top"><div className="h-8" /></div>
      <div className="flex-1 overflow-y-auto scrollbar-none bg-[#F7F8FA]">
        <div className="flex flex-col items-center pt-6 pb-4 bg-white">
          <SkillHashGlyph seedText="user-avatar" size={80} />
          {isLoggedIn ? (
            <>
              <p className="text-[18px] font-bold text-slate-800 mt-3">ViceMe 用户</p>
              <p className="text-[13px] text-slate-400 mt-0.5">viceme号: user001</p>
              <button className="mt-3 px-5 py-1.5 rounded-full border border-slate-200 text-[13px] text-slate-600 font-medium">账号管理</button>
            </>
          ) : (
            <>
              <p className="text-[18px] font-bold text-slate-800 mt-3">未登录</p>
              <button onClick={() => setShowLogin(true)} className="mt-3 px-5 py-1.5 rounded-full bg-[#4F6EF7] text-white text-[13px] font-medium active:bg-[#3D5CE5]">立即登录</button>
            </>
          )}
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="bg-white rounded-2xl mx-3 mt-3 overflow-hidden divide-y divide-slate-50">
            {g.map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
                <span className={item.color}>{item.icon}</span>
                <span className="text-[15px] text-slate-800 flex-1">{item.label}</span>
                {item.detail && <span className="text-[13px] text-slate-400">{item.detail}</span>}
                <ChevronRight className="size-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        ))}
        <div className="h-8" />
      </div>
    </div>
  )
}

/* ══════ Conversation ══════ */
function ConversationPage() {
  const goBack = useChatStore((s) => s.goBack)

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-30 flex flex-col bg-white">
      <div className="shrink-0 flex items-center px-3 py-2.5 bg-white safe-top">
        <button onClick={goBack} className="shrink-0 text-slate-500 mr-2"><ChevronLeft className="size-6" /></button>
        <SkillHashGlyph seedText="viceme-ai" size={36} />
        <div className="ml-2.5 min-w-0 flex-1">
          <p className="text-[16px] font-bold text-slate-800 leading-tight">ViceMe</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">内容由 AI 生成</p>
        </div>
        <div className="w-6" />
      </div>

      <LoginBanner />
      <ChatMessageList />
      <BottomArea />
    </motion.div>
  )
}

function ChatMessageList() {
  const messages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const taskState = useChatStore((s) => s.taskState)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowScrollBtn(false)
  }, [messages, isTyping])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80)
  }

  const handleLongPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    const scrollRect = scrollEl.getBoundingClientRect()
    let clientX: number, clientY: number
    if ("touches" in e) {
      clientX = e.touches[0]?.clientX ?? 0
      clientY = e.touches[0]?.clientY ?? 0
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    setContextMenu({ x: clientX - scrollRect.left, y: clientY - scrollRect.top })
  }, [])

  const isNormalState = taskState === "idle" || taskState === "executing"
  const canShowBtn = showScrollBtn && isNormalState && messages.length > 0

  return (
    <div className="flex-1 relative min-h-0">
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto scrollbar-none">
        <div className="py-4 space-y-3">
          {messages.length === 0 && !isTyping && <WelcomeScreen />}
          {messages.map((msg) => <MessageItem key={msg.id} message={msg} onLongPress={handleLongPress} />)}
          {isTyping && !messages.some((m) => m.isStreaming) && <TypingDots />}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>
      <AnimatePresence>
        {canShowBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-slate-200/80 text-slate-500 active:bg-slate-100 transition-colors z-10"
          >
            <ChevronDown className="size-4" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            position={contextMenu}
            onClose={() => setContextMenu(null)}
            containerSize={{ w: scrollRef.current?.clientWidth ?? 400, h: scrollRef.current?.clientHeight ?? 600 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const WELCOME_SUGGESTIONS = [
  ["帮我调研 Ryan Kay 的公开信息和联系方式", "帮我写一份项目周报", "分析一下竞品的用户评价"],
  ["帮我整理本周会议纪要", "竞品功能对比分析", "帮我写一封商务邮件"],
  ["帮我生成一份数据报告", "搜索行业最新动态", "帮我翻译一篇英文文章"],
]

function WelcomeScreen() {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [groupIdx, setGroupIdx] = useState(0)
  const suggestions = WELCOME_SUGGESTIONS[groupIdx % WELCOME_SUGGESTIONS.length]

  const handleRefresh = () => setGroupIdx((i) => i + 1)

  return (
    <div className="pt-5 pb-4 px-4">
      <div className="bg-[#F7F7F8] rounded-2xl px-4 pt-4 pb-3.5">
        <p className="text-[15px] text-slate-800 leading-relaxed mb-4">
          Hi，我是你的 AI 助手 ViceMe～有什么需要帮忙的，都可以问我。
        </p>

        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={`${groupIdx}-${i}`}
              onClick={() => sendMessage(s)}
              className="flex w-full items-center justify-between bg-white rounded-xl px-3.5 py-3 text-left active:bg-slate-50 transition-colors"
            >
              <p className="text-[14px] text-slate-800 min-w-0 flex-1 pr-3">{s}</p>
              <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
            </button>
          ))}
        </div>

        <button onClick={handleRefresh} className="flex items-center gap-1.5 mt-3 text-slate-400 active:text-slate-500 transition-colors">
          <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 8a6.5 6.5 0 0 1 11.25-4.5M14.5 8a6.5 6.5 0 0 1-11.25 4.5" />
            <path d="M13.5 1v3.5H10M2.5 15v-3.5H6" />
          </svg>
          <span className="text-[14px]">换一批</span>
        </button>
      </div>
    </div>
  )
}

/* ── Long press hook ── */
function useLongPress(callback: (e: React.MouseEvent | React.TouchEvent) => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const movedRef = useRef(false)

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    movedRef.current = false
    timerRef.current = setTimeout(() => { if (!movedRef.current) callback(e) }, delay)
  }, [callback, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const move = useCallback(() => { movedRef.current = true; cancel() }, [cancel])

  return { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel, onMouseMove: move, onTouchStart: start, onTouchEnd: cancel, onTouchMove: move }
}

/* ── Message Context Menu ── */
function MessageContextMenu({ position, onClose, containerSize }: { position: { x: number; y: number }; onClose: () => void; containerSize: { w: number; h: number } }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjusted, setAdjusted] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mw = rect.width
    const mh = rect.height
    const pad = 8
    let left = position.x - mw / 2
    let top = position.y - mh - 12
    if (left < pad) left = pad
    if (left + mw > containerSize.w - pad) left = containerSize.w - mw - pad
    if (top < pad) top = position.y + 12
    if (top + mh > containerSize.h - pad) top = containerSize.h - mh - pad
    setAdjusted({ left, top })
  }, [position, containerSize])

  const topRow = [
    { icon: <Copy className="size-[18px]" />, label: "复制" },
    { icon: <Volume2 className="size-[18px]" />, label: "朗读" },
    { icon: <MessageCircle className="size-[18px]" />, label: "追问" },
  ]

  const feedbackGroup = [
    { icon: <ThumbsUp className="size-[16px]" />, label: "喜欢" },
    { icon: <ThumbsDown className="size-[16px]" />, label: "不喜欢" },
  ]

  const actionGroup = [
    { icon: <Type className="size-[16px]" />, label: "选取文字" },
    { icon: <FileText className="size-[16px]" />, label: "创建文档" },
    { icon: <Share2 className="size-[16px]" />, label: "分享" },
    { icon: <Bookmark className="size-[16px]" />, label: "收藏" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="absolute inset-0 z-50"
      onClick={onClose}
    >
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] w-[200px]"
        style={{ left: adjusted?.left ?? position.x, top: adjusted?.top ?? position.y, visibility: adjusted ? "visible" : "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row: horizontal */}
        <div className="flex items-center justify-around py-3 px-2">
          {topRow.map((item) => (
            <button key={item.label} onClick={onClose} className="flex flex-col items-center gap-1.5 min-w-[52px] active:opacity-50 transition-opacity">
              <span className="text-black">{item.icon}</span>
              <span className="text-[12px] text-black">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="h-px bg-slate-100 mx-3" />

        {/* Feedback group */}
        <div className="py-1">
          {feedbackGroup.map((item) => (
            <button key={item.label} onClick={onClose} className="flex w-full items-center gap-3 px-4 py-2.5 active:bg-slate-50 transition-colors">
              <span className="text-black">{item.icon}</span>
              <span className="text-[14px] text-black">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="h-px bg-slate-100 mx-3" />

        {/* Action group */}
        <div className="py-1">
          {actionGroup.map((item) => (
            <button key={item.label} onClick={onClose} className="flex w-full items-center gap-3 px-4 py-2.5 active:bg-slate-50 transition-colors">
              <span className="text-black">{item.icon}</span>
              <span className="text-[14px] text-black">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="h-px bg-slate-100 mx-3" />

        {/* More */}
        <button onClick={onClose} className="flex w-full items-center justify-center gap-2 px-4 py-2.5 active:bg-slate-50 transition-colors">
          <MoreHorizontal className="size-[16px] text-black" />
          <span className="text-[14px] text-black">更多</span>
          <ChevronDown className="size-3.5 text-black/40 ml-0.5" />
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ── Message rendering ── */
function MessageItem({ message, onLongPress }: { message: ChatMessage; onLongPress?: (e: React.MouseEvent | React.TouchEvent) => void }) {
  if (message.role === "system") return <SystemMsg text={message.content} />
  if (message.role === "user") return <UserBubble message={message} onLongPress={onLongPress} />
  return <AiBubble message={message} onLongPress={onLongPress} />
}

function SystemMsg({ text }: { text: string }) {
  return <div className="flex justify-center px-4"><span className="text-[12px] text-slate-400 bg-slate-100 rounded-full px-3 py-1">{text}</span></div>
}

function UserBubble({ message, onLongPress }: { message: ChatMessage; onLongPress?: (e: React.MouseEvent | React.TouchEvent) => void }) {
  const lp = useLongPress(onLongPress ?? (() => {}))
  const hasImages = message.images && message.images.length > 0

  return (
    <div className="msg-animate flex flex-col items-end gap-1.5 px-4">
      {hasImages && (
        <div className={cn("flex gap-1.5 justify-end max-w-[78%]", message.images!.length === 1 ? "flex-col" : "flex-wrap")}>
          {message.images!.map((img) => (
            <div key={img.id} className="rounded-xl overflow-hidden shadow-sm" style={{ width: message.images!.length === 1 ? 180 : 100, height: message.images!.length === 1 ? 180 : 100 }}>
              <div className="w-full h-full" style={{ background: img.src }} />
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end justify-end gap-1.5">
        {message.status === "sending" && <span className="size-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin mb-1" />}
        {message.status === "sent" && <CheckCheck className="size-3 text-blue-400 mb-1" />}
        {message.status === "failed" && <AlertCircle className="size-3 text-red-400 mb-1" />}
        {(!hasImages || message.content !== `发送了${message.images!.length === 1 ? "一张图片" : ` ${message.images!.length} 张图片`}`) && (
          <div {...lp} className="max-w-[78%] rounded-2xl rounded-tr-md bg-[#4F6EF7] px-4 py-2.5 shadow-sm select-none">
            <p className="text-[15px] leading-relaxed text-white whitespace-pre-line">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AiBubble({ message, onLongPress }: { message: ChatMessage; onLongPress?: (e: React.MouseEvent | React.TouchEvent) => void }) {
  const lp = useLongPress(onLongPress ?? (() => {}))
  const openAgentPlanDetail = useChatStore((s) => s.openAgentPlanDetail)
  const openResultDetail = useChatStore((s) => s.openResultDetail)

  const hasText = message.content.trim().length > 0
  const hasAgentPlan = !!message.agentPlan
  const hasBuildPlan = !!message.buildPlan
  const hasClarify = !!message.clarifyCard
  const hasProgress = message.isProgressCard && !!message.progressPhases
  const hasResult = message.isResultCard && !!message.resultCard

  return (
    <div className="msg-animate px-4">
      <div {...lp} className="rounded-2xl bg-[#f7f7f7] px-4 py-3 shadow-sm border border-slate-100 select-none">
        {/* Text content */}
        {hasText && (
          <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
            <RichText text={message.content} />
            {message.isStreaming && <span className="inline-block w-0.5 h-4 bg-[#4F6EF7] ml-0.5 align-middle animate-pulse" />}
          </p>
        )}
        {!hasText && message.isStreaming && (
          <p className="text-[15px] leading-relaxed text-slate-700">
            <span className="inline-block w-0.5 h-4 bg-[#4F6EF7] ml-0.5 align-middle animate-pulse" />
          </p>
        )}

        {/* ── Embedded: Agent Plan Card ── */}
        {hasAgentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn("rounded-xl border border-slate-200 overflow-hidden cursor-pointer bg-white", hasText && "mt-3")}
            onClick={() => openAgentPlanDetail(message.agentPlan!)}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-50">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-slate-400" />
                <span className="text-[12px] text-slate-500 font-medium">{message.agentPlan!.name}</span>
              </div>
              <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                <button className="text-slate-400 active:text-slate-600 transition-colors"><Copy className="size-3.5" /></button>
                <button onClick={() => openAgentPlanDetail(message.agentPlan!)} className="text-slate-400 active:text-slate-600 transition-colors"><ExternalLink className="size-3.5" /></button>
              </div>
            </div>
            <div className="relative">
              <div className="px-3 pt-2.5 pb-6">
                <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">
                  {message.agentPlan!.prompt.split("\n").filter(Boolean).slice(0, 5).join("\n")}
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none rounded-b-xl" />
            </div>
            <div className="flex justify-center px-3 pb-2.5 relative z-10">
              <span className="text-[12px] text-[#4F6EF7] font-medium">查看全文</span>
            </div>
          </motion.div>
        )}

        {/* ── Embedded: Build Plan Card ── */}
        {hasBuildPlan && (
          <div className={cn("rounded-xl border border-slate-200 overflow-hidden bg-white", hasText && "mt-3")}>
            <div className="px-3 pt-2.5 pb-2">
              <p className="text-[12px] text-slate-600 leading-relaxed">{message.buildPlan!.summary}</p>
            </div>
            <div className="px-3 pb-2.5">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {message.buildPlan!.services.map((s) => (
                  <div key={s.name} className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                    <SkillHashGlyph seedText={s.icon} size={14} />
                    <span className="text-[11px] text-slate-500">{s.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mb-2">⏱ 预计 {message.buildPlan!.estimatedTime}</p>
              <div className="space-y-1">
                {message.buildPlan!.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500 text-[10px] font-bold mt-0.5">{i + 1}</span>
                    <span className="text-slate-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Embedded: Clarify Card ── */}
        {hasClarify && !hasText && (
          <p className="text-[15px] leading-relaxed text-slate-700">{message.clarifyCard!.question}</p>
        )}

        {/* ── Embedded: Progress Card ── */}
        {hasProgress && (
          <EmbeddedProgressCard phases={message.progressPhases!} hasText={hasText} />
        )}

        {/* ── Embedded: Result Card ── */}
        {hasResult && (
          <div className={cn("rounded-xl border border-blue-100 overflow-hidden bg-white", hasText && "mt-3")}>
            <div className="px-3 pt-2.5 pb-2 bg-blue-50/50">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                <p className="text-[13px] font-semibold text-slate-800">{message.resultCard!.title}</p>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-[12px] text-slate-600 leading-relaxed">{message.resultCard!.summary}</p>
            </div>
            <div className="flex items-center gap-2 px-3 pb-2.5">
              <button onClick={() => openResultDetail(message.resultCard!)} className="text-[12px] text-[#4F6EF7] font-medium">查看完整内容</button>
              {message.resultCard!.link && (
                <a href={message.resultCard!.link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[12px] text-[#4F6EF7] font-medium ml-auto">
                  <ExternalLink className="size-3" /> {message.resultCard!.link.label}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmbeddedProgressCard({ phases, hasText }: { phases: TaskPhase[]; hasText: boolean }) {
  const taskState = useChatStore((s) => s.taskState)
  const stopTask = useChatStore((s) => s.stopTask)
  const resumeTask = useChatStore((s) => s.resumeTask)
  const openProgressDetail = useChatStore((s) => s.openProgressDetail)
  const { topLevel, percent } = useTaskProgress(phases)
  const canToggle = taskState === "executing" || taskState === "paused"

  return (
    <div className={cn("rounded-xl border border-slate-200 overflow-hidden bg-white", hasText && "mt-3")}>
      <div className="flex w-full items-center justify-between px-3 pt-2.5 pb-1.5">
        <button onClick={openProgressDetail} className="flex items-center gap-1.5 flex-1 min-w-0">
          {taskState === "executing" && <Loader2 className="size-3.5 text-blue-500 animate-spin shrink-0" />}
          {taskState === "completed" && <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />}
          {taskState === "paused" && <Pause className="size-3.5 text-amber-500 shrink-0" />}
          <span className="text-[13px] font-semibold text-slate-700">
            {taskState === "completed" ? "执行完成" : taskState === "paused" ? "已暂停" : "执行中…"}
          </span>
          <span className="text-[11px] text-slate-400 ml-auto mr-1">{percent}%</span>
          <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        </button>
        {canToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); taskState === "executing" ? stopTask() : resumeTask() }}
            className="flex size-6 items-center justify-center rounded-full ml-1.5 shrink-0 active:bg-slate-100 transition-colors border border-slate-200"
          >
            {taskState === "executing" ? <Pause className="size-2.5 text-slate-500" /> : <Play className="size-2.5 text-slate-500" />}
          </button>
        )}
      </div>
      <div className="mx-3 mb-2 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="px-3 pb-2.5 space-y-0.5">
        {topLevel.slice(0, 3).map((phase) => <PhaseItem key={phase.id} phase={phase} />)}
        {topLevel.length > 3 && (
          <button onClick={openProgressDetail} className="text-[11px] text-[#4F6EF7] font-medium py-0.5">
            查看全部 {topLevel.length} 个步骤
          </button>
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="msg-animate px-4">
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
        <span className="typing-dot text-slate-400" /><span className="typing-dot text-slate-400" /><span className="typing-dot text-slate-400" />
      </div>
    </div>
  )
}

/* ── Progress Card ── */
function useTaskProgress(phases: TaskPhase[]) {
  return useMemo(() => {
    const topLevel = phases.filter((p) => !p.authType)
    const allItems: TaskPhase[] = []
    topLevel.forEach((p) => { allItems.push(p); if (p.children) allItems.push(...p.children) })
    const doneCount = allItems.filter((p) => p.status === "done").length
    const total = allItems.length
    return { topLevel, doneCount, total, percent: total > 0 ? Math.round((doneCount / total) * 100) : 0 }
  }, [phases])
}

function PhaseItem({ phase, depth = 0 }: { phase: TaskPhase; depth?: number }) {
  const [open, setOpen] = useState(false)
  const hasKids = phase.children && phase.children.length > 0

  const icon = phase.status === "done" ? <CheckCircle2 className="size-3.5 text-green-500" />
    : phase.status === "running" ? <Loader2 className="size-3.5 text-blue-500 animate-spin" />
    : phase.status === "error" ? <AlertCircle className="size-3.5 text-red-400" />
    : phase.status === "paused" ? <Pause className="size-3.5 text-amber-500" />
    : <Circle className="size-3.5 text-slate-400" />

  return (
    <div className={cn(depth > 0 && "ml-4 border-l-2 border-slate-100 pl-3")}>
      <button onClick={() => hasKids && setOpen(!open)} className="flex w-full items-center gap-2 py-1 text-[13px]">
        {hasKids ? (open ? <ChevronDown className="size-3 text-slate-400" /> : <ChevronRight className="size-3 text-slate-400" />) : <div className="w-3" />}
        {icon}
        <span className={cn("flex-1 text-left", phase.status === "done" ? "text-slate-400" : phase.status === "running" ? "text-blue-600 font-medium" : "text-slate-600")}>{phase.title}</span>
      </button>
      {open && hasKids && phase.children!.map((c) => <PhaseItem key={c.id} phase={c} depth={depth + 1} />)}
    </div>
  )
}

/* ── Result Detail Page (push from right) ── */
function ResultDetailPage() {
  const activeResult = useChatStore((s) => s.activeResult)
  const goBack = useChatStore((s) => s.goBack)

  if (!activeResult) return null

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-40 flex flex-col bg-white">
      <div className="shrink-0 flex items-center px-3 py-2.5 bg-white border-b border-slate-100 safe-top">
        <button onClick={goBack} className="shrink-0 text-slate-500 mr-2"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800 flex-1">报告详情</span>
        <div className="w-6" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="size-6 text-green-500 shrink-0" />
            <h1 className="text-[18px] font-bold text-slate-800">{activeResult.title}</h1>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-4">{activeResult.summary}</p>
          <div className="h-px bg-slate-100 mb-4" />
          <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">
            <RichText text={activeResult.detail} />
          </div>
        </div>
        {activeResult.link && (
          <div className="px-5 pb-6 pt-2">
            <a href={activeResult.link.url} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-[#4F6EF7] text-white text-[15px] font-medium active:bg-[#3D5CE5] transition-colors">
              <ExternalLink className="size-4" /> {activeResult.link.label}
            </a>
          </div>
        )}
        <div className="h-8 safe-bottom" />
      </div>
    </motion.div>
  )
}

/* ── Agent Plan Detail Page (full-screen bottom sheet) ── */
function AgentDocSection({ title, level = 1, action, children }: { title: string; level?: 1 | 2; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        {level === 1 ? (
          <h2 className="text-[16px] font-bold text-slate-800">{title}</h2>
        ) : (
          <h3 className="text-[14px] font-semibold text-slate-700">{title}</h3>
        )}
        {action}
      </div>
      {children}
      <div className="h-px bg-slate-100 mt-5" />
    </div>
  )
}

function ExpandableText({ text, maxLines }: { text: string; maxLines: number }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split("\n").filter(Boolean)
  const needsExpand = lines.length > maxLines

  return (
    <div>
      <div className="relative">
        <p className={cn("text-[14px] text-slate-700 leading-[1.75] whitespace-pre-line", !expanded && needsExpand && `line-clamp-${maxLines}`)}>
          <RichText text={expanded ? text : lines.slice(0, maxLines).join("\n")} />
        </p>
        {needsExpand && !expanded && (
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>
      {needsExpand && (
        <button onClick={() => setExpanded(!expanded)} className="text-[12px] text-slate-500 font-medium mt-2 active:opacity-70 transition-opacity">
          {expanded ? "收起" : "展开全文"}
        </button>
      )}
    </div>
  )
}

function ScheduleReminder() {
  const [showPicker, setShowPicker] = useState(false)
  const [scheduled, setScheduled] = useState<Date | null>(null)
  const [pickerDate, setPickerDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return d
  })
  const [pickerMonth, setPickerMonth] = useState(() => new Date())

  const formatSchedule = (d: Date) => {
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    const days = Math.floor(diff / 86400_000)
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    if (days === 0) return `今天 ${h}:${m}`
    if (days === 1) return `明天 ${h}:${m}`
    return `${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m}`
  }

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handleConfirm = () => {
    setScheduled(pickerDate)
    setShowPicker(false)
  }

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const calendarDays = useMemo(() => {
    const y = pickerMonth.getFullYear()
    const mo = pickerMonth.getMonth()
    const total = daysInMonth(y, mo)
    const offset = firstDayOfMonth(y, mo)
    const days: (number | null)[] = Array.from({ length: offset }, () => null)
    for (let d = 1; d <= total; d++) days.push(d)
    return days
  }, [pickerMonth])

  return (
    <>
      <button onClick={() => setShowPicker(true)} className="flex items-center gap-1.5 mb-4 active:opacity-70 transition-opacity">
        <span className="text-[14px] text-blue-500 font-medium">
          @{scheduled ? formatSchedule(scheduled) : "设置定时执行"}
        </span>
        <svg className="size-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full bg-white rounded-t-2xl px-5 pt-4 pb-6 safe-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[16px] font-bold text-slate-800">设置定时任务</span>
                <button onClick={() => setShowPicker(false)} className="text-slate-400"><X className="size-5" /></button>
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))} className="text-slate-400 active:text-slate-600"><ChevronLeft className="size-5" /></button>
                <span className="text-[15px] font-semibold text-slate-700">{pickerMonth.getFullYear()}年{pickerMonth.getMonth() + 1}月</span>
                <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))} className="text-slate-400 active:text-slate-600"><ChevronRight className="size-5" /></button>
              </div>

              {/* Week header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                  <span key={d} className="text-center text-[12px] text-slate-400 py-1">{d}</span>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={idx} />
                  const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day)
                  const isSelected = isSameDay(date, pickerDate)
                  const isToday = isSameDay(date, new Date())
                  return (
                    <button
                      key={idx}
                      onClick={() => setPickerDate(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day, pickerDate.getHours(), pickerDate.getMinutes()))}
                      className={cn(
                        "flex items-center justify-center h-9 rounded-lg text-[14px] transition-colors",
                        isSelected ? "bg-blue-500 text-white" : isToday ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-700 active:bg-slate-100",
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* Time selector */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[14px] text-slate-600">时间</span>
                <input
                  type="time"
                  value={`${String(pickerDate.getHours()).padStart(2, "0")}:${String(pickerDate.getMinutes()).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number)
                    setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth(), pickerDate.getDate(), h, m))
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[14px] text-slate-700 focus:outline-none focus:border-blue-400"
                />
              </div>

              <button onClick={handleConfirm} className="w-full py-3 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:bg-slate-800 transition-colors">
                确认
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function CollapsibleDocSection({ title, level = 2, badge, children, defaultOpen = false }: { title: string; level?: 1 | 2; badge?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-5">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-2.5 active:opacity-70 transition-opacity">
        <div className="flex items-center gap-2">
          {level === 1 ? (
            <h2 className="text-[16px] font-bold text-slate-800">{title}</h2>
          ) : (
            <h3 className="text-[14px] font-semibold text-slate-700">{title}</h3>
          )}
          {badge && <span className="text-[11px] text-slate-400">{badge}</span>}
        </div>
        <ChevronDown className={cn("size-4 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-px bg-slate-100 mt-5" />
    </div>
  )
}

function AgentChecklist({ steps, agentChecklist }: { steps: string[]; agentChecklist?: { label: string; done: boolean }[] }) {
  const items = agentChecklist && agentChecklist.length > 0
    ? agentChecklist
    : steps.map((s) => ({ label: s, done: false }))

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 py-1">
          <div className={cn(
            "flex size-[18px] shrink-0 items-center justify-center rounded border-[1.5px] mt-0.5",
            item.done ? "bg-[#4F6EF7] border-[#4F6EF7]" : "border-slate-300",
          )}>
            {item.done && <Check className="size-3 text-white" strokeWidth={3} />}
          </div>
          <span className={cn("text-[14px] leading-relaxed", item.done ? "text-slate-400 line-through" : "text-slate-700")}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function AgentPlanDetailPage() {
  const activeAgentPlan = useChatStore((s) => s.activeAgentPlan)
  const goBack = useChatStore((s) => s.goBack)
  const agents = useChatStore((s) => s.agents)
  const taskState = useChatStore((s) => s.taskState)
  const [editingPlan, setEditingPlan] = useState(false)
  const [planText, setPlanText] = useState("")

  const agent = agents.find((a) => a.id === "agent-research")
  const isRunning = taskState === "executing"

  useEffect(() => {
    if (activeAgentPlan) setPlanText(activeAgentPlan.prompt)
  }, [activeAgentPlan])

  if (!activeAgentPlan) return null

  const currentTask = agent?.runLogs[0]
  const historyTasks = agent?.runLogs.slice(1) ?? []

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-40 flex flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 flex items-center px-3 py-2.5 bg-white border-b border-slate-100 safe-top">
        <button onClick={goBack} className="shrink-0 text-slate-500 mr-2"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800 flex-1 truncate">{activeAgentPlan.name}</span>
        <button className="flex items-center gap-1 text-slate-400 active:text-slate-600 transition-colors">
          <Play className="size-4" />
        </button>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="px-5 pt-4 pb-6">

          {/* Schedule reminder */}
          <ScheduleReminder />

          {/* Current task card */}
          {currentTask && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden mb-6">
              <div className="flex items-center gap-3 px-4 py-3">
                {isRunning ? (
                  <Loader2 className="size-5 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 truncate">{currentTask.title}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">{currentTask.result}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">{isRunning ? "正在执行…" : formatRelDate(currentTask.timestamp)}</span>
                <span className="text-[11px] text-slate-400">{currentTask.tokenUsage} tokens</span>
              </div>
            </div>
          )}

          {/* H1: Plan */}
          <AgentDocSection
            title="Plan"
            level={1}
            action={<button onClick={() => setEditingPlan(!editingPlan)} className="text-[12px] text-slate-500 font-medium active:opacity-70 transition-opacity">{editingPlan ? "完成" : "编辑"}</button>}
          >
            {editingPlan ? (
              <textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[14px] text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-[#4F6EF7] transition-colors"
                rows={10}
              />
            ) : (
              <ExpandableText text={planText} maxLines={5} />
            )}
          </AgentDocSection>

          {/* H2: Checklist (collapsible) */}
          <CollapsibleDocSection title="检查清单" level={2} badge={`${(agent?.checklist ?? activeAgentPlan.steps).length}`}>
            <AgentChecklist steps={activeAgentPlan.steps} agentChecklist={agent?.checklist} />
          </CollapsibleDocSection>

          {/* H2: Tools (collapsible) */}
          {activeAgentPlan.tools.length > 0 && (
            <CollapsibleDocSection title="工具" level={2} badge={`${activeAgentPlan.tools.length}`}>
              <div className="flex flex-wrap gap-2">
                {activeAgentPlan.tools.map((tool) => (
                  <span key={tool} className="text-[13px] text-slate-600 bg-slate-50 rounded-md px-2.5 py-1">{tool}</span>
                ))}
              </div>
            </CollapsibleDocSection>
          )}

          {/* H2: History (collapsible) */}
          {historyTasks.length > 0 && (
            <CollapsibleDocSection title="历史" level={2} badge={`${historyTasks.length}`}>
              {historyTasks.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1.5">
                  <CheckCircle2 className="size-3.5 text-green-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 leading-snug">{log.title}</p>
                    <span className="text-[11px] text-slate-400">{formatRelDate(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </CollapsibleDocSection>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Progress Detail Page (bottom sheet modal) ── */
function ProgressDetailPage() {
  const goBack = useChatStore((s) => s.goBack)
  const taskState = useChatStore((s) => s.taskState)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const stopTask = useChatStore((s) => s.stopTask)
  const resumeTask = useChatStore((s) => s.resumeTask)
  const { topLevel, percent, doneCount, total } = useTaskProgress(taskPhases)

  const canToggle = taskState === "executing" || taskState === "paused"

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-40 flex flex-col bg-white">
      <div className="shrink-0 flex items-center px-3 py-2.5 bg-white border-b border-slate-100 safe-top">
        <button onClick={goBack} className="shrink-0 text-slate-500 mr-2"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800 flex-1">执行详情</span>
        <div className="w-6" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {taskState === "executing" && <Loader2 className="size-5 text-blue-500 animate-spin" />}
                {taskState === "completed" && <CheckCircle2 className="size-5 text-green-500" />}
                {taskState === "paused" && <Pause className="size-5 text-amber-500" />}
                <span className="text-[18px] font-bold text-slate-800">
                  {taskState === "completed" ? "任务完成" : taskState === "paused" ? "已暂停" : "执行中"}
                </span>
              </div>
              <p className="text-[13px] text-slate-400 mt-1">{doneCount} / {total} 步骤完成</p>
            </div>
            <div className="text-right">
              <span className="text-[24px] font-bold text-slate-800">{percent}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-6">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <div className="space-y-2">
            {topLevel.map((phase) => <PhaseItem key={phase.id} phase={phase} />)}
          </div>
        </div>
      </div>
      {canToggle && (
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100 safe-bottom">
          <button
            onClick={taskState === "executing" ? stopTask : resumeTask}
            className={`w-full py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${taskState === "executing" ? "bg-amber-50 text-amber-600 active:bg-amber-100" : "bg-blue-50 text-[#4F6EF7] active:bg-blue-100"}`}
          >
            {taskState === "executing" ? "暂停执行" : "恢复执行"}
          </button>
        </div>
      )}
    </motion.div>
  )
}

/* ── Bottom Area: Option cards replace input bar when active ── */
function BottomArea() {
  const taskState = useChatStore((s) => s.taskState)
  const messages = useChatStore((s) => s.messages)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const lastClarify = useMemo(() => {
    const m = [...messages].reverse().find((m) => m.clarifyCard)
    return m?.clarifyCard ?? null
  }, [messages])

  const pendingAuthCards = useMemo(() => taskPhases.filter((p) => p.authType && p.status !== "done" && p.status !== "error"), [taskPhases])

  const lastNextActions = useMemo(() => {
    const m = [...messages].reverse().find((m) => m.nextActions)
    return m?.nextActions ?? null
  }, [messages])

  const showClarify = taskState === "clarifying" && lastClarify
  const showConfirm = taskState === "confirming"
  const showAuth = taskState === "authorizing" && pendingAuthCards.length > 0
  const showNextActions = (taskState === "completed" || taskState === "paused") && lastNextActions

  if (showClarify) return <ClarifyBottomCard card={lastClarify} />
  if (showConfirm) return <ConfirmBottomCard />
  if (showAuth) return <AuthBottomCard cards={pendingAuthCards} />
  if (showNextActions) return <NextActionBottomCard actions={lastNextActions} />

  const isExecuting = taskState === "executing"
  const isEmpty = messages.length === 0 && taskState === "idle"
  return (
    <>
      {isExecuting && <ExecutingBottomCard />}
      {isEmpty && <QuickActionChips />}
      <TextInputBar />
    </>
  )
}

function ClarifyBottomCard({ card }: { card: ClarifyCard }) {
  const selectOption = useChatStore((s) => s.selectClarifyOption)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const setKbOpen = useChatStore((s) => s.setKeyboardOpen)
  const [customVal, setCustomVal] = useState("")
  const [recording, setRecordingLocal] = useState(false)
  const [kbVisible, setKbVisible] = useState(false)
  const cancelled = useRef(false)

  const setRecording = (v: boolean) => { setRecordingLocal(v); setKbOpen(v) }
  const openKb = () => { setKbVisible(true); setKbOpen(true) }
  const closeKb = () => { setKbVisible(false); setKbOpen(false) }

  const handleCustomSubmit = () => {
    const v = customVal.trim()
    if (!v) return
    sendMessage(v)
    setCustomVal("")
    closeKb()
  }

  const handleKbKey = (k: string) => {
    if (k === "BACKSPACE") setCustomVal((v) => v.slice(0, -1))
    else setCustomVal((v) => v + k)
  }

  return (
    <>
      <div className="shrink-0 px-4 pb-2 pt-1">
        <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-center px-4 py-3">
            <svg className="size-5 text-black shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span className="text-[15px] text-black font-medium ml-2 flex-1">{card.question.length > 6 ? card.question.slice(0, 6) : "选择回答"}</span>
            <button onClick={() => sendMessage("跳过这一步")} className="flex size-6 items-center justify-center rounded-full bg-slate-100">
              <X className="size-3.5 text-slate-400" />
            </button>
          </div>

          <div className="max-h-[180px] overflow-y-auto scrollbar-none">
            {card.options.map((opt, i) => (
              <button key={opt.id} onClick={() => selectOption(opt.label)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors",
                  i < card.options.length - 1 && "border-b border-slate-50"
                )}>
                <p className="text-[15px] text-black min-w-0 flex-1 pr-3 truncate">{opt.label}</p>
                <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 flex items-center px-4 py-3 gap-3">
            <input value={customVal} onChange={(e) => setCustomVal(e.target.value)} placeholder="输入你想问的问题"
              className="flex-1 text-[14px] text-black placeholder:text-[#999] bg-transparent focus:outline-none"
              onFocus={openKb}
              onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit() }} />
            {customVal.trim() ? (
              <button onClick={handleCustomSubmit} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-black text-white active:bg-slate-800 active:scale-90 transition-all">
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onMouseDown={() => setRecording(true)}
                onMouseUp={() => { setRecording(false); if (!cancelled.current) sendMessage("【语音消息】") }}
                onMouseLeave={() => { setRecording(false); cancelled.current = false }}
                onTouchStart={() => setRecording(true)}
                onTouchEnd={(e) => { e.preventDefault(); setRecording(false); if (!cancelled.current) sendMessage("【语音消息】") }}
                className="shrink-0 text-black active:scale-90 transition-transform"
              >
                <Mic className="size-[20px]" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {recording && <VoiceRecordingOverlay onCancel={() => { cancelled.current = true; setRecording(false) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {kbVisible && !recording && <MockKeyboard onKey={handleKbKey} onDismiss={closeKb} />}
      </AnimatePresence>
    </>
  )
}

function ConfirmBottomCard() {
  const confirmBuild = useChatStore((s) => s.confirmBuild)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [feedback, setFeedback] = useState("")

  const options = [
    { label: "开始执行", action: () => confirmBuild() },
    { label: "取消执行", action: () => sendMessage("取消执行") },
  ]

  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center px-4 py-3">
          <svg className="size-5 text-black shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span className="text-[15px] text-black font-medium ml-2 flex-1">确认执行</span>
          <button onClick={() => sendMessage("取消执行")} className="flex size-6 items-center justify-center rounded-full bg-slate-100">
            <X className="size-3.5 text-slate-400" />
          </button>
        </div>
        <div>
          {options.map((opt, i) => (
            <button key={opt.label} onClick={opt.action}
              className={cn("flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors", i < options.length - 1 && "border-b border-slate-50")}>
              <p className="text-[15px] text-black min-w-0 flex-1 pr-3">{opt.label}</p>
              <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 flex items-center px-4 py-3 gap-3">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="输入你的想法"
            className="flex-1 text-[14px] text-black placeholder:text-[#999] bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && feedback.trim()) { sendMessage(feedback.trim()); setFeedback("") } }} />
          {feedback.trim() ? (
            <button onClick={() => { sendMessage(feedback.trim()); setFeedback("") }} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-black text-white active:bg-slate-800 active:scale-90 transition-all">
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button className="shrink-0 text-black"><Mic className="size-[20px]" strokeWidth={1.8} /></button>
          )}
        </div>
      </div>
    </div>
  )
}

function AuthBottomCard({ cards }: { cards: TaskPhase[] }) {
  const authorizeService = useChatStore((s) => s.authorizeService)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const [feedback, setFeedback] = useState("")

  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center px-4 py-3">
          <Shield className="size-5 text-black shrink-0" strokeWidth={1.8} />
          <span className="text-[15px] text-black font-medium ml-2 flex-1">需要授权</span>
          <button onClick={() => sendMessage("全部跳过")} className="flex size-6 items-center justify-center rounded-full bg-slate-100">
            <X className="size-3.5 text-slate-400" />
          </button>
        </div>
        <div>
          {cards.map((card, i) => {
            const phase = taskPhases.find((p) => p.id === card.id)
            const isRunning = phase?.status === "running"
            return (
              <button key={card.id} onClick={() => !isRunning && authorizeService(card.id)}
                className={cn("flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors", i < cards.length - 1 && "border-b border-slate-50")}>
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[15px] text-black truncate">{card.serviceName ?? card.title}</p>
                  {card.authLabel && <p className="text-[12px] text-[#999] mt-0.5">{card.authLabel}</p>}
                </div>
                {isRunning ? (
                  <Loader2 className="size-4 text-slate-400 animate-spin shrink-0" />
                ) : (
                  <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="border-t border-slate-100 flex items-center px-4 py-3 gap-3">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="输入你的想法"
            className="flex-1 text-[14px] text-black placeholder:text-[#999] bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && feedback.trim()) { sendMessage(feedback.trim()); setFeedback("") } }} />
          {feedback.trim() ? (
            <button onClick={() => { sendMessage(feedback.trim()); setFeedback("") }} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-black text-white active:bg-slate-800 active:scale-90 transition-all">
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button className="shrink-0 text-black"><Mic className="size-[20px]" strokeWidth={1.8} /></button>
          )}
        </div>
      </div>
    </div>
  )
}

function NextActionBottomCard({ actions }: { actions: NextAction[] }) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [customVal, setCustomVal] = useState("")

  const handleCustomSubmit = () => {
    const v = customVal.trim()
    if (!v) return
    sendMessage(v)
    setCustomVal("")
  }

  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center px-4 py-3">
          <Compass className="size-5 text-black shrink-0" strokeWidth={1.8} />
          <span className="text-[15px] text-black font-medium ml-2 flex-1">接下来</span>
          <button onClick={() => sendMessage("跳过")} className="flex size-6 items-center justify-center rounded-full bg-slate-100">
            <X className="size-3.5 text-slate-400" />
          </button>
        </div>
        <div className="max-h-[180px] overflow-y-auto scrollbar-none">
          {actions.map((a, i) => (
            <button key={a.label} onClick={() => sendMessage(a.action)}
              className={cn("flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors", i < actions.length - 1 && "border-b border-slate-50")}>
              <p className="text-[15px] text-black min-w-0 flex-1 pr-3 truncate">{a.label}</p>
              <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 flex items-center px-4 py-3 gap-3">
          <input value={customVal} onChange={(e) => setCustomVal(e.target.value)} placeholder="输入你的想法"
            className="flex-1 text-[14px] text-black placeholder:text-[#999] bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit() }} />
          {customVal.trim() ? (
            <button onClick={handleCustomSubmit} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-black text-white active:bg-slate-800 active:scale-90 transition-all">
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button className="shrink-0 text-black"><Mic className="size-[20px]" strokeWidth={1.8} /></button>
          )}
        </div>
      </div>
    </div>
  )
}

function ExecutingBottomCard() {
  const newChat = useChatStore((s) => s.newChat)
  const goBack = useChatStore((s) => s.goBack)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const actions = [
    { label: "新建一个任务", action: () => newChat() },
    { label: "返回首页等待通知", action: () => goBack() },
  ]

  return (
    <div className="shrink-0 px-4 pb-2 pt-1">
      <div className="bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center px-4 py-3">
          <Loader2 className="size-5 text-[#4F6EF7] animate-spin shrink-0" />
          <span className="text-[15px] text-black font-medium ml-2 flex-1">任务执行中</span>
          <button onClick={() => setDismissed(true)} className="flex size-6 items-center justify-center rounded-full bg-slate-100">
            <X className="size-3.5 text-slate-400" />
          </button>
        </div>
        <div className="px-4 pb-2">
          <p className="text-[13px] text-[#999] leading-relaxed">任务在后台运行，完成后会通知你。你可以：</p>
        </div>
        {actions.map((a, i) => (
          <button key={a.label} onClick={a.action}
            className={cn("flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors", i < actions.length - 1 && "border-b border-slate-50")}>
            <p className="text-[15px] text-black min-w-0 flex-1 pr-3">{a.label}</p>
            <span className="text-[15px] text-slate-300 shrink-0">&gt;</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  { label: "深度研究", icon: <Search className="size-3.5" /> },
  { label: "写报告", icon: <Pencil className="size-3.5" /> },
  { label: "数据分析", icon: <Compass className="size-3.5" /> },
  { label: "翻译", icon: <Globe className="size-3.5" /> },
]

function QuickActionChips() {
  const sendMessage = useChatStore((s) => s.sendMessage)

  return (
    <div className="shrink-0 flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => sendMessage(`帮我${a.label}`)}
          className="flex items-center gap-1.5 shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-600 active:bg-slate-50 active:scale-[0.97] transition-all"
        >
          <span className="text-slate-400">{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  )
}

function MockKeyboard({ onKey, onDismiss }: { onKey: (k: string) => void; onDismiss: () => void }) {
  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["⇧","Z","X","C","V","B","N","M","⌫"],
  ]

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="shrink-0 bg-[#D1D3D9] pt-1.5 pb-1 px-1"
    >
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[5px] mb-[5px]">
          {row.map((k) => {
            const isSpecial = k === "⇧" || k === "⌫"
            return (
              <button
                key={k}
                onClick={() => {
                  if (k === "⌫") onKey("BACKSPACE")
                  else if (k === "⇧") {}
                  else onKey(k.toLowerCase())
                }}
                className={cn(
                  "flex items-center justify-center rounded-[5px] text-[16px] font-normal shadow-[0_1px_0_rgba(0,0,0,0.25)] active:bg-slate-300 transition-colors",
                  isSpecial ? "bg-[#ADB3BC] text-black w-[42px] h-[42px] text-[14px]" : "bg-white text-black min-w-[32px] h-[42px]"
                )}
                style={{ flex: isSpecial ? "0 0 42px" : "1 1 0" }}
              >
                {k}
              </button>
            )
          })}
        </div>
      ))}
      <div className="flex gap-[5px] mb-[3px]">
        <button className="flex-[1.2] h-[42px] rounded-[5px] bg-[#ADB3BC] text-[14px] text-black flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0.25)]">123</button>
        <button className="flex-[1] h-[42px] rounded-[5px] bg-[#ADB3BC] text-[14px] text-black flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0.25)]">🌐</button>
        <button
          onClick={() => onKey(" ")}
          className="flex-[4] h-[42px] rounded-[5px] bg-white text-[14px] text-black flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0.25)]"
        >space</button>
        <button
          onClick={onDismiss}
          className="flex-[1.8] h-[42px] rounded-[5px] bg-[#4F6EF7] text-[13px] text-white font-medium flex items-center justify-center shadow-[0_1px_0_rgba(0,0,0,0.25)]"
        >完成</button>
      </div>
    </motion.div>
  )
}

function VoiceRecordingOverlay({ onCancel }: { onCancel: () => void }) {
  const dots = Array.from({ length: 40 }, (_, i) => i)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 80)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.15 }}
      className="shrink-0 flex flex-col items-center py-6 px-4"
      style={{ background: "linear-gradient(to top, #0099FF 0%, #4DB8FF 40%, #99D6FF 70%, rgba(255,255,255,0) 100%)" }}
      onMouseUp={onCancel}
      onTouchEnd={onCancel}
    >
      <p className="text-[15px] text-white font-medium mb-5">松手发送，上移取消</p>
      <div className="flex items-center gap-[3px] w-[80%] justify-center">
        {dots.map((i) => {
          const wave = Math.sin((tick + i) * 0.4) * 0.3 + 0.7
          return (
            <div
              key={i}
              className="rounded-full bg-white"
              style={{ width: 4, height: 4, opacity: wave, transform: `scaleY(${0.5 + wave * 0.5})` }}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

/* ── Mock photo gallery data ── */
const MOCK_PHOTO_COLORS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff9a76 100%)",
  "linear-gradient(135deg, #667eea 0%, #00c6fb 100%)",
  "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)",
  "linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
]

const MOCK_PHOTOS: ImageAttachment[] = MOCK_PHOTO_COLORS.map((bg, i) => ({
  id: `photo-${i}`,
  src: bg,
  width: 200 + (i % 3) * 50,
  height: 200 + ((i + 1) % 4) * 40,
}))

const TOOL_PANEL_ITEMS = [
  { id: "camera", label: "相机", icon: Camera },
  { id: "album", label: "相册", icon: ImageIcon },
  { id: "file", label: "文件", icon: Paperclip },
  { id: "phone", label: "打电话", icon: Phone },
]

function FullScreenGallery({ selected, onToggleSelect, onClose }: {
  selected: Set<string>; onToggleSelect: (id: string) => void; onClose: () => void
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="absolute inset-0 z-[70] flex flex-col bg-white"
    >
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100 safe-top">
        <button onClick={onClose} className="text-slate-600 active:scale-90 transition-transform">
          <ChevronLeft className="size-6" />
        </button>
        <span className="text-[16px] font-semibold text-slate-800">相册</span>
        <button onClick={onClose} className="text-[14px] text-[#4F6EF7] font-medium active:opacity-60 transition-opacity">
          完成{selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none p-1">
        <div className="grid grid-cols-4 gap-1">
          {MOCK_PHOTOS.map((photo) => {
            const isSelected = selected.has(photo.id)
            const selIndex = isSelected ? [...selected].indexOf(photo.id) + 1 : 0
            return (
              <button
                key={photo.id}
                onClick={() => onToggleSelect(photo.id)}
                className="relative aspect-square overflow-hidden active:scale-[0.97] transition-transform"
              >
                <div className="absolute inset-0" style={{ background: photo.src }} />
                <div className={cn(
                  "absolute top-1.5 right-1.5 flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-all",
                  isSelected ? "bg-[#4F6EF7] border-[#4F6EF7]" : "bg-black/20 border-white/70",
                )}>
                  {isSelected && <span className="text-[11px] text-white font-bold">{selIndex}</span>}
                </div>
                {isSelected && <div className="absolute inset-0 border-[3px] border-[#4F6EF7]" />}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function SelectedImagesBar({ selected, photos, onRemove, onOpenGallery }: {
  selected: Set<string>; photos: ImageAttachment[]; onRemove: (id: string) => void; onOpenGallery: () => void
}) {
  const [showAddPopup, setShowAddPopup] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const requestPermission = useChatStore((s) => s.requestPermission)
  const cameraPermission = useChatStore((s) => s.permissions.camera)

  const selectedPhotos = photos.filter((p) => selected.has(p.id))
  if (selectedPhotos.length === 0) return null

  const getPopupStyle = (): React.CSSProperties => {
    if (!addBtnRef.current || !barRef.current) return { left: 16 }
    const btnRect = addBtnRef.current.getBoundingClientRect()
    const barRect = barRef.current.getBoundingClientRect()
    let left = btnRect.left - barRect.left
    const popupWidth = 150
    if (left + popupWidth > barRect.width - 8) left = barRect.width - popupWidth - 8
    if (left < 8) left = 8
    return { left }
  }

  return (
    <div ref={barRef} className="shrink-0 bg-white border-t border-slate-100 px-3 py-2 relative z-[55]">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {selectedPhotos.map((photo) => (
          <div key={photo.id} className="relative shrink-0 size-[56px] rounded-lg overflow-hidden">
            <div className="w-full h-full" style={{ background: photo.src }} />
            <button onClick={() => onRemove(photo.id)} className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-black/60 text-white z-10">
              <X className="size-2.5" strokeWidth={3} />
            </button>
          </div>
        ))}
        <div className="shrink-0">
          <button ref={addBtnRef} onClick={() => setShowAddPopup((v) => !v)}
            className="flex size-[56px] items-center justify-center rounded-lg border-[1.5px] border-dashed border-slate-300 text-slate-400 active:bg-slate-50 active:scale-95 transition-all">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddPopup && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setShowAddPopup(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-[calc(100%-4px)] z-[61] bg-white rounded-xl shadow-xl shadow-black/15 border border-slate-100 overflow-hidden min-w-[150px]"
              style={getPopupStyle()}
            >
              <button onClick={() => { if (cameraPermission === "not-requested") requestPermission("camera"); setShowAddPopup(false) }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left active:bg-slate-50 transition-colors border-b border-slate-50">
                <Camera className="size-[18px] text-black" strokeWidth={1.8} />
                <span className="text-[14px] text-slate-700">拍照</span>
              </button>
              <button onClick={() => { setShowAddPopup(false); onOpenGallery() }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left active:bg-slate-50 transition-colors">
                <ImageIcon className="size-[18px] text-black" strokeWidth={1.8} />
                <span className="text-[14px] text-slate-700">从相册选择</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToolPanel({ selected, onToggleSelect }: {
  selected: Set<string>; onToggleSelect: (id: string) => void
}) {
  const requestPermission = useChatStore((s) => s.requestPermission)
  const cameraPermission = useChatStore((s) => s.permissions.camera)
  const photosPermission = useChatStore((s) => s.permissions.photos)

  const handleToolTap = (id: string) => {
    if (id === "camera") {
      if (cameraPermission === "not-requested") requestPermission("camera")
    } else if (id === "album") {
      if (photosPermission === "not-requested") requestPermission("photos")
    }
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="shrink-0 bg-[#F7F8FA] overflow-hidden border-t border-slate-100"
    >
      <div className="h-[280px] flex flex-col">
        {/* Tool icons row */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="grid grid-cols-4 gap-2.5">
            {TOOL_PANEL_ITEMS.map((tool) => (
              <button key={tool.id} onClick={() => handleToolTap(tool.id)} className="flex flex-col items-center gap-1.5 active:scale-[0.92] transition-transform">
                <div className="w-full aspect-[1.15] rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F8F8F8" }}>
                  <tool.icon className="size-[22px] text-black" strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-normal" style={{ color: "#666666" }}>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-200/60 mx-4" />

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-2 pt-2 pb-2">
          <div className="grid grid-cols-4 gap-1">
            {MOCK_PHOTOS.map((photo) => {
              const isSelected = selected.has(photo.id)
              const selIndex = isSelected ? [...selected].indexOf(photo.id) + 1 : 0
              return (
                <button
                  key={photo.id}
                  onClick={() => onToggleSelect(photo.id)}
                  className="relative aspect-square rounded-lg overflow-hidden active:scale-95 transition-transform"
                >
                  <div className="absolute inset-0" style={{ background: photo.src }} />
                  <div className={cn(
                    "absolute top-1 right-1 flex size-5 items-center justify-center rounded-full border-[1.5px] transition-all",
                    isSelected ? "bg-[#4F6EF7] border-[#4F6EF7]" : "bg-black/20 border-white/70",
                  )}>
                    {isSelected && <span className="text-[10px] text-white font-bold">{selIndex}</span>}
                  </div>
                  {isSelected && <div className="absolute inset-0 border-2 border-[#4F6EF7] rounded-lg" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TextInputBar() {
  const inputValue = useChatStore((s) => s.inputValue)
  const setInputValue = useChatStore((s) => s.setInputValue)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const sendImages = useChatStore((s) => s.sendImages)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [voiceMode, setVoiceMode] = useState(true)
  const [voiceRecording, setVoiceRecordingLocal] = useState(false)
  const setVoiceRecording = (v: boolean) => { setVoiceRecordingLocal(v) }
  const voiceCancelled = useRef(false)
  const kbOpen = useChatStore((s) => s.keyboardOpen)
  const setKbOpen = useChatStore((s) => s.setKeyboardOpen)
  const cameraPermission = useChatStore((s) => s.permissions.camera)
  const micPermission = useChatStore((s) => s.permissions.microphone)
  const requestPermission = useChatStore((s) => s.requestPermission)
  const [toolPanelOpen, setToolPanelOpen] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [galleryOpen, setGalleryOpen] = useState(false)

  const send = () => {
    const t = inputValue.trim()
    if (!t) return
    sendMessage(t)
    if (ref.current) ref.current.style.height = "auto"
    setKbOpen(false)
    setToolPanelOpen(false)
    setVoiceMode(true)
  }
  const has = inputValue.trim().length > 0

  const openKeyboard = () => { setVoiceMode(false); setKbOpen(true); setToolPanelOpen(false) }
  const dismissKeyboard = () => { setKbOpen(false) }

  const toggleToolPanel = () => {
    if (toolPanelOpen) {
      setToolPanelOpen(false)
    } else {
      setKbOpen(false)
      setToolPanelOpen(true)
    }
  }

  const togglePhotoSelect = (id: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size > 0 && prev.size === 0) setToolPanelOpen(false)
      return next
    })
  }

  const removePhoto = (id: string) => {
    setSelectedPhotos((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  const handleSendImages = () => {
    if (selectedPhotos.size === 0) return
    const imgs = MOCK_PHOTOS.filter((p) => selectedPhotos.has(p.id))
    sendImages(imgs)
    setSelectedPhotos(new Set())
    setToolPanelOpen(false)
  }

  const handleKey = (k: string) => {
    if (k === "BACKSPACE") {
      setInputValue(inputValue.slice(0, -1))
    } else {
      setInputValue(inputValue + k)
    }
    if (ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + "px"
    }
  }

  const isTextMode = !voiceMode || has
  const maxH = kbOpen ? "120px" : "24px"

  return (
    <>
      <SelectedImagesBar
        selected={selectedPhotos} photos={MOCK_PHOTOS}
        onRemove={removePhoto}
        onOpenGallery={() => setGalleryOpen(true)}
      />
      <div className="shrink-0 px-4 pb-2 pt-1.5 bg-white">
        <div className="flex items-center bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-4 gap-4 min-h-[52px]">
          <button onClick={() => {
            if (cameraPermission === "not-requested") requestPermission("camera")
          }} className="shrink-0 text-black active:scale-90 transition-transform">
            <Camera className="size-[22px]" strokeWidth={1.8} />
          </button>

          {isTextMode ? (
            <textarea ref={ref} value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, kbOpen ? 120 : 24) + "px" }}
              onFocus={() => { setKbOpen(true); setToolPanelOpen(false) }}
              rows={1} placeholder="输入消息…"
              className="flex-1 resize-none bg-transparent text-[15px] text-black placeholder:text-slate-400 focus:outline-none leading-relaxed h-[24px] py-3.5 scrollbar-none overflow-y-auto transition-[height] duration-150 ease-out" style={{ maxHeight: maxH }} />
          ) : (
          <button
            onMouseDown={() => {
              if (micPermission === "not-requested") { requestPermission("microphone"); return }
              setVoiceRecording(true)
            }}
            onMouseUp={() => { setVoiceRecording(false); if (!voiceCancelled.current) sendMessage("【语音消息】") }}
            onMouseLeave={() => { setVoiceRecording(false); voiceCancelled.current = false }}
            onTouchStart={() => {
              if (micPermission === "not-requested") { requestPermission("microphone"); return }
              setVoiceRecording(true)
            }}
            onTouchEnd={(e) => { e.preventDefault(); setVoiceRecording(false); if (!voiceCancelled.current) sendMessage("【语音消息】") }}
            className="flex-1 h-full flex items-center justify-center py-3 active:opacity-60 transition-opacity"
          >
            <span className="text-[16px] text-black font-medium">按住说话</span>
          </button>
          )}

          {has ? (
            <button onClick={send} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-black text-white active:bg-slate-800 active:scale-90 transition-all">
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <>
              <button onClick={() => {
                if (voiceMode) {
                  openKeyboard()
                } else {
                  if (micPermission === "not-requested") requestPermission("microphone")
                  setVoiceMode(true)
                  dismissKeyboard()
                }
              }} className="shrink-0 text-black active:scale-90 transition-transform">
                {voiceMode ? (
                  <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="4" />
                    <circle cx="6" cy="9" r="1" fill="currentColor" stroke="none" />
                    <circle cx="10" cy="9" r="1" fill="currentColor" stroke="none" />
                    <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
                    <circle cx="18" cy="9" r="1" fill="currentColor" stroke="none" />
                    <circle cx="6" cy="13" r="1" fill="currentColor" stroke="none" />
                    <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
                    <line x1="14" y1="13" x2="18" y2="13" />
                  </svg>
                ) : (
                  <Mic className="size-[22px]" strokeWidth={1.8} />
                )}
              </button>
              {selectedPhotos.size > 0 ? (
                <button onClick={handleSendImages} className="shrink-0 flex size-7 items-center justify-center rounded-full bg-[#4F6EF7] text-white active:bg-[#3D5CE5] active:scale-90 transition-all">
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button onClick={toggleToolPanel} className={cn("shrink-0 active:scale-90 transition-all", toolPanelOpen ? "text-[#4F6EF7]" : "text-black")}>
                  <svg className="size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <AnimatePresence>
        {kbOpen && <MockKeyboard onKey={handleKey} onDismiss={dismissKeyboard} />}
      </AnimatePresence>
      <AnimatePresence>
        {toolPanelOpen && !kbOpen && <ToolPanel selected={selectedPhotos} onToggleSelect={togglePhotoSelect} />}
      </AnimatePresence>
      <AnimatePresence>
        {voiceRecording && <VoiceRecordingOverlay onCancel={() => { voiceCancelled.current = true; setVoiceRecording(false) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {galleryOpen && <FullScreenGallery selected={selectedPhotos} onToggleSelect={togglePhotoSelect} onClose={() => setGalleryOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

/* ── iOS System Permission Dialog ── */
const PERMISSION_CONFIG: Record<PermissionType, {
  title: string
  description: string
  icon: React.ReactNode
  options: { label: string; status: PermissionStatus; bold?: boolean }[]
}> = {
  network: {
    title: "\"ViceMe\" 想要查找并连接到本地网络上的设备",
    description: "ViceMe 需要访问本地网络以实现数据同步和内容分享等核心功能。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
        <Globe className="size-8 text-white" />
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "好", status: "granted", bold: true },
    ],
  },
  tracking: {
    title: "允许\"ViceMe\"跟踪你在其他公司的 App 和网站上的活动？",
    description: "这将允许 ViceMe 为你提供个性化的 AI 推荐和更精准的内容。你的数据不会被出售给第三方。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
        <Shield className="size-8 text-white" />
      </div>
    ),
    options: [
      { label: "要求 App 不跟踪", status: "denied" },
      { label: "允许", status: "granted", bold: true },
    ],
  },
  notifications: {
    title: "\"ViceMe\" 想给你发送通知",
    description: "通知可能包括提醒、声音和图标标记。你可以在「设置」中进行配置。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-red-400 to-red-600 flex items-center justify-center shadow-md">
        <Bell className="size-8 text-white" />
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "允许", status: "granted", bold: true },
    ],
  },
  camera: {
    title: "\"ViceMe\" 想访问你的相机",
    description: "ViceMe 需要使用相机来拍摄照片或扫描文档，以便进行 AI 识别和分析。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-gray-600 to-gray-800 flex items-center justify-center shadow-md">
        <Camera className="size-8 text-white" />
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "好", status: "granted", bold: true },
    ],
  },
  microphone: {
    title: "\"ViceMe\" 想访问你的麦克风",
    description: "ViceMe 需要使用麦克风来进行语音输入、语音对话等功能。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-orange-400 to-red-500 flex items-center justify-center shadow-md">
        <Mic className="size-8 text-white" />
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "好", status: "granted", bold: true },
    ],
  },
  location: {
    title: "允许\"ViceMe\"使用你的位置？",
    description: "ViceMe 会使用你的位置信息来提供基于位置的智能推荐和本地化服务。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-blue-400 to-indigo-600 flex items-center justify-center shadow-md">
        <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
          <circle cx="12" cy="9" r="2.5" fill="white" stroke="none" />
        </svg>
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "使用 App 时允许", status: "granted", bold: true },
      { label: "始终允许", status: "granted", bold: false },
    ],
  },
  photos: {
    title: "\"ViceMe\" 想访问你的照片",
    description: "允许 ViceMe 访问你的照片以便进行图片分析、发送图片等功能。",
    icon: (
      <div className="size-[60px] rounded-[14px] bg-gradient-to-b from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center shadow-md">
        <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    ),
    options: [
      { label: "不允许", status: "denied" },
      { label: "选择照片…", status: "limited", bold: false },
      { label: "允许完全访问", status: "granted", bold: true },
    ],
  },
}

function SystemPermissionDialog() {
  const activePermission = useChatStore((s) => s.activePermission)
  const respondPermission = useChatStore((s) => s.respondPermission)

  if (!activePermission) return null

  const config = PERMISSION_CONFIG[activePermission]
  const isMultiOption = config.options.length > 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 px-10"
    >
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="w-full max-w-[270px] bg-[#F2F2F7]/[0.97] backdrop-blur-2xl rounded-[14px] overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col items-center px-4 pt-5 pb-4">
          {config.icon}
          <p className="text-[13px] font-bold text-black text-center mt-3 leading-snug">
            {config.title}
          </p>
          <p className="text-[13px] text-black/60 text-center mt-1.5 leading-snug">
            {config.description}
          </p>
        </div>

        <div className={cn("border-t border-black/15", isMultiOption ? "flex flex-col" : "flex")}>
          {config.options.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => respondPermission(opt.status)}
              className={cn(
                "flex-1 py-[11px] text-center text-[17px] active:bg-black/5 transition-colors",
                opt.bold ? "text-[#007AFF] font-semibold" : "text-[#007AFF]",
                !isMultiOption && i === 0 && "border-r border-black/15",
                isMultiOption && i > 0 && "border-t border-black/15",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Agreement Dialog (floating card) ── */
function AgreementPage() {
  const setShowAgreement = useChatStore((s) => s.setShowAgreement)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[70] flex items-center justify-center bg-black/50 px-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="px-5 pt-5 pb-4">
          <p className="text-[16px] font-bold text-slate-800 text-center mb-3">隐私保护提示</p>
          <div className="text-[13px] text-slate-500 leading-relaxed space-y-2">
            <p>
              我们依据
              <span className="text-[#4F6EF7]">《用户协议》</span>及
              <span className="text-[#4F6EF7]">《隐私政策》</span>
              收集和处理你的个人信息：
            </p>
            <p>1. 我们可能会获取你的设备信息，以保障功能正常运行。</p>
            <p>2. 在你使用搜索、AI 创作、语音等服务时，将处理必要的个人信息。</p>
          </div>
        </div>
        <div className="flex border-t border-slate-100">
          <button onClick={() => setShowAgreement(false)} className="flex-1 py-3.5 text-center text-[15px] text-slate-400 border-r border-slate-100 active:bg-slate-50 transition-colors">
            不同意
          </button>
          <button onClick={() => setShowAgreement(false)} className="flex-1 py-3.5 text-center text-[15px] text-[#4F6EF7] font-semibold active:bg-blue-50 transition-colors">
            同意
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Phone login sub-flow (3 pages) ── */
type PhoneLoginView = "quick" | "input" | "code"

function usePhoneLoginFlow(onSuccess: () => void) {
  const setShowAgreement = useChatStore((s) => s.setShowAgreement)
  const showAgreement = useChatStore((s) => s.showAgreement)
  const loginWithPhone = useChatStore((s) => s.loginWithPhone)
  const [view, setView] = useState<PhoneLoginView>("quick")
  const [phone, setPhone] = useState("15900005714")
  const [inputPhone, setInputPhone] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pendingAction, setPendingAction] = useState<"quick" | "input-next" | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  useEffect(() => {
    if (pendingAction && !showAgreement) {
      setAgreed(true)
      if (pendingAction === "quick") {
        goToCode(phone)
      } else if (pendingAction === "input-next") {
        goToCode(inputPhone || phone)
      }
      setPendingAction(null)
    }
  }, [showAgreement])

  const goToCode = (p: string) => {
    setPhone(p)
    setView("code")
    setCode("")
    setCodeError(false)
    setCountdown(60)
    setTimeout(() => codeInputRef.current?.focus(), 300)
  }

  const handleQuickLogin = () => {
    if (!agreed) { setShowAgreement(true); setPendingAction("quick"); return }
    goToCode(phone)
  }

  const handleInputNext = () => {
    const p = inputPhone || phone
    if (!/^1\d{10}$/.test(p)) return
    if (!agreed) { setShowAgreement(true); setPendingAction("input-next"); return }
    goToCode(p)
  }

  const handleVerify = () => {
    if (code === "123456") { loginWithPhone(phone); onSuccess() }
    else setCodeError(true)
  }

  const maskedPhone = phone.slice(0, 3) + "****" + phone.slice(7)

  return { view, setView, phone, maskedPhone, inputPhone, setInputPhone, agreed, setAgreed, code, setCode, codeError, setCodeError, countdown, setCountdown, codeInputRef, handleQuickLogin, handleInputNext, handleVerify }
}

/* ── 图1: 本机号一键登录页 ── */
function QuickPhoneLoginPage({ flow, onBack }: { flow: ReturnType<typeof usePhoneLoginFlow>; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={onBack} className="text-slate-800"><ChevronLeft className="size-6" /></button>
        <div className="flex-1" />
        <span className="text-[14px] text-slate-800">反馈</span>
      </div>
      <div className="flex-1 flex flex-col items-center px-6 pt-10">
        <p className="text-[22px] font-bold text-slate-800">本机号登录</p>
        <p className="text-[24px] font-bold text-slate-800 mt-4 tracking-wider">{flow.maskedPhone}</p>
        <p className="text-[12px] text-slate-400 mt-2">认证服务由中国移动提供</p>

        <div className="w-full mt-10 space-y-3">
          <button onClick={flow.handleQuickLogin}
            className="w-full py-3.5 rounded-full bg-slate-900 text-white text-[16px] font-semibold active:bg-slate-800 transition-colors">
            一键登录
          </button>
          <button onClick={() => flow.setView("input")}
            className="w-full py-3 rounded-full border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            其他手机号登录
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 safe-bottom">
        <div className="flex items-start gap-2 justify-center">
          <button onClick={() => flow.setAgreed(!flow.agreed)} className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${flow.agreed ? "bg-slate-900 border-slate-900" : "border-slate-300"}`}>
            {flow.agreed && <Check className="size-2.5 text-white" />}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            已阅读并同意 <span className="text-[#4F6EF7]">服务协议</span>、<span className="text-[#4F6EF7]">隐私政策</span> 和 ViceMe 账号服务须知 以及 <span className="text-[#4F6EF7]">中国移动认证服务条款</span>
          </p>
        </div>
      </div>
    </>
  )
}

/* ── 图2: 手机号输入登录页 ── */
function PhoneInputPage({ flow }: { flow: ReturnType<typeof usePhoneLoginFlow> }) {
  const inputValid = /^1\d{10}$/.test(flow.inputPhone)

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => flow.setView("quick")} className="text-slate-800"><ChevronLeft className="size-6" /></button>
        <div className="flex-1" />
        <span className="text-[14px] text-slate-800">反馈</span>
      </div>
      <div className="flex-1 flex flex-col px-6 pt-8">
        <p className="text-[22px] font-bold text-slate-800 mb-6">手机号登录</p>

        <div className="flex items-center bg-slate-50 rounded-full px-4 py-3.5">
          <span className="text-[15px] text-slate-800 font-medium shrink-0">+86</span>
          <ChevronDown className="size-3.5 text-slate-400 ml-1 shrink-0" />
          <div className="w-px h-5 bg-slate-200 mx-3" />
          <input type="tel" maxLength={11} value={flow.inputPhone}
            onChange={(e) => flow.setInputPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="请输入手机号"
            className="flex-1 text-[15px] text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
            autoFocus />
        </div>

        <div className="flex items-start gap-2 mt-4">
          <button onClick={() => flow.setAgreed(!flow.agreed)} className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${flow.agreed ? "bg-slate-900 border-slate-900" : "border-slate-300"}`}>
            {flow.agreed && <Check className="size-2.5 text-white" />}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            已阅读并同意 <span className="text-[#4F6EF7]">服务协议</span>、<span className="text-[#4F6EF7]">隐私政策</span>、ViceMe 账号服务须知
          </p>
        </div>

        <button onClick={flow.handleInputNext} disabled={!inputValid}
          className={cn("w-full mt-6 py-3.5 rounded-full text-[16px] font-semibold transition-all",
            inputValid ? "bg-slate-900 text-white active:bg-slate-800" : "bg-slate-100 text-slate-300 cursor-not-allowed")}>
          下一步
        </button>
      </div>
    </>
  )
}

/* ── 图3: 验证码输入页 ── */
function CodeVerifyPage({ flow }: { flow: ReturnType<typeof usePhoneLoginFlow> }) {
  const fullPhone = `+86 ${flow.phone.slice(0, 3)} ${flow.phone.slice(3, 7)} ${flow.phone.slice(7)}`
  const [shaking, setShaking] = useState(false)

  const loginWithPhone = useChatStore((s) => s.loginWithPhone)
  const handleCodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "")
    flow.setCode(cleaned)
    flow.setCodeError(false)
    if (cleaned.length === 6) {
      if (cleaned === "123456") {
        loginWithPhone(flow.phone)
      } else {
        flow.setCodeError(true)
        setShaking(true)
        setTimeout(() => { setShaking(false); flow.setCode("") }, 600)
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => flow.setView("quick")} className="text-slate-800"><ChevronLeft className="size-6" /></button>
        <div className="flex-1" />
        <span className="text-[14px] text-slate-800">反馈</span>
      </div>
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        <p className="text-[14px] text-slate-500">验证码已发送至</p>
        <p className="text-[22px] font-bold text-slate-800 mt-1 tracking-wider">{fullPhone}</p>

        <motion.div
          className="flex gap-3 justify-center mt-8 mb-2"
          onClick={() => flow.codeInputRef.current?.focus()}
          animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(
              "w-11 h-13 flex items-center justify-center rounded-xl border-2 text-[22px] font-bold transition-colors",
              flow.codeError ? "border-red-400" : flow.code.length === i ? "border-[#4F6EF7]" : "border-slate-200",
              flow.codeError ? "text-red-500" : "text-slate-800"
            )}>
              {flow.code[i] ?? ""}
            </div>
          ))}
        </motion.div>
        <input ref={flow.codeInputRef} type="tel" maxLength={6} value={flow.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="opacity-0 absolute -z-10" autoFocus />

        <div className="mt-6">
          {flow.countdown > 0 ? (
            <span className="text-[14px] text-slate-400">重新发送 {flow.countdown}s</span>
          ) : (
            <button onClick={() => { flow.setCountdown(60); flow.setCode(""); flow.setCodeError(false) }} className="text-[14px] text-[#4F6EF7] font-medium">重新发送验证码</button>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Full-screen Login Page (first launch only) ── */
function LoginFullPage() {
  const dismissLogin = useChatStore((s) => s.dismissLogin)
  const loginWithPhone = useChatStore((s) => s.loginWithPhone)
  const setShowAgreement = useChatStore((s) => s.setShowAgreement)
  const showAgreement = useChatStore((s) => s.showAgreement)
  const [agreed, setAgreed] = useState(false)
  const [subView, setSubView] = useState<"main" | "phone-flow">("main")
  const [pendingLogin, setPendingLogin] = useState(false)
  const phoneFlow = usePhoneLoginFlow(() => dismissLogin())

  useEffect(() => {
    if (pendingLogin && !showAgreement) {
      setAgreed(true)
      loginWithPhone("13900008702")
      dismissLogin()
      setPendingLogin(false)
    }
  }, [showAgreement])

  const handleOtherLogin = () => {
    if (!agreed) { setShowAgreement(true); setPendingLogin(true); return }
    loginWithPhone("13900008702")
    dismissLogin()
  }

  if (subView === "phone-flow") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-[60] flex flex-col bg-white">
        <div className="safe-top" />
        {phoneFlow.view === "quick" && <QuickPhoneLoginPage flow={phoneFlow} onBack={() => setSubView("main")} />}
        {phoneFlow.view === "input" && <PhoneInputPage flow={phoneFlow} />}
        {phoneFlow.view === "code" && <CodeVerifyPage flow={phoneFlow} />}
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-[60] flex flex-col bg-white">
      <div className="safe-top" />
      <div className="flex items-center justify-between px-4 py-2">
        <div className="w-6" />
        <span className="text-[15px] font-semibold text-slate-800">登录以解锁更多功能</span>
        <button onClick={dismissLogin} className="text-slate-400 active:scale-90 transition-transform"><X className="size-5" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-10 px-6">
        <SkillHashGlyph seedText="viceme-ai" size={88} />
        <p className="text-[22px] font-bold text-slate-800 mt-4">你好，我是 ViceMe</p>

        <div className="w-full mt-10 space-y-3">
          <button onClick={() => setSubView("phone-flow")} className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:bg-slate-800 transition-colors">
            <Globe className="size-5" />
            <span className="flex-1 text-center">手机号一键登录</span>
          </button>

          <button onClick={handleOtherLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <Globe className="size-5 text-green-500" />
            <span className="flex-1 text-center">微信一键登录</span>
          </button>

          <button onClick={handleOtherLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <span className="text-[18px]"></span>
            <span className="flex-1 text-center">通过 Apple 登录</span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 safe-bottom">
        <div className="flex items-start gap-2">
          <button onClick={() => setAgreed(!agreed)} className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${agreed ? "bg-[#4F6EF7] border-[#4F6EF7]" : "border-slate-300"}`}>
            {agreed && <Check className="size-2.5 text-white" />}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            已阅读并同意 <span className="text-[#4F6EF7]">服务协议</span>、<span className="text-[#4F6EF7]">隐私政策</span>、ViceMe 账号服务须知
          </p>
        </div>
        <button onClick={dismissLogin} className="w-full mt-4 text-center text-[13px] text-slate-400">
          不登录直接使用
        </button>
      </div>
    </motion.div>
  )
}

/* ── Login Bottom Sheet (subsequent login prompts) ── */
function LoginSheet() {
  const setShowLogin = useChatStore((s) => s.setShowLogin)
  const loginWithPhone = useChatStore((s) => s.loginWithPhone)
  const setShowAgreement = useChatStore((s) => s.setShowAgreement)
  const showAgreement = useChatStore((s) => s.showAgreement)
  const dismiss = () => setShowLogin(false)
  const [agreed, setAgreed] = useState(false)
  const [subView, setSubView] = useState<"main" | "phone-flow">("main")
  const [pendingLogin, setPendingLogin] = useState(false)
  const phoneFlow = usePhoneLoginFlow(dismiss)

  useEffect(() => {
    if (pendingLogin && !showAgreement) {
      setAgreed(true)
      loginWithPhone("13900008702")
      dismiss()
      setPendingLogin(false)
    }
  }, [showAgreement])

  const handleOtherLogin = () => {
    if (!agreed) { setShowAgreement(true); setPendingLogin(true); return }
    loginWithPhone("13900008702")
    dismiss()
  }

  if (subView === "phone-flow") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 z-50 flex flex-col bg-white">
        <div className="safe-top" />
        {phoneFlow.view === "quick" && <QuickPhoneLoginPage flow={phoneFlow} onBack={() => setSubView("main")} />}
        {phoneFlow.view === "input" && <PhoneInputPage flow={phoneFlow} />}
        {phoneFlow.view === "code" && <CodeVerifyPage flow={phoneFlow} />}
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end justify-center bg-black/40" onClick={dismiss}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full bg-white rounded-t-3xl px-6 pt-5 pb-6 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div />
          <button onClick={dismiss} className="text-slate-400"><X className="size-5" /></button>
        </div>
        <div className="flex flex-col items-center mb-5">
          <span className="text-[28px]">🎉</span>
          <p className="text-[17px] font-bold text-slate-800 mt-2">登录后解锁更多功能</p>
        </div>

        <div className="space-y-2.5">
          <button onClick={() => setSubView("phone-flow")} className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:bg-slate-800 transition-colors">
            <Globe className="size-5" />
            <span className="flex-1 text-center">手机号一键登录</span>
          </button>

          <button onClick={handleOtherLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <Globe className="size-5 text-green-500" />
            <span className="flex-1 text-center">微信一键登录</span>
          </button>

          <button onClick={handleOtherLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <span className="text-[18px]"></span>
            <span className="flex-1 text-center">通过 Apple 登录</span>
          </button>
        </div>

        <div className="flex items-start gap-2 mt-4">
          <button onClick={() => setAgreed(!agreed)} className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${agreed ? "bg-[#4F6EF7] border-[#4F6EF7]" : "border-slate-300"}`}>
            {agreed && <Check className="size-2.5 text-white" />}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            已阅读并同意 <span className="text-[#4F6EF7]">服务协议</span>、<span className="text-[#4F6EF7]">隐私政策</span>、ViceMe 账号服务须知
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Login Banner (top of conversation when not logged in) ── */
function LoginBanner() {
  const isLoggedIn = useChatStore((s) => s.isLoggedIn)
  const setShowLogin = useChatStore((s) => s.setShowLogin)

  if (isLoggedIn) return null

  return (
    <div onClick={() => setShowLogin(true)} className="shrink-0 flex items-center justify-center gap-1 bg-[#EEF1FE] px-4 py-2 cursor-pointer active:bg-[#E2E7FD] transition-colors">
      <span className="text-[13px] text-[#4F6EF7] font-medium">登录后解锁更多功能</span>
      <ChevronRight className="size-3.5 text-[#4F6EF7]/60" />
    </div>
  )
}

/* ── Toast Notification ── */
function ToastNotification() {
  const toast = useChatStore((s) => s.toastNotification)
  const dismissToast = useChatStore((s) => s.dismissToast)
  const openSession = useChatStore((s) => s.openSession)
  const markNotificationsRead = useChatStore((s) => s.markNotificationsRead)

  if (!toast) return null

  const handleTap = () => {
    if (toast.sessionId) openSession(toast.sessionId)
    markNotificationsRead()
    dismissToast()
  }

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute top-0 left-0 right-0 z-[60] px-4 pt-[var(--phone-safe-top,max(env(safe-area-inset-top),12px))] pointer-events-none"
    >
      <button
        onClick={handleTap}
        className="pointer-events-auto w-full flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-lg shadow-xl shadow-black/10 border border-slate-100 px-4 py-3 active:bg-slate-50 transition-colors"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <CheckCircle2 className="size-5 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[14px] font-semibold text-slate-800 truncate">{toast.title}</p>
          <p className="text-[12px] text-slate-400 truncate mt-0.5">{toast.desc}</p>
        </div>
        <X className="size-4 text-slate-400 shrink-0" />
      </button>
    </motion.div>
  )
}

/* ══════ Main Shell ══════ */
export function MobileApp() {
  const pageView = useChatStore((s) => s.pageView)
  const pageHistory = useChatStore((s) => s.pageHistory)
  const activeTab = useChatStore((s) => s.activeTab)
  const showLogin = useChatStore((s) => s.showLogin)
  const isLoggedIn = useChatStore((s) => s.isLoggedIn)
  const loginDismissed = useChatStore((s) => s.loginDismissed)
  const showAgreement = useChatStore((s) => s.showAgreement)
  const toast = useChatStore((s) => s.toastNotification)
  const keyboardOpen = useChatStore((s) => s.keyboardOpen)
  const activePermission = useChatStore((s) => s.activePermission)
  const initPermissions = useChatStore((s) => s.initPermissions)

  useEffect(() => {
    initPermissions()
  }, [])

  const showFirstLoginPage = !isLoggedIn && !loginDismissed

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "agents": return <AgentHistoryPage />
      case "create": return <ChatListPage />
      case "profile": return <ProfilePage />
      default: return <ChatListPage />
    }
  }, [activeTab])

  const visiblePages = new Set([pageView, ...pageHistory])
  const showConversation = visiblePages.has("conversation")
  const showAgentDetail = visiblePages.has("agent-detail")
  const showResultDetail = visiblePages.has("result-detail")
  const showProgressDetail = visiblePages.has("progress-detail")
  const showAgentPlanDetail = visiblePages.has("agent-plan-detail")

  return (
    <div className="relative flex h-full flex-col bg-[#F7F8FA] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {tabContent}
        <AnimatePresence>
          {showConversation && <ConversationPage key="conversation" />}
          {showAgentDetail && <AgentDetailPage key="agent-detail" />}
          {showResultDetail && <ResultDetailPage key="result-detail" />}
          {showProgressDetail && <ProgressDetailPage key="progress-detail" />}
          {showAgentPlanDetail && <AgentPlanDetailPage key="agent-plan-detail" />}
        </AnimatePresence>
      </div>
      {!keyboardOpen && <TabBar />}
      <AnimatePresence>{showFirstLoginPage && <LoginFullPage key="login-full" />}</AnimatePresence>
      <AnimatePresence>{showLogin && !showFirstLoginPage && <LoginSheet key="login-sheet" />}</AnimatePresence>
      <AnimatePresence>{toast && <ToastNotification />}</AnimatePresence>
      <AnimatePresence>{showAgreement && <AgreementPage />}</AnimatePresence>
      <AnimatePresence>{activePermission && <SystemPermissionDialog key="sys-perm" />}</AnimatePresence>
    </div>
  )
}
