import { useState, useCallback, useRef, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MobileApp } from "@/components/chat/MobileApp"
import { SkillHashGlyph } from "@/components/common/SkillHashGlyph"
import { useChatStore } from "@/stores/chatStore"
import type { TaskPhase } from "@/types"
import {
  Compass, Settings, Camera, Image, Music, MapPin,
  Calendar, Clock, Calculator, Cloud, Mail, Phone,
  MessageSquare, Globe, BookOpen, Wallet, Loader2, CheckCircle2, X,
} from "lucide-react"

const PHONE_W = 393
const PHONE_H = 852
const BEZEL = 12
const CORNER_R = 54

function StatusBar({ dark }: { dark?: boolean }) {
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const fg = dark ? "text-white" : "text-black"

  return (
    <div className={`relative z-[101] flex items-center justify-between px-8 h-[59px] pt-[16px] ${fg}`}>
      <span className="text-[15px] font-semibold w-[72px]">{timeStr}</span>
      {/* gap for dynamic island */}
      <div className="flex-1" />
      <div className="flex items-center gap-[5px] w-[72px] justify-end">
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.3" />
          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" opacity="0.3" />
          <rect x="9" y="3" width="3" height="9" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 3.6C10 3.6 11.8 4.4 13.1 5.7L14.5 4.3C12.8 2.6 10.5 1.5 8 1.5C5.5 1.5 3.2 2.6 1.5 4.3L2.9 5.7C4.2 4.4 6 3.6 8 3.6Z" opacity="0.3" />
          <path d="M8 6.8C9.2 6.8 10.3 7.3 11.1 8.1L12.5 6.7C11.3 5.5 9.7 4.8 8 4.8C6.3 4.8 4.7 5.5 3.5 6.7L4.9 8.1C5.7 7.3 6.8 6.8 8 6.8Z" />
          <circle cx="8" cy="10.5" r="1.5" />
        </svg>
        {/* Battery */}
        <svg width="27" height="12" viewBox="0 0 27 12" fill="currentColor">
          <rect x="0" y="0.5" width="23" height="11" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
          <rect x="24" y="3.5" width="2.5" height="5" rx="1" opacity="0.35" />
          <rect x="2" y="2.5" width="19" height="7" rx="1.5" />
        </svg>
      </div>
    </div>
  )
}

function getTaskProgress(phases: TaskPhase[]): { done: number; total: number; percent: number; currentStep: string } {
  const all: TaskPhase[] = []
  phases.forEach((p) => { if (!p.authType) { all.push(p); if (p.children) all.push(...p.children) } })
  const done = all.filter((p) => p.status === "done").length
  const total = all.length
  const running = all.find((p) => p.status === "running")
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0, currentStep: running?.title ?? "" }
}

