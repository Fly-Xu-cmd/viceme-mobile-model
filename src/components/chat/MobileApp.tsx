import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  ArrowUp, Plus, Mic, MoreHorizontal, Trash2, Search, Pencil, ChevronLeft, ChevronRight, ChevronDown,
  Copy, Share2, RotateCcw, Check, CheckCheck, AlertCircle, Pin, PinOff,
  MessageSquare, Compass, Bell, User, Camera, Zap, X, MessageCircle,
  Settings, BookOpen, Type, PlayCircle, ShieldCheck, Volume2, Phone, Minus,
  Sparkles, ScanLine, Image, Globe, ExternalLink, Pause, Play,
  Loader2, CheckCircle2, Circle, Shield, Clock,
} from "lucide-react"
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/stores/chatStore"
import { SkillHashGlyph } from "@/components/common/SkillHashGlyph"
import type { ChatMessage, ChatSession, TaskPhase, TabId, ClarifyCard, BuildPlan, TaskResult, NextAction } from "@/types"

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
  const notifications = useChatStore((s) => s.notifications)
  const unread = notifications.filter((n) => !n.read).length

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "chat", label: "对话", icon: <MessageSquare className="size-5" /> },
    { id: "agents", label: "Agent", icon: <Compass className="size-5" /> },
    { id: "notifications", label: "通知", icon: <Bell className="size-5" />, badge: unread },
    { id: "profile", label: "我的", icon: <User className="size-5" /> },
  ]

  return (
    <div className="shrink-0 flex items-end justify-around bg-white/90 backdrop-blur-md border-t border-slate-100 px-2 pt-1.5 pb-1 safe-bottom">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={cn("flex flex-col items-center gap-0.5 min-w-[56px] py-1 relative", activeTab === tab.id ? "text-[#4F6EF7]" : "text-slate-400")}>
          <div className="relative">
            {tab.icon}
            {tab.badge != null && tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">{tab.badge}</span>
            )}
          </div>
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
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
          <span className="text-[17px] font-bold text-slate-800">对话</span>
          <div className="flex items-center gap-1">
            <button className="flex size-8 items-center justify-center rounded-full text-slate-500"><Search className="size-5" /></button>
            <button onClick={newChat} className="flex size-8 items-center justify-center rounded-full text-slate-500"><Pencil className="size-5" /></button>
          </div>
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
          <span className="text-[11px] text-slate-300 shrink-0 self-start mt-1.5">{formatRelDate(session.updatedAt)}</span>
        </button>
      </motion.div>
    </div>
  )
}

