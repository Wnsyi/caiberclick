# 恋爱叙事视觉小说页面 · 设计文档

## 概述

为两张恋爱故事卡（暗恋咖啡店 / 重逢十字路口）创建独立的视觉小说页面 `#page-love-story`，取代现有的群聊式 Chat 页。采用"恋与深空"式布局：人物立绘在左，对话框在右下。

---

## 页面布局

```
┌─────────────────────────────────────────┐
│  Top Bar（返回按钮 + 故事标题）           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐                           │
│  │          │                           │
│  │  人物立绘 │        空白区域            │
│  │  (左侧)  │     （点击继续对话）         │
│  │          │                           │
│  │          │                           │
│  │  TA      │     ┌─────────────────┐   │
│  │          │     │  对话框          │   │
│  └──────────┘     │  "你真的来了。"   │   │
│                    │                 │   │
│                    └─────────────────┘   │
│                        ┌───┐ ┌───┐      │
│                        │ A │ │ B │  选择 │
│                        └───┘ └───┘      │
│                       ▼ 点击继续         │
└─────────────────────────────────────────┘
```

- **人物立绘**：固定在页面左侧，垂直居中偏上。显示当前说话角色的头像/立绘图片和名字。
- **对话框**：固定在页面右下区域，靠近底部。半透明深色背景，带左侧小三角指向人物。文字逐条显示。
- **选择按钮**：对话框下方出现两个并排按钮，供用户二选一。
- **点击继续提示**：对话框下方闪烁箭头，提示用户点击任意位置继续。

---

## 交互流程

```
进入页面
  ↓
显示 Phase 第1条消息（带人物名 + 对话框）
  ↓ 点击任意位置
显示 Phase 第2条消息
  ↓ 点击任意位置
...（逐条播放所有消息）
  ↓
播放完毕 → 隐藏"点击继续"，显示系统提示 + 两个选择按钮
  ↓ 用户点击选项A或B
选项高亮 → 短暂延迟 → 进入下一阶段
  ↓
...（重复直到 Phase 3 选择完毕）
  ↓
finish → overlay → result 页面（复用现有处方卡）
```

---

## HTML 结构

```html
<div id="page-love-story" class="page">
  <!-- 顶栏 -->
  <div class="ls-topbar">
    <button class="ls-back-btn" onclick="endLoveStory()">✕ 退出</button>
    <span class="ls-story-title" id="lsStoryTitle">暗恋咖啡店</span>
  </div>

  <!-- 主舞台 -->
  <div class="ls-stage" id="lsStage" onclick="loveTapAdvance()">
    <!-- 人物区 -->
    <div class="ls-char-area" id="lsCharArea">
      <div class="ls-char-avatar" id="lsCharAvatar" style="background:#F472B6">💌</div>
      <div class="ls-char-name" id="lsCharName">TA</div>
    </div>

    <!-- 对话框区 -->
    <div class="ls-dialog-area" id="lsDialogArea">
      <div class="ls-dialog-bubble" id="lsDialogBubble">
        <p class="ls-dialog-text" id="lsDialogText"></p>
      </div>
      <div class="ls-choices" id="lsChoices" style="display:none">
        <button class="ls-choice-btn" id="lsChoice1" onclick="event.stopPropagation();loveChoose(1)"></button>
        <button class="ls-choice-btn" id="lsChoice2" onclick="event.stopPropagation();loveChoose(2)"></button>
      </div>
      <div class="ls-tap-hint" id="lsTapHint">点击继续 ▼</div>
    </div>
  </div>
</div>
```

---

## CSS 关键样式

| 类名 | 用途 |
|------|------|
| `#page-love-story` | 全屏固定，背景深色渐变，overflow:hidden |
| `.ls-topbar` | 顶部半透明栏，返回按钮 + 故事标题 |
| `.ls-stage` | 主舞台，flex布局，点击触发推进 |
| `.ls-char-area` | 左侧人物区，flex列，居中显示头像+名字 |
| `.ls-char-avatar` | 圆形大头像（120px），背景色跟随角色 |
| `.ls-char-name` | 角色名，小字显示在头像下方 |
| `.ls-dialog-area` | 右下区域，固定宽度，含对话框+选择+提示 |
| `.ls-dialog-bubble` | 对话气泡，深色半透明，圆角，左侧小三角 |
| `.ls-dialog-text` | 对话文字，14px，typewriter或直接显示 |
| `.ls-choices` | 两个选择按钮并排 |
| `.ls-choice-btn` | 选择按钮，半透明边框，hover高亮 |
| `.ls-tap-hint` | 点击继续提示，闪烁动画 |