function DynamicIsland() {
  const taskState = useChatStore((s) => s.taskState)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const isActive = taskState === "executing" || taskState === "paused"

  const progress = useMemo(() => isActive ? getTaskProgress(taskPhases) : null, [isActive, taskPhases])

  return (
    <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-[100]">
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="live"
            initial={{ width: 126, height: 37 }}
            animate={{ width: 230, height: 44 }}
            exit={{ width: 126, height: 37 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-black rounded-full flex items-center px-2.5 gap-2 overflow-hidden"
          >
            <div className="shrink-0">
              <SkillHashGlyph seedText="viceme-ai" size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/70 truncate leading-tight">
                {progress?.currentStep || "执行中"}
              </p>
              <div className="mt-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-400"
                  animate={{ width: `${progress?.percent ?? 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <span className="text-[10px] text-white/50 font-medium shrink-0">{progress?.percent}%</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ width: 126, height: 37 }}
            animate={{ width: 126, height: 37 }}
            className="bg-black rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface AppIcon {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  isViceMe?: boolean
}

const HOME_APPS: AppIcon[] = [
  { id: "viceme", name: "ViceMe", icon: null, color: "", isViceMe: true },
  { id: "safari", name: "Safari", icon: <Globe className="size-7 text-white" />, color: "bg-gradient-to-b from-blue-400 to-blue-600" },
  { id: "mail", name: "邮件", icon: <Mail className="size-7 text-white" />, color: "bg-gradient-to-b from-blue-400 to-blue-500" },
  { id: "calendar", name: "日历", icon: <Calendar className="size-7 text-white" />, color: "bg-white" },
  { id: "camera", name: "相机", icon: <Camera className="size-7 text-white" />, color: "bg-gradient-to-b from-gray-600 to-gray-800" },
  { id: "photos", name: "照片", icon: <Image className="size-7 text-white" />, color: "bg-gradient-to-b from-orange-300 via-pink-400 to-purple-500" },
  { id: "clock", name: "时钟", icon: <Clock className="size-7 text-white" />, color: "bg-black" },
  { id: "map", name: "地图", icon: <MapPin className="size-7 text-white" />, color: "bg-gradient-to-b from-green-400 to-green-600" },
  { id: "music", name: "音乐", icon: <Music className="size-7 text-white" />, color: "bg-gradient-to-b from-red-400 to-pink-600" },
  { id: "notes", name: "备忘录", icon: <BookOpen className="size-7 text-amber-600" />, color: "bg-gradient-to-b from-yellow-100 to-yellow-200" },
  { id: "calculator", name: "计算器", icon: <Calculator className="size-7 text-white" />, color: "bg-gradient-to-b from-gray-700 to-gray-900" },
  { id: "settings", name: "设置", icon: <Settings className="size-7 text-white" />, color: "bg-gradient-to-b from-gray-400 to-gray-500" },
  { id: "weather", name: "天气", icon: <Cloud className="size-7 text-white" />, color: "bg-gradient-to-b from-sky-300 to-blue-500" },
  { id: "wallet", name: "钱包", icon: <Wallet className="size-7 text-white" />, color: "bg-black" },
  { id: "compass", name: "指南针", icon: <Compass className="size-7 text-white" />, color: "bg-black" },
  { id: "phone", name: "电话", icon: <Phone className="size-7 text-white" />, color: "bg-gradient-to-b from-green-400 to-green-600" },
]

const DOCK_APPS: AppIcon[] = [
  { id: "dock-phone", name: "电话", icon: <Phone className="size-7 text-white" />, color: "bg-gradient-to-b from-green-400 to-green-600" },
  { id: "dock-msg", name: "信息", icon: <MessageSquare className="size-7 text-white" />, color: "bg-gradient-to-b from-green-400 to-green-500" },
  { id: "dock-safari", name: "Safari", icon: <Globe className="size-7 text-white" />, color: "bg-gradient-to-b from-blue-400 to-blue-600" },
  { id: "dock-mail", name: "邮件", icon: <Mail className="size-7 text-white" />, color: "bg-gradient-to-b from-blue-400 to-blue-500" },
]

function AppIconBtn({ app, onTap }: { app: AppIcon; onTap: (id: string) => void }) {
  return (
    <button onClick={() => onTap(app.id)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform duration-150">
      {app.isViceMe ? (
        <div className="size-[60px] rounded-[14px] overflow-hidden shadow-sm">
          <SkillHashGlyph seedText="viceme-ai" size={60} />
        </div>
      ) : (
        <div className={`size-[60px] rounded-[14px] flex items-center justify-center shadow-sm ${app.color}`}>
          {app.icon}
        </div>
      )}
      <span className="text-[11px] text-white/90 drop-shadow-sm truncate w-[64px] text-center">{app.name}</span>
    </button>
  )
}

function HomeScreen({ onOpenApp }: { onOpenApp: (id: string) => void }) {
  const dateStr = (() => {
    const d = new Date()
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  })()

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden phone-wallpaper">
      <StatusBar dark />

      <div className="mt-2 mb-1 text-center">
        <p className="text-[13px] text-white/70 font-medium drop-shadow-sm">{dateStr}</p>
      </div>

      <div className="flex-1 px-5 pt-2">
        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {HOME_APPS.map((app) => (
            <AppIconBtn key={app.id} app={app} onTap={onOpenApp} />
          ))}
        </div>
      </div>

      {/* Page dots */}
      <div className="flex justify-center gap-1.5 py-2">
        <div className="size-[6px] rounded-full bg-white/80" />
        <div className="size-[6px] rounded-full bg-white/30" />
        <div className="size-[6px] rounded-full bg-white/30" />
      </div>

      {/* Dock */}
      <div className="mx-3 mb-2 rounded-[26px] bg-white/20 backdrop-blur-xl px-4 py-2.5">
        <div className="flex justify-around">
          {DOCK_APPS.map((app) => (
            <button key={app.id} onClick={() => onOpenApp(app.id)} className="active:scale-90 transition-transform duration-150">
              <div className={`size-[60px] rounded-[14px] flex items-center justify-center shadow-sm ${app.color}`}>
                {app.icon}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pb-2">
        <div className="w-[134px] h-[5px] rounded-full bg-white/50" />
      </div>
    </div>
  )
}

function HomeNotificationBanner({ onTap }: { onTap: () => void }) {
  const toast = useChatStore((s) => s.toastNotification)
  const dismissToast = useChatStore((s) => s.dismissToast)

  if (!toast) return null

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute top-[62px] left-3 right-3 z-[110]"
    >
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-xl shadow-xl shadow-black/15 border border-white/60 px-4 py-3 active:bg-white/70 transition-colors text-left"
      >
        <SkillHashGlyph seedText="viceme-ai" size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-800 truncate">{toast.title}</p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{toast.desc}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); dismissToast() }} className="shrink-0 text-slate-300">
          <X className="size-4" />
        </button>
      </button>
    </motion.div>
  )
}

function LockScreenTaskCard() {
  const taskState = useChatStore((s) => s.taskState)
  const taskPhases = useChatStore((s) => s.taskPhases)
  const isActive = taskState === "executing" || taskState === "paused" || taskState === "authorizing"
  const isCompleted = taskState === "completed" && taskPhases.length > 0

  const progress = useMemo(() => (isActive || isCompleted) ? getTaskProgress(taskPhases) : null, [isActive, isCompleted, taskPhases])

  const completedSteps = useMemo(() => {
    const steps: string[] = []
    taskPhases.forEach((p) => {
      if (!p.authType && p.status === "done") steps.push(p.title)
      if (p.children) p.children.forEach((c) => { if (c.status === "done") steps.push(c.title) })
    })
    return steps
  }, [taskPhases])

  const lastCompleted = completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : null

  if (!progress || (!isActive && !isCompleted)) return null

  return (
    <div className="mx-5 mt-6 w-[calc(100%-40px)]" onClick={(e) => e.stopPropagation()}>
      <div className="rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <SkillHashGlyph seedText="viceme-ai" size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-white font-semibold">ViceMe</span>
              {isActive && <Loader2 className="size-3 text-blue-300 animate-spin" />}
              {isCompleted && <CheckCircle2 className="size-3 text-green-300" />}
            </div>
            <p className="text-[12px] text-white/70 mt-0.5 truncate">
              {isCompleted
                ? "任务已完成，点击查看结果"
                : taskState === "authorizing"
                  ? "等待授权…"
                  : progress.currentStep || "任务执行中…"}
            </p>
          </div>
          <span className="text-[13px] text-white/60 font-medium shrink-0">{progress.percent}%</span>
        </div>
        <div className="mt-2 h-[3px] rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
        </div>
        {lastCompleted && (
          <p className="text-[11px] text-white/50 mt-2 truncate">✓ {lastCompleted}</p>
        )}
      </div>
    </div>
  )
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const dateStr = (() => {
    const d = new Date()
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  })()

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.3 }}
      onClick={onUnlock}
      className="absolute inset-0 flex flex-col items-center cursor-pointer phone-wallpaper"
    >
      <StatusBar dark />
      <div className="mt-16">
        <p className="text-[13px] text-white/60 text-center font-medium">{dateStr}</p>
        <p className="text-[82px] font-thin text-white text-center leading-none mt-1 tracking-tight">{timeStr}</p>
      </div>
      <LockScreenTaskCard />
      <div className="flex-1" />
      <p className="text-[14px] text-white/50 mb-4 animate-pulse">轻触以解锁</p>
      <div className="flex justify-center pb-2">
        <div className="w-[134px] h-[5px] rounded-full bg-white/50" />
      </div>
    </motion.div>
  )
}

export function PhoneShell() {
  const [screen, setScreen] = useState<"lock" | "home" | "app">("lock")
  const [openAppId, setOpenAppId] = useState<string | null>(null)
  const swipeRef = useRef<{ startY: number } | null>(null)

  const handleUnlock = useCallback(() => setScreen("home"), [])
  const handleLock = useCallback(() => setScreen("lock"), [])

  const handleOpenApp = useCallback((id: string) => {
    if (id === "viceme") {
      setOpenAppId(id)
      setScreen("app")
    }
  }, [])

  const handleGoHome = useCallback(() => {
    setScreen("home")
    setOpenAppId(null)
  }, [])

  const handleSwipeStart = useCallback((y: number) => {
    swipeRef.current = { startY: y }
  }, [])

  const handleSwipeEnd = useCallback((y: number) => {
    if (swipeRef.current && swipeRef.current.startY - y > 60 && screen === "app") {
      handleGoHome()
    }
    swipeRef.current = null
  }, [screen, handleGoHome])

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
      {/* Phone frame */}
      <div
        className="relative shrink-0"
        style={{
          width: PHONE_W + BEZEL * 2,
          height: PHONE_H + BEZEL * 2,
          borderRadius: CORNER_R + BEZEL,
          background: "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 30%, #1a1a1a 100%)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 25px 60px rgba(0,0,0,0.35), 0 5px 15px rgba(0,0,0,0.2)",
          padding: BEZEL,
        }}
      >
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[140px] w-[3px] h-[32px] rounded-l bg-[#2a2a2a]" />
        <div className="absolute -left-[3px] top-[190px] w-[3px] h-[56px] rounded-l bg-[#2a2a2a]" />
        <div className="absolute -left-[3px] top-[258px] w-[3px] h-[56px] rounded-l bg-[#2a2a2a]" />
        {/* Power button — click to lock */}
        <button
          onClick={handleLock}
          className="absolute -right-[3px] top-[200px] w-[3px] h-[80px] rounded-r bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer transition-colors"
          title="锁屏"
        />

        {/* Screen */}
        <div
          className="relative overflow-hidden bg-black"
          style={{
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: CORNER_R,
            ["--phone-safe-top" as string]: "59px",
            ["--phone-safe-bottom" as string]: "34px",
          }}
        >
          {/* Dynamic island — only on home screen */}
          {screen === "home" && <DynamicIsland />}
          {/* Static pill for lock screen (no live activity) */}
          {screen === "lock" && (
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-[100]">
              <div className="w-[126px] h-[37px] bg-black rounded-full" />
            </div>
          )}

          {/* Lock screen */}
          <AnimatePresence>
            {screen === "lock" && <LockScreen onUnlock={handleUnlock} />}
          </AnimatePresence>

          {/* Home screen */}
          {screen === "home" && <HomeScreen onOpenApp={handleOpenApp} />}

          {/* Home screen notification banner */}
          {screen === "home" && <HomeNotificationBanner onTap={() => { setOpenAppId("viceme"); setScreen("app") }} />}

          {/* App screen */}
          <AnimatePresence>
            {screen === "app" && openAppId === "viceme" && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, borderRadius: "28%" }}
                animate={{ scale: 1, opacity: 1, borderRadius: "0%" }}
                exit={{ scale: 0.2, opacity: 0, borderRadius: "28%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="absolute inset-0 z-20 bg-[#F7F8FA]"
                onTouchStart={(e) => handleSwipeStart(e.touches[0].clientY)}
                onTouchEnd={(e) => handleSwipeEnd(e.changedTouches[0].clientY)}
                onMouseDown={(e) => handleSwipeStart(e.clientY)}
                onMouseUp={(e) => handleSwipeEnd(e.clientY)}
              >
                <MobileApp />
                {/* Home indicator overlay */}
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleGoHome() }}
                >
                  <div className="w-[134px] h-[5px] rounded-full bg-black/30" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
