import { create } from 'zustand'

export type Language = 'en' | 'zh-CN' | 'zh-TW'
export type Theme = 'abyss' | 'midnight' | 'light'

const languageStorageKey = 'smartshell.language'
const themeStorageKey = 'smartshell.theme'

const translations = {
  en: {
    shortcutHint: 'Ctrl+Shift+T new · Ctrl+Shift+P commands',
    workspace: 'Workspace',
    noFolder: 'No folder',
    sessions: '{count} sessions',
    profiles: 'Profiles',
    history: 'History',
    tasks: 'Tasks',
    saveWorkspace: 'Save Workspace',
    more: 'More',
    newTerminal: 'New terminal',
    loading: 'Loading SmartShell...',
    loadingDetail: 'Preparing workspace and terminals',
    failedToStart: 'SmartShell failed to start',
    workspaceSaved: 'Workspace saved',
    noTerminals: 'No terminals open',
    startSession: 'Start a new session',
    openTerminalBelow: 'Open a terminal below, or use the launcher in the top bar.',
    agents: 'Agents',
    runningSessions: '{count} running sessions',
    broadcastCommand: 'Broadcast command...',
    send: 'Send',
    noSessions: 'No sessions yet.',
    customTerminal: 'Custom terminal',
    restart: 'Restart',
    duplicate: 'Duplicate',
    log: 'Log',
    close: 'Close',
    profilesDescription: 'Edit launch commands for PowerShell, Claude Code, Codex, and custom tools.',
    name: 'Name',
    shell: 'Shell',
    args: 'Args',
    title: 'Title',
    remove: 'Remove',
    addProfile: 'Add Profile',
    cancel: 'Cancel',
    saveProfiles: 'Save Profiles',
    typeCommand: 'Type a command...',
    openFolder: 'Open Folder',
    openFolderDescription: 'Choose the workspace folder used by new terminals',
    editProfiles: 'Edit Profiles',
    editProfilesDescription: 'Configure terminal launch commands',
    openTaskBoard: 'Open Task Board',
    openTaskBoardDescription: 'Track work across parallel agent sessions',
    saveWorkspaceDescription: 'Save layout and sessions now',
    restartActiveTerminal: 'Restart Active Terminal',
    restartActiveTerminalDescription: 'Restart the current terminal session',
    duplicateActiveTerminal: 'Duplicate Active Terminal',
    duplicateActiveTerminalDescription: 'Create a copy of the current terminal profile and cwd',
    closeActiveTerminal: 'Close Active Terminal',
    closeActiveTerminalDescription: 'Close the current terminal session',
    newProfile: 'New {name}',
    startProfile: 'Start {title}',
    sessionHistory: 'Session History',
    sessionHistoryDescription: 'Open persisted terminal logs from previous and current sessions.',
    noLogs: 'No logs yet.',
    taskBoard: 'Task Board',
    taskBoardDescription: 'Track work across parallel terminal agents.',
    addTask: 'Add a task...',
    noSession: 'No session',
    add: 'Add',
    todo: 'Todo',
    doing: 'Doing',
    done: 'Done',
    missingSession: 'Missing session',
    language: 'Language',
    theme: 'Theme',
    themeAbyss: 'Abyss',
    themeMidnight: 'Midnight',
    themeLight: 'Light',
    builtIn: 'Built-in'
  },
  'zh-CN': {
    shortcutHint: 'Ctrl+Shift+T 新建 · Ctrl+Shift+P 命令',
    workspace: '工作区',
    noFolder: '未选择目录',
    sessions: '{count} 个会话',
    profiles: '配置',
    history: '历史',
    tasks: '任务',
    saveWorkspace: '保存工作区',
    more: '更多',
    newTerminal: '新建终端',
    loading: '正在加载 SmartShell...',
    loadingDetail: '正在准备工作区和终端',
    failedToStart: 'SmartShell 启动失败',
    workspaceSaved: '工作区已保存',
    noTerminals: '暂无终端',
    startSession: '开始一个新会话',
    openTerminalBelow: '从下方打开终端，或使用顶部启动器。',
    agents: 'Agents',
    runningSessions: '{count} 个运行中会话',
    broadcastCommand: '广播命令...',
    send: '发送',
    noSessions: '暂无会话。',
    customTerminal: '自定义终端',
    restart: '重启',
    duplicate: '复制',
    log: '日志',
    close: '关闭',
    profilesDescription: '编辑 PowerShell、Claude Code、Codex 和自定义工具的启动命令。',
    name: '名称',
    shell: 'Shell',
    args: '参数',
    title: '标题',
    remove: '移除',
    addProfile: '添加配置',
    cancel: '取消',
    saveProfiles: '保存配置',
    typeCommand: '输入命令...',
    openFolder: '打开目录',
    openFolderDescription: '选择新终端使用的工作区目录',
    editProfiles: '编辑配置',
    editProfilesDescription: '配置终端启动命令',
    openTaskBoard: '打开任务看板',
    openTaskBoardDescription: '跟踪并行 Agent 会话的工作',
    saveWorkspaceDescription: '立即保存布局和会话',
    restartActiveTerminal: '重启当前终端',
    restartActiveTerminalDescription: '重启当前终端会话',
    duplicateActiveTerminal: '复制当前终端',
    duplicateActiveTerminalDescription: '复制当前终端的配置和目录',
    closeActiveTerminal: '关闭当前终端',
    closeActiveTerminalDescription: '关闭当前终端会话',
    newProfile: '新建 {name}',
    startProfile: '启动 {title}',
    sessionHistory: '会话历史',
    sessionHistoryDescription: '打开当前和历史终端日志。',
    noLogs: '暂无日志。',
    taskBoard: '任务看板',
    taskBoardDescription: '跟踪并行终端 Agent 的工作。',
    addTask: '添加任务...',
    noSession: '不绑定会话',
    add: '添加',
    todo: '待办',
    doing: '进行中',
    done: '完成',
    missingSession: '会话不存在',
    language: '语言',
    theme: '主题',
    themeAbyss: '深海',
    themeMidnight: '午夜',
    themeLight: '浅色',
    builtIn: '内置'
  },
  'zh-TW': {
    shortcutHint: 'Ctrl+Shift+T 新增 · Ctrl+Shift+P 命令',
    workspace: '工作區',
    noFolder: '未選擇目錄',
    sessions: '{count} 個會話',
    profiles: '設定',
    history: '歷史',
    tasks: '任務',
    saveWorkspace: '儲存工作區',
    more: '更多',
    newTerminal: '新增終端',
    loading: '正在載入 SmartShell...',
    loadingDetail: '正在準備工作區和終端',
    failedToStart: 'SmartShell 啟動失敗',
    workspaceSaved: '工作區已儲存',
    noTerminals: '暫無終端',
    startSession: '開始一個新會話',
    openTerminalBelow: '從下方開啟終端，或使用頂部啟動器。',
    agents: 'Agents',
    runningSessions: '{count} 個執行中會話',
    broadcastCommand: '廣播命令...',
    send: '送出',
    noSessions: '暫無會話。',
    customTerminal: '自訂終端',
    restart: '重啟',
    duplicate: '複製',
    log: '日誌',
    close: '關閉',
    profilesDescription: '編輯 PowerShell、Claude Code、Codex 和自訂工具的啟動命令。',
    name: '名稱',
    shell: 'Shell',
    args: '參數',
    title: '標題',
    remove: '移除',
    addProfile: '新增設定',
    cancel: '取消',
    saveProfiles: '儲存設定',
    typeCommand: '輸入命令...',
    openFolder: '開啟目錄',
    openFolderDescription: '選擇新終端使用的工作區目錄',
    editProfiles: '編輯設定',
    editProfilesDescription: '設定終端啟動命令',
    openTaskBoard: '開啟任務看板',
    openTaskBoardDescription: '追蹤並行 Agent 會話的工作',
    saveWorkspaceDescription: '立即儲存布局和會話',
    restartActiveTerminal: '重啟目前終端',
    restartActiveTerminalDescription: '重啟目前終端會話',
    duplicateActiveTerminal: '複製目前終端',
    duplicateActiveTerminalDescription: '複製目前終端的設定和目錄',
    closeActiveTerminal: '關閉目前終端',
    closeActiveTerminalDescription: '關閉目前終端會話',
    newProfile: '新增 {name}',
    startProfile: '啟動 {title}',
    sessionHistory: '會話歷史',
    sessionHistoryDescription: '開啟目前和歷史終端日誌。',
    noLogs: '暫無日誌。',
    taskBoard: '任務看板',
    taskBoardDescription: '追蹤並行終端 Agent 的工作。',
    addTask: '新增任務...',
    noSession: '不綁定會話',
    add: '新增',
    todo: '待辦',
    doing: '進行中',
    done: '完成',
    missingSession: '會話不存在',
    language: '語言',
    theme: '主題',
    themeAbyss: '深海',
    themeMidnight: '午夜',
    themeLight: '淺色',
    builtIn: '內建'
  }
} satisfies Record<Language, Record<string, string>>