---

## JS 引擎

### 新增函数

| 函数 | 说明 |
|------|------|
| `selectLoveCard(cardId)` | 入口——设置状态、显示页面、启动阶段 |
| `startLovePhase(phaseId)` | 加载阶段数据，开始逐条播放消息 |
| `lovePlayNextMessage()` | 播放消息队列中的下一条 |
| `loveShowMessage(msg)` | 渲染单条消息（人物+对话框+文字） |
| `loveShowPrompt(prompt, options)` | 显示系统提示 + 选择按钮 |
| `loveTapAdvance()` | 点击舞台触发——播放下一条或忽略 |
| `loveChoose(choiceId)` | 用户做出选择，推进到下一阶段 |
| `endLoveStory()` | 退出恋爱故事，返回首页 |
| `loveFinishGame()` | 结束游戏，显示 overlay → result |

### 状态

```js
let loveState = {
  currentCard: null,
  currentPhase: null,
  choicePath: [],
  messageQueue: [],      // 当前阶段待播放的消息
  messageIndex: 0,       // 当前播放到的消息索引
  isPlaying: false,
  isShowingPrompt: false, // 是否正在显示选择
  currentOptions: null,
};
```

### 关键逻辑

```
selectLoveCard(cardId)
  → 设置 loveState.currentCard
  → showPage('page-love-story')
  → startLovePhase(card.startPhase)

startLovePhase(phaseId)
  → 获取 phase 数据
  → 如果 isEnd → loveFinishGame()
  → 否则 messageQueue = phase.messages
  → messageIndex = 0
  → lovePlayNextMessage()

lovePlayNextMessage()
  → 如果 messageIndex < messageQueue.length
    → loveShowMessage(messageQueue[messageIndex])
    → messageIndex++
  → 否则（消息播完）
    → loveShowPrompt(phase.prompt, phase.options)

loveShowMessage(msg)
  → 更新人物头像色/emoji/名字
  → 更新对话框文字
  → 显示"点击继续"提示
  → 隐藏选择按钮

loveShowPrompt(prompt, options)
  → 更新对话框文字为 prompt
  → 隐藏"点击继续"提示
  → 显示两个选择按钮（选项1、选项2）
  → lsStage 的点击推进暂停

loveTapAdvance()
  → 如果 isShowingPrompt → 不响应
  → 否则 → lovePlayNextMessage()

loveChoose(choiceId)
  → choicePath.push(choiceId)
  → 隐藏选择按钮
  → 显示"点击继续"
  → startLovePhase(option.next)
```

---

## 角色头像映射

根据当前说话角色动态切换人物区的表现：

```js
function getCharStyle(senderName, card) {
  const color = card.avatarColors[senderName] || '#6b7280';
  const emoji = senderName.charAt(0); // 取第一个字作为头像文字
  return { color, emoji };
}
```

---

## 与现有系统的关系

| 项目 | 关系 |
|------|------|
| 现有 Chat 页 (`#page-chat`) | **不动**，6张体验卡继续使用 |
| 现有游戏引擎 (`selectCard`, `startPhase`, ...) | **不动**，不受影响 |
| 新页面 (`#page-love-story`) | **新增**，独立于 Chat 页 |
| 新引擎 (`loveState`, `selectLoveCard`, ...) | **新增**，复用 `EXPERIENCE_CARDS` 数据格式 |
| Result 页 (`#page-result`) | **复用**，`loveFinishGame` 设置 `state.currentCard` 后直接调用现有 `finishGame()` → `renderResult()` |
| 数据层 (`EXPERIENCE_CARDS`) | **不动**，love_crush / love_reunion 卡数据格式完全兼容 |

### 接入方式

comp3 卡片 `onclick` 从 `selectCard('love_crush')` 改为 `selectLoveCard('love_crush')`。

`selectLoveCard` 将 `state.currentCard` 设置为对应卡数据，这样 `finishGame()` → `renderResult()` 能正确读取 `state.currentCard` 和 `state.choicePath`。

---

## 响应式

- `max-width:640px`：
  - `.ls-char-avatar` 缩小至 80px
  - `.ls-dialog-area` 宽度占满，左右留 16px padding
  - `.ls-dialog-bubble` 字号缩小
  - `.ls-char-area` 可缩小或移至左上角
