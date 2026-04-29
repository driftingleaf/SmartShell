# SmartShell

SmartShell 是一个面向 Windows 的桌面多终端工作台，用来在同一个窗口中并行管理 PowerShell、cmd、Claude Code、Codex 等命令行会话。它提供类似 IDE 的可拖拽 DockPanel 布局、终端标题重命名、会话状态面板、日志历史和任务看板，适合同时运行多个 AI 编程 Agent。

## 功能特性

- 多终端工作区：在一个桌面应用中同时运行多个 shell / AI Agent 会话。
- DockPanel 布局：支持终端面板拖拽、拆分、标签页和布局保存。
- 终端 Profile：内置 PowerShell、cmd、Claude Code、Codex，可自定义启动命令。
- 工作区目录：可选择默认工作目录，新终端会从该目录启动。
- 终端标题管理：支持重命名每个终端，方便区分不同任务。
- 右键菜单：支持 Copy、Paste、Clear、Restart、Duplicate、Close。
- Command Palette：通过 `Ctrl+Shift+P` 快速执行常用操作。
- Agent 状态面板：集中查看所有会话、状态、路径和最近输出信号。
- 多 Agent 协作：支持向所有运行中的会话广播命令。
- 输出信号解析：从终端输出中提取 Active、Waiting、Completed、Needs attention 等状态。
- 持久化日志：自动保存每个终端会话输出，并可从历史记录中打开。
- Session History：查看并打开历史终端日志。
- Task Board：本地任务看板，可将任务绑定到当前终端会话。
- Windows portable 打包：无需额外打包依赖即可生成本地可运行版本和 zip 包。

## 技术栈

- Electron
- React
- TypeScript
- Vite / electron-vite
- xterm.js
- node-pty
- dockview
- Zustand

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 类型检查

```bash
npm run typecheck
```

### 构建

```bash
npm run build
```

### 生成 Windows portable 包

```bash
npm run dist
```

打包完成后会生成：

```text
release/SmartShell-win32-x64/
release/SmartShell-0.1.0-win32-x64.zip
release/install-smartshell.ps1
release/uninstall-smartshell.ps1
```

## 使用说明

### 快捷键

- `Ctrl+Shift+T`：新建 PowerShell 终端
- `Ctrl+Shift+P`：打开 Command Palette

### Profile 管理

点击顶部 `Profiles` 可以编辑终端 Profile，包括：

- Profile 名称
- Shell 路径
- 启动参数
- 默认标题

内置 Profile：

- PowerShell
- Command Prompt
- Claude Code
- Codex

### 工作区目录

点击顶部 `Workspace` 按钮可以选择工作区目录。新建终端默认会从该目录启动。

### Agent 面板

右侧 Agents 面板会显示当前所有终端会话，并支持：

- 激活对应终端面板
- Restart
- Duplicate
- 打开当前日志
- Close
- 广播命令到所有运行中的会话

### 日志历史

点击顶部 `History` 可以查看历史终端日志。日志默认保存在 Electron `userData/logs` 目录下。

### 任务看板

点击顶部 `Tasks` 可以打开本地任务看板。任务支持 Todo、Doing、Done 三种状态，并可绑定到当前终端会话。

## 项目结构

```text
src/
  main/                 Electron main process
    ipc/                IPC handlers
    profiles/           Terminal profile persistence
    pty/                PTY session lifecycle
    workspace/          Workspace persistence and folder picker
  preload/              Secure preload bridge
  renderer/             React renderer
    components/         UI components
    store/              Zustand state store
  shared/               Shared TypeScript types
build/                  App icon assets
scripts/                Local packaging and install scripts
```

## 数据持久化

SmartShell 使用 Electron `userData` 目录保存本地数据：

- `profiles.json`：终端 Profile 配置
- `workspace.json`：工作区布局和会话元数据
- `logs/`：终端会话日志

## 打包与安装

`npm run dist` 会生成 portable 版本和 zip 包。也可以使用生成的 PowerShell 脚本安装到当前用户目录：

```powershell
powershell -ExecutionPolicy Bypass -File release\install-smartshell.ps1
```

卸载：

```powershell
powershell -ExecutionPolicy Bypass -File release\uninstall-smartshell.ps1
```

## 当前状态

SmartShell 当前处于 MVP / early preview 阶段，核心目标是提供一个稳定、可用的本地多终端 AI Agent 工作台。后续可继续扩展更完整的多 Agent 编排、任务同步、输出结构化分析和更正式的 Windows 安装包。