/* ══════ Agent History ══════ */
function AgentHistoryPage() {
  const agents = useChatStore((s) => s.agents)
  const openAgentDetail = useChatStore((s) => s.openAgentDetail)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2 bg-white safe-top">
        <h1 className="text-[20px] font-bold text-slate-800 text-center">Agent</h1>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-3 py-2">
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-50">
          {agents.map((agent) => (
            <button key={agent.id} onClick={() => openAgentDetail(agent.id)} className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors">
              <SkillHashGlyph seedText={agent.id} size={44} />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[15px] font-semibold text-slate-800">{agent.name}</p>
                <p className="text-[13px] text-slate-400 mt-0.5">{agent.description}</p>
                <p className="text-[11px] text-slate-300 mt-1">运行 {agent.runCount} 次 · 最近 {formatRelDate(agent.lastRunAt)}</p>
              </div>
              <ChevronRight className="size-4 text-slate-300 shrink-0" />
            </button>
          ))}
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
  const taskPhases = useChatStore((s) => s.taskPhases)
  const goBack = useChatStore((s) => s.goBack)
  const openSession = useChatStore((s) => s.openSession)

  const agent = agents.find((a) => a.id === detailAgentId)
  if (!agent) return null

  const relatedSessions = sessions.filter((s) => agent.sessions.includes(s.id))
  const isRunning = (taskState === "executing" || taskState === "paused" || taskState === "authorizing") && agent.id === "agent-research"

  const { topLevel, percent, doneCount, total } = (() => {
    if (!isRunning) return { topLevel: [] as import("@/types").TaskPhase[], percent: 0, doneCount: 0, total: 0 }
    const tl = taskPhases.filter((p) => !p.authType)
    const all: import("@/types").TaskPhase[] = []
    tl.forEach((p) => { all.push(p); if (p.children) all.push(...p.children) })
    const d = all.filter((p) => p.status === "done").length
    const t = all.length
    return { topLevel: tl, percent: t > 0 ? Math.round((d / t) * 100) : 0, doneCount: d, total: t }
  })()

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-30 flex flex-col bg-[#F7F8FA]">
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 bg-white safe-top">
        <button onClick={goBack} className="text-slate-500"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800">{agent.name}</span>
        <div className="w-6" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {/* Agent header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 bg-white">
          <SkillHashGlyph seedText={agent.id} size={56} />
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-slate-800">{agent.name}</p>
            <p className="text-[13px] text-slate-400 mt-0.5">{agent.description}</p>
            <p className="text-[11px] text-slate-300 mt-1">运行 {agent.runCount} 次</p>
          </div>
        </div>

        {/* Current run */}
        {isRunning && (
          <div className="mx-3 mt-3">
            <p className="text-[13px] font-medium text-slate-500 mb-2 px-1">当前运行</p>
            <div className="bg-white rounded-2xl px-4 py-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="size-4 text-blue-500 animate-spin" />
                <span className="text-[14px] font-semibold text-slate-700">{taskState === "paused" ? "已暂停" : "执行中"}</span>
                <span className="text-[12px] text-slate-400 ml-auto">{percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-[12px] text-slate-400">{doneCount} / {total} 步骤完成</p>
            </div>
          </div>
        )}

        {/* Purpose */}
        <div className="mx-3 mt-3">
          <p className="text-[13px] font-medium text-slate-500 mb-2 px-1">用途</p>
          <div className="bg-white rounded-2xl px-4 py-3">
            <p className="text-[13px] text-slate-600 leading-relaxed">{agent.purpose}</p>
          </div>
        </div>

        {/* Workflow */}
        {agent.workflow.length > 0 && (
          <div className="mx-3 mt-3">
            <p className="text-[13px] font-medium text-slate-500 mb-2 px-1">工作流</p>
            <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
              {agent.workflow.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500 text-[10px] font-bold mt-0.5">{i + 1}</span>
                  <span className="text-[13px] text-slate-600">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        {agent.checklist.length > 0 && (
          <div className="mx-3 mt-3">
            <p className="text-[13px] font-medium text-slate-500 mb-2 px-1">检查清单</p>
            <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
              {agent.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {item.done
                    ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    : <Circle className="size-4 text-slate-300 shrink-0" />}
                  <span className={`text-[13px] ${item.done ? "text-slate-400 line-through" : "text-slate-600"}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="mx-3 mt-3">
          <p className="text-[13px] font-medium text-slate-500 mb-2 px-1">活动记录</p>
          <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-50">
            {agent.runLogs.length === 0 && relatedSessions.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-slate-400">暂无运行记录</div>
            ) : (
              <>
                {agent.runLogs.map((log) => (
                  <button key={log.id} onClick={() => log.sessionId && openSession(log.sessionId)} className="flex w-full items-start gap-3 px-4 py-3 active:bg-slate-50 text-left">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-50 mt-0.5">
                      <CheckCircle2 className="size-3.5 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-slate-700 leading-relaxed">{log.title}</p>
                      <p className="text-[12px] text-slate-400 mt-1">{log.result}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-blue-500 bg-blue-50 rounded px-1.5 py-0.5">{log.taskCount}/{log.totalTasks} tasks</span>
                        <span className="text-[11px] text-slate-300">{formatRelDate(log.timestamp)}</span>
                        <span className="text-[11px] text-slate-300">▷ {log.tokenUsage} tokens</span>
                      </div>
                    </div>
                  </button>
                ))}
                {relatedSessions.map((s) => (
                  <button key={s.id} onClick={() => openSession(s.id)} className="flex w-full items-center gap-3 px-4 py-3 active:bg-slate-50">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <MessageCircle className="size-3.5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[13px] text-slate-700 truncate">{s.title}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{formatRelDate(s.updatedAt)}</p>
                    </div>
                    <ChevronRight className="size-4 text-slate-300" />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </motion.div>
  )
}

/* ══════ Notifications ══════ */
function NotificationsPage() {
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
              {n.sessionId && <ChevronRight className="size-4 text-slate-300 shrink-0" />}
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
                <ChevronRight className="size-4 text-slate-300 shrink-0" />
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
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-30 flex flex-col bg-[#F7F8FA]">
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 bg-white/80 backdrop-blur-md border-b border-slate-100 safe-top">
        <button onClick={goBack} className="flex items-center text-slate-500"><ChevronLeft className="size-6" /></button>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-slate-800">ViceMe</p>
          <p className="text-[11px] text-slate-400">内容由 AI 生成</p>
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto scrollbar-none">
      <div className="py-4 space-y-3">
        {messages.length === 0 && !isTyping && <WelcomeScreen />}
        {messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}
        {isTyping && !messages.some((m) => m.isStreaming) && <TypingDots />}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}

function WelcomeScreen() {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const suggestions = ["帮我调研 Ryan Kay 的公开信息和联系方式", "帮我写一份项目周报", "分析一下竞品的用户评价"]

  return (
    <div className="flex flex-col items-center pt-10 pb-4 px-5">
      <SkillHashGlyph seedText="viceme-ai" size={72} />
      <div className="mt-5 bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 w-full">
        <p className="text-[15px] text-slate-700 leading-relaxed">嗨，我是 ViceMe！说一句话就走开，等结果送到手里。<br /><br />你想让我帮你做什么？</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 w-full">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s)} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] text-slate-600 active:bg-slate-50 active:scale-[0.97] transition-all">{s}</button>
        ))}
      </div>
    </div>
  )
}

/* ── Message rendering ── */
function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "system") return <SystemMsg text={message.content} />
  if (message.clarifyCard) return <ClarifyCardUI card={message.clarifyCard} />
  if (message.buildPlan) return <BuildPlanCard plan={message.buildPlan} content={message.content} />
  if (message.authCards) return <AiBubble message={{ ...message, content: message.content }} />
  if (message.isProgressCard && message.progressPhases) return <ProgressCard phases={message.progressPhases} />
  if (message.isResultCard && message.resultCard) return <ResultCard result={message.resultCard} />
  if (message.nextActions) return <AiBubble message={message} />
  if (message.role === "user") return <UserBubble message={message} />
  return <AiBubble message={message} />
}

function SystemMsg({ text }: { text: string }) {
  return <div className="flex justify-center px-4"><span className="text-[12px] text-slate-400 bg-slate-100 rounded-full px-3 py-1">{text}</span></div>
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="msg-animate flex items-end justify-end gap-1.5 px-4">
      {message.status === "sending" && <span className="size-3 rounded-full border-2 border-slate-300 border-t-transparent animate-spin mb-1" />}
      {message.status === "sent" && <CheckCheck className="size-3 text-blue-400 mb-1" />}
      {message.status === "failed" && <AlertCircle className="size-3 text-red-400 mb-1" />}
      <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-[#4F6EF7] px-4 py-2.5 shadow-sm">
        <p className="text-[15px] leading-relaxed text-white whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  )
}

function AiBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="msg-animate px-4">
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
        <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-line">
          <RichText text={message.content} />
          {message.isStreaming && <span className="inline-block w-0.5 h-4 bg-[#4F6EF7] ml-0.5 align-middle animate-pulse" />}
        </p>
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

/* ── Clarify Card (inline in messages - simplified) ── */
function ClarifyCardUI({ card }: { card: ClarifyCard }) {
  return (
    <div className="msg-animate px-4">
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-100">
        <p className="text-[15px] leading-relaxed text-slate-700">{card.question}</p>
      </div>
    </div>
  )
}

/* ── Build Plan Card ── */
function BuildPlanCard({ plan, content }: { plan: BuildPlan; content: string }) {
  return (
    <div className="msg-animate px-4">
      <p className="text-[14px] text-slate-600 mb-2">{content}</p>
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <p className="text-[13px] text-slate-600 leading-relaxed">{plan.summary}</p>
        </div>
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {plan.services.map((s) => (
              <div key={s.name} className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
                <SkillHashGlyph seedText={s.icon} size={16} />
                <span className="text-[11px] text-slate-500">{s.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-400 mb-2">⏱ 预计 {plan.estimatedTime}</p>
          <div className="space-y-1">
            {plan.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500 text-[10px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-slate-600">{step}</span>
              </div>
            ))}
          </div>
        </div>
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

function ProgressCard({ phases }: { phases: TaskPhase[] }) {
  const taskState = useChatStore((s) => s.taskState)
  const stopTask = useChatStore((s) => s.stopTask)
  const resumeTask = useChatStore((s) => s.resumeTask)
  const openProgressDetail = useChatStore((s) => s.openProgressDetail)

  const { topLevel, percent } = useTaskProgress(phases)
  const canToggle = taskState === "executing" || taskState === "paused"

  return (
    <div className="msg-animate px-4">
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex w-full items-center justify-between px-4 pt-3 pb-2">
          <button onClick={openProgressDetail} className="flex items-center gap-2 flex-1 min-w-0">
            {taskState === "executing" && <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />}
            {taskState === "completed" && <CheckCircle2 className="size-4 text-green-500 shrink-0" />}
            {taskState === "paused" && <Pause className="size-4 text-amber-500 shrink-0" />}
            <span className="text-[14px] font-semibold text-slate-700">
              {taskState === "completed" ? "执行完成" : taskState === "paused" ? "已暂停" : "执行中…"}
            </span>
            <span className="text-[12px] text-slate-400 ml-auto mr-1">{percent}%</span>
            <ChevronRight className="size-4 text-slate-400 shrink-0" />
          </button>
          {canToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); taskState === "executing" ? stopTask() : resumeTask() }}
              className="flex size-7 items-center justify-center rounded-full ml-2 shrink-0 active:bg-slate-100 transition-colors border border-slate-200"
            >
              {taskState === "executing" ? <Pause className="size-3 text-slate-500" /> : <Play className="size-3 text-slate-500" />}
            </button>
          )}
        </div>
        <div className="mx-4 mb-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <div className="px-4 pb-3 space-y-1">
          {topLevel.slice(0, 3).map((phase) => <PhaseItem key={phase.id} phase={phase} />)}
          {topLevel.length > 3 && (
            <button onClick={openProgressDetail} className="text-[12px] text-[#4F6EF7] font-medium py-1">
              查看全部 {topLevel.length} 个步骤
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PhaseItem({ phase, depth = 0 }: { phase: TaskPhase; depth?: number }) {
  const [open, setOpen] = useState(false)
  const hasKids = phase.children && phase.children.length > 0

  const icon = phase.status === "done" ? <CheckCircle2 className="size-3.5 text-green-500" />
    : phase.status === "running" ? <Loader2 className="size-3.5 text-blue-500 animate-spin" />
    : phase.status === "error" ? <AlertCircle className="size-3.5 text-red-400" />
    : phase.status === "paused" ? <Pause className="size-3.5 text-amber-500" />
    : <Circle className="size-3.5 text-slate-300" />

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

/* ── Result Card (summary in chat, tap to open full page) ── */
function ResultCard({ result }: { result: TaskResult }) {
  const openResultDetail = useChatStore((s) => s.openResultDetail)

  return (
    <div className="msg-animate px-4">
      <div className="rounded-2xl bg-white shadow-sm border border-blue-100 overflow-hidden">
        <div className="px-4 pt-3 pb-2 bg-blue-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-500 shrink-0" />
            <p className="text-[15px] font-semibold text-slate-800">{result.title}</p>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-[13px] text-slate-600 leading-relaxed">{result.summary}</p>
        </div>
        <div className="flex items-center gap-2 px-4 pb-3">
          <button onClick={() => openResultDetail(result)} className="text-[13px] text-[#4F6EF7] font-medium">
            查看完整内容
          </button>
          {result.link && (
            <a href={result.link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-[#4F6EF7] font-medium ml-auto">
              <ExternalLink className="size-3.5" /> {result.link.label}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Result Detail Page (full screen) ── */
function ResultDetailPage() {
  const activeResult = useChatStore((s) => s.activeResult)
  const goBack = useChatStore((s) => s.goBack)

  if (!activeResult) return null

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="absolute inset-0 z-40 flex flex-col bg-white">
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100 safe-top">
        <button onClick={goBack} className="text-slate-500"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800">报告详情</span>
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
        <div className="h-8" />
      </div>
    </motion.div>
  )
}

/* ── Progress Detail Page ── */
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
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100 safe-top">
        <button onClick={goBack} className="text-slate-500"><ChevronLeft className="size-6" /></button>
        <span className="text-[16px] font-bold text-slate-800">执行详情</span>
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
            className={`w-full py-3 rounded-xl text-[15px] font-semibold transition-colors ${taskState === "executing" ? "bg-amber-50 text-amber-600 active:bg-amber-100" : "bg-blue-50 text-[#4F6EF7] active:bg-blue-100"}`}
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

  return <TextInputBar />
}

function ClarifyBottomCard({ card }: { card: ClarifyCard }) {
  const selectOption = useChatStore((s) => s.selectClarifyOption)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [customVal, setCustomVal] = useState("")

  const handleCustomSubmit = () => {
    const v = customVal.trim()
    if (!v) return
    sendMessage(v)
    setCustomVal("")
  }

  return (
    <div className="shrink-0 bg-white border-t border-slate-100 safe-bottom">
      <div className="px-3 pt-3 pb-2">
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-none">
          {card.options.map((opt) => (
            <button key={opt.id} onClick={() => selectOption(opt.label)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:bg-blue-50 transition-colors border border-slate-100 bg-slate-50/50">
              <div className="flex size-5 items-center justify-center rounded-full border-2 border-[#4F6EF7]/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-slate-700">{opt.label}</p>
                {opt.desc && <p className="text-[12px] text-slate-400 mt-0.5">{opt.desc}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input value={customVal} onChange={(e) => setCustomVal(e.target.value)} placeholder="或者输入你的想法…"
            className="flex-1 text-[13px] text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit() }} />
          {customVal.trim() ? (
            <button onClick={handleCustomSubmit} className="text-[#4F6EF7] text-[13px] font-medium">发送</button>
          ) : (
            <button onClick={() => sendMessage("跳过这一步")} className="text-slate-400 text-[12px]">跳过</button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmBottomCard() {
  const confirmBuild = useChatStore((s) => s.confirmBuild)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [feedback, setFeedback] = useState("")

  return (
    <div className="shrink-0 bg-white border-t border-slate-100 safe-bottom">
      <div className="px-4 py-3 space-y-2">
        <button onClick={confirmBuild} className="w-full py-3 rounded-xl bg-[#4F6EF7] text-white text-[15px] font-semibold active:bg-[#3D5CE5] transition-colors">
          开始执行
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="先调整一下…"
            className="flex-1 text-[13px] text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && feedback.trim()) { sendMessage(feedback.trim()); setFeedback("") } }} />
          {feedback.trim() ? (
            <button onClick={() => { sendMessage(feedback.trim()); setFeedback("") }} className="text-[#4F6EF7] text-[13px] font-medium">发送</button>
          ) : (
            <button onClick={() => sendMessage("取消执行")} className="text-slate-400 text-[12px]">取消</button>
          )}
        </div>
      </div>
    </div>
  )
}

function AuthBottomCard({ cards }: { cards: TaskPhase[] }) {
  const authorizeService = useChatStore((s) => s.authorizeService)
  const skipAuth = useChatStore((s) => s.skipAuth)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const [feedback, setFeedback] = useState("")

  return (
    <div className="shrink-0 bg-white border-t border-slate-100 safe-bottom">
      <div className="px-3 pt-3 pb-2">
        <p className="text-[13px] font-semibold text-slate-500 mb-2">需要授权</p>
        <div className="space-y-2">
          {cards.map((card) => {
            const phase = taskPhases.find((p) => p.id === card.id)
            const isRunning = phase?.status === "running"
            return (
              <div key={card.id} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <SkillHashGlyph seedText={card.serviceIcon ?? card.id} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-slate-700">{card.serviceName ?? card.title}</p>
                    <p className="text-[11px] text-slate-400">{card.authLabel}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => authorizeService(card.id)} disabled={isRunning}
                      className="px-3 py-1.5 rounded-lg bg-[#4F6EF7] text-white text-[12px] font-medium disabled:opacity-50 flex items-center gap-1">
                      {isRunning ? <Loader2 className="size-3 animate-spin" /> : <Shield className="size-3" />}
                      {isRunning ? "授权中" : "授权"}
                    </button>
                    <button onClick={() => skipAuth(card.id)} disabled={isRunning} className="px-2 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-400 disabled:opacity-50">跳过</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="输入意见…"
            className="flex-1 text-[13px] text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && feedback.trim()) { sendMessage(feedback.trim()); setFeedback("") } }} />
          {feedback.trim() ? (
            <button onClick={() => { sendMessage(feedback.trim()); setFeedback("") }} className="text-[#4F6EF7] text-[13px] font-medium">发送</button>
          ) : (
            <button onClick={() => sendMessage("全部跳过")} className="text-slate-400 text-[12px]">全部跳过</button>
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
    <div className="shrink-0 bg-white border-t border-slate-100 safe-bottom">
      <div className="px-3 pt-3 pb-2">
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-none">
          {actions.map((a) => (
            <button key={a.label} onClick={() => sendMessage(a.action)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left active:bg-blue-50 transition-colors border border-slate-100 bg-slate-50/50">
              <div className="flex size-5 items-center justify-center rounded-full border-2 border-[#4F6EF7]/40 shrink-0" />
              <p className="text-[14px] text-slate-700 flex-1 min-w-0">{a.label}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input value={customVal} onChange={(e) => setCustomVal(e.target.value)} placeholder="或者输入你的想法…"
            className="flex-1 text-[13px] text-slate-700 placeholder:text-slate-300 bg-transparent focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") handleCustomSubmit() }} />
          {customVal.trim() ? (
            <button onClick={handleCustomSubmit} className="text-[#4F6EF7] text-[13px] font-medium">发送</button>
          ) : (
            <button onClick={() => sendMessage("跳过")} className="text-slate-400 text-[12px]">跳过</button>
          )}
        </div>
      </div>
    </div>
  )
}

function TextInputBar() {
  const inputValue = useChatStore((s) => s.inputValue)
  const setInputValue = useChatStore((s) => s.setInputValue)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [voiceMode, setVoiceMode] = useState(false)

  const send = () => {
    const t = inputValue.trim()
    if (!t) return
    sendMessage(t)
    if (ref.current) ref.current.style.height = "auto"
  }
  const has = inputValue.trim().length > 0

  return (
    <div className="shrink-0 bg-white safe-bottom">
      <div className="flex items-center gap-4 px-5 py-2.5">
        <button className="shrink-0 text-slate-600"><Camera className="size-6" strokeWidth={1.5} /></button>

        <div className="flex-1 flex items-center h-[40px]">
          {voiceMode ? (
            <button className="flex-1 h-full flex items-center justify-center text-[16px] text-slate-600 font-medium active:bg-slate-50 transition-colors">
              按住说话
            </button>
          ) : (
            <>
              <textarea ref={ref} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px" }}
                rows={1} placeholder="说一句话，让 ViceMe 帮你搞定"
                className="flex-1 resize-none bg-transparent text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none leading-snug h-[24px] px-3 text-center placeholder:text-center" style={{ maxHeight: "100px" }} />
              {has && (
                <button onClick={send} className="shrink-0 ml-2 flex size-7 items-center justify-center rounded-full bg-[#4F6EF7] text-white active:bg-[#3D5CE5]">
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                </button>
              )}
            </>
          )}
        </div>

        <button onClick={() => setVoiceMode(!voiceMode)} className="shrink-0 text-slate-600">
          {voiceMode ? <Pencil className="size-6" strokeWidth={1.5} /> : <Mic className="size-6" strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}

/* ── Agreement Page (first launch) ── */
function AgreementPage() {
  const setShowAgreement = useChatStore((s) => s.setShowAgreement)

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="safe-top" />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-[120px] h-[120px] rounded-3xl overflow-hidden mb-8 shadow-lg">
          <SkillHashGlyph seedText="viceme-ai" size={120} />
        </div>
        <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100 w-full">
          <p className="text-[18px] font-bold text-slate-800 mb-3">欢迎使用 ViceMe</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            本个人信息保护指引依据
            <span className="text-[#4F6EF7]">《用户协议》</span>及
            <span className="text-[#4F6EF7]">《隐私政策》</span>
            帮助你了解我们对信息收集、处理个人信息的方式。
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed mt-2">
            1. 我们可能会申请系统设备和获取你的设备信息，以便你在使用过程中保持功能的正常运行。
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
            2. 在你使用搜索、AI 创作、语音等服务时，我们将处理必要的个人信息，以确保服务的安全及正常使用。
          </p>
        </div>
      </div>
      <div className="px-6 pb-6 safe-bottom">
        <button onClick={() => setShowAgreement(false)} className="w-full py-3.5 rounded-xl bg-[#4F6EF7] text-white text-[16px] font-semibold mb-3 active:bg-[#3D5CE5] transition-colors">
          同意
        </button>
        <button className="w-full py-2.5 text-center text-[14px] text-slate-400">
          不同意
        </button>
      </div>
    </div>
  )
}

/* ── Login Page (full screen) ── */
function LoginPage() {
  const setShowLogin = useChatStore((s) => s.setShowLogin)
  const setIsLoggedIn = useChatStore((s) => s.setIsLoggedIn)
  const [agreed, setAgreed] = useState(false)

  const handleLogin = () => {
    if (!agreed) return
    setIsLoggedIn(true)
    setShowLogin(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex flex-col bg-white">
      <div className="safe-top" />
      <div className="flex items-center justify-between px-4 py-2">
        <div className="w-6" />
        <span className="text-[15px] font-semibold text-slate-800">登录以解锁更多功能</span>
        <button onClick={() => setShowLogin(false)} className="text-slate-400"><X className="size-5" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8 px-6">
        <SkillHashGlyph seedText="viceme-ai" size={88} />
        <p className="text-[22px] font-bold text-slate-800 mt-4">你好，我是 ViceMe</p>

        <div className="w-full mt-8 space-y-3">
          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:bg-slate-800 transition-colors">
            <Phone className="size-5" />
            <span className="flex-1 text-center">手机号一键登录</span>
          </button>
          <p className="text-center text-[12px] text-slate-400">139****8702</p>

          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <Globe className="size-5 text-slate-500" />
            <span className="flex-1 text-center">微信一键登录</span>
          </button>

          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
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
        <button onClick={() => setShowLogin(false)} className="w-full mt-4 text-center text-[13px] text-slate-400">
          不登录直接使用
        </button>
      </div>
    </motion.div>
  )
}

/* ── Login Bottom Sheet (from chat) ── */
function LoginSheet() {
  const setShowLogin = useChatStore((s) => s.setShowLogin)
  const setIsLoggedIn = useChatStore((s) => s.setIsLoggedIn)
  const [agreed, setAgreed] = useState(false)

  const handleLogin = () => {
    if (!agreed) return
    setIsLoggedIn(true)
    setShowLogin(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowLogin(false)}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full bg-white rounded-t-3xl px-6 pt-5 pb-6 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div />
          <button onClick={() => setShowLogin(false)} className="text-slate-400"><X className="size-5" /></button>
        </div>
        <div className="flex flex-col items-center mb-5">
          <span className="text-[28px]">🎉</span>
          <p className="text-[17px] font-bold text-slate-800 mt-2">登录后解锁更多功能</p>
        </div>

        <div className="space-y-2.5">
          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[15px] font-semibold active:bg-slate-800 transition-colors">
            <Phone className="size-5" />
            <span className="flex-1 text-center">手机号一键登录</span>
          </button>
          <p className="text-center text-[12px] text-slate-400">139****8702</p>

          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
            <Globe className="size-5 text-slate-500" />
            <span className="flex-1 text-center">微信一键登录</span>
          </button>

          <button onClick={handleLogin} className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 text-[15px] text-slate-700 font-medium active:bg-slate-50 transition-colors">
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
    <button onClick={() => setShowLogin(true)} className="mx-4 mt-2 mb-1 flex items-center justify-center gap-1 rounded-xl bg-[#4F6EF7] px-4 py-2.5 active:bg-[#3D5CE5] transition-colors">
      <span className="text-[13px] text-white font-medium">立即登录，解锁更多功能</span>
      <ChevronRight className="size-4 text-white/80" />
    </button>
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
        <X className="size-4 text-slate-300 shrink-0" />
      </button>
    </motion.div>
  )
}

/* ══════ Main Shell ══════ */
export function MobileApp() {
  const pageView = useChatStore((s) => s.pageView)
  const activeTab = useChatStore((s) => s.activeTab)
  const showLogin = useChatStore((s) => s.showLogin)
  const showAgreement = useChatStore((s) => s.showAgreement)
  const toast = useChatStore((s) => s.toastNotification)

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "chat": return <ChatListPage />
      case "agents": return <AgentHistoryPage />
      case "notifications": return <NotificationsPage />
      case "profile": return <ProfilePage />
    }
  }, [activeTab])

  return (
    <div className="relative flex h-full flex-col bg-[#F7F8FA] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">{tabContent}</div>
      <TabBar />
      <AnimatePresence>
        {pageView === "conversation" && <ConversationPage />}
        {pageView === "agent-detail" && <AgentDetailPage />}
        {pageView === "result-detail" && <ResultDetailPage />}
        {pageView === "progress-detail" && <ProgressDetailPage />}
      </AnimatePresence>
      <AnimatePresence>{showLogin && <LoginSheet />}</AnimatePresence>
      <AnimatePresence>{toast && <ToastNotification />}</AnimatePresence>
      {showAgreement && <AgreementPage />}
    </div>
  )
}