type TranslationKey = keyof typeof translations.en

type SettingsState = {
  language: Language
  theme: Theme
  setLanguage(language: Language): void
  setTheme(theme: Theme): void
}

const getInitialLanguage = (): Language => {
  const stored = window.localStorage.getItem(languageStorageKey)
  return stored === 'zh-CN' || stored === 'zh-TW' || stored === 'en' ? stored : 'en'
}

const getInitialTheme = (): Theme => {
  const stored = window.localStorage.getItem(themeStorageKey)
  return stored === 'abyss' || stored === 'midnight' || stored === 'light' ? stored : 'abyss'
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: getInitialLanguage(),
  theme: getInitialTheme(),
  setLanguage(language) {
    window.localStorage.setItem(languageStorageKey, language)
    set({ language })
  },
  setTheme(theme) {
    window.localStorage.setItem(themeStorageKey, theme)
    set({ theme })
  }
}))

const interpolate = (value: string, replacements?: Record<string, string | number>): string => {
  if (!replacements) return value

  return Object.entries(replacements).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value
  )
}

export function translate(language: Language, key: TranslationKey, replacements?: Record<string, string | number>): string {
  return interpolate(translations[language][key] ?? translations.en[key], replacements)
}

export function getTerminalTheme(theme: Theme): {
  background: string
  foreground: string
  cursor: string
  selectionBackground: string
  black: string
  blue: string
  cyan: string
  green: string
  magenta: string
  red: string
  white: string
  yellow: string
} {
  if (theme === 'light') {
    return {
      background: '#fbfcff',
      foreground: '#273449',
      cursor: '#16a34a',
      selectionBackground: '#bbf7d0',
      black: '#0f172a',
      blue: '#2563eb',
      cyan: '#0891b2',
      green: '#16a34a',
      magenta: '#9333ea',
      red: '#dc2626',
      white: '#f8fafc',
      yellow: '#b45309'
    }
  }

  if (theme === 'midnight') {
    return {
      background: '#070a12',
      foreground: '#e5e7eb',
      cursor: '#a78bfa',
      selectionBackground: '#312e81',
      black: '#050816',
      blue: '#60a5fa',
      cyan: '#22d3ee',
      green: '#34d399',
      magenta: '#c084fc',
      red: '#fb7185',
      white: '#f8fafc',
      yellow: '#fbbf24'
    }
  }

  return {
    background: '#0f1117',
    foreground: '#d6deeb',
    cursor: '#80cbc4',
    selectionBackground: '#2d3f57',
    black: '#0b0f19',
    blue: '#82aaff',
    cyan: '#89ddff',
    green: '#c3e88d',
    magenta: '#c792ea',
    red: '#ff5370',
    white: '#d6deeb',
    yellow: '#ffcb6b'
  }
}

export function useI18n(): {
  language: Language
  setLanguage(language: Language): void
  t(key: TranslationKey, replacements?: Record<string, string | number>): string
} {
  const language = useSettingsStore((state) => state.language)
  const setLanguage = useSettingsStore((state) => state.setLanguage)

  return {
    language,
    setLanguage,
    t: (key, replacements) => translate(language, key, replacements)
  }
}
