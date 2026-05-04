# 重构方案：三组件布局

## 整体结构

```
┌──────────────────────────────────────┐
│  Sticky Nav（保留，链接指向3个组件）    │
├──────────────────────────────────────┤
│                                      │
│  COMPONENT 1（全屏高）                │
│  - 全宽背景大图                        │
│  - 标题文字叠加层                       │
│  - 左下角 CTA 按钮                     │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  COMPONENT 2                         │
│  ┌────────────────────────────────┐  │
│  │  中组件-上：占位图区域            │  │
│  │  (全宽图片，约 60vh)             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  中组件-下：体验卡轮播            │  │
│  │  - 5 张体验卡                    │  │
│  │  - 左右箭头 + 下方圆点导航        │  │
│  │  - 点击卡片进入聊天体验           │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  COMPONENT 3                         │
│  ┌────────────────────────────────┐  │
│  │  中组件-上：占位图区域            │  │
│  │  (全宽图片，约 50vh)             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  中组件-下：对角线双卡片          │  │
│  │  ┌──────────┐                  │  │
│  │  │ 卡片A    │                  │  │
│  │  │ 恋爱故事1 │                  │  │
│  │  │ (左上)   │   ┌──────────┐   │  │
│  │  │          │   │ 卡片B    │   │  │
│  │  │          │   │ 恋爱故事2 │   │  │
│  │  └──────────┘   │ (右下)   │   │  │
│  │                  └──────────┘   │  │
│  │  点击卡片 → 跳转聊天页 →         │  │
│  │  恋与深空式分支恋爱叙事           │  │
│  └────────────────────────────────┘  │
│  - footer 信息                       │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  COMPONENT 4                         │
│  ┌────────────────────────────────┐  │
│  │  中组件-上：占位（40%）          │  │
│  │  (全宽，flex: 2)                │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  中组件-下：占位（60%）          │  │
│  │  (全宽，flex: 3)                │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

## CSS 新增/修改

### 新增类名

| 类名 | 用途 |
|------|------|
| `.comp1` | 第一大组件容器，`height:100vh`，`position:relative`，全宽背景图 |
| `.comp1-bg` | comp1 的背景图 `<img>`，`object-fit:cover` 撑满 |
| `.comp1-overlay` | 背景图上的文字叠加层，居中排版 |
| `.comp1-title` | 主标题，大号 display 字体 |
| `.comp1-sub` | 副标题说明文字 |
| `.comp1-btn` | 左下角的 CTA 按钮，`position:absolute; bottom:48px; left:48px` |
| `.comp2` | 第二大组件容器 |
| `.comp2-upper` | 中组件上：全宽图片占位，`height:60vh; min-height:400px` |
| `.comp2-lower` | 中组件下：轮播区域，包含 section-header + carousel |
| `.comp3` | 第三大组件容器 |
| `.comp3-upper` | 中组件上：全宽图片占位，`height:50vh; min-height:350px` |
| `.comp3-lower` | 中组件下：CSS Grid 2×2，`max-width:1100px` |
| `.comp3-card` | 小组件通用样式：圆角半透明卡片 |
| `.comp3-card-a` | 小组件A：`grid-row:1; grid-column:1`（左上方） |
| `.comp3-card-b` | 小组件B：`grid-row:2; grid-column:2`（右下方） |
| `.comp3-card-icon` | 卡片内 emoji 图标 |
| `.comp3-card-title` | 卡片标题 |
| `.comp3-card-text` | 卡片正文 |
| `.comp3-footer` | 底部版权信息 |
| `.comp4` | 第四大组件容器，`display:flex; flex-direction:column; height:100vh; min-height:600px` |
| `.comp4-upper` | 中组件上：占位区域，`flex:2`（占40%），全宽 |
| `.comp4-lower` | 中组件下：占位区域，`flex:3`（占60%），全宽 |

### 保留/复用的类名

- `.sticky-nav` 及其子元素（nav 样式不变）
- `.carousel-wrapper` / `.carousel-track` / `.carousel-slide` 全套轮播样式
- `.card-badge-top` / `.card-emoji-large` / `.card-title-large` 等卡片内部样式
- `.card-actions` / `.btn-card-primary` / `.btn-card-secondary` 卡片按钮
- `.carousel-arrow` / `.carousel-dots` 轮播导航
- 6 个 `.slide-*` 颜色变体
- Chat 页、Result 页、Overlay 全部样式（不动）

### 删除的类名

- `.home-text-card` / `.home-hero-image` / `.home-cta-wrap` / `.home-cta-btn` / `.home-footer`
- `.card-modal-backdrop` / `.card-modal` / `.card-modal-close` / `.card-modal-header`
- `.comp1-image` / `.hero-overlay` / `.hero-title` / `.hero-subtitle` / `.hero-tags` / `.hero-cta`
- `.comp2-image` / `.comp3-image`
- `.staggered-grid` / `.staggered-card`
- `.press-section` / `.press-logos` / `.social-section` / `.social-grid` / `.social-item`
- `.site-footer` / `.footer-brand`
- `.comp-cards` / `.section-header` / `.section-tag`

## HTML 改动

`#page-home` 替换为：

```html
<div id="page-home" class="page active">

  <!-- ===== COMPONENT 1 ===== -->
  <section class="comp1" id="comp1">
    <img class="comp1-bg" src="..." alt="背景">
    <div class="comp1-overlay">
      <h1 class="comp1-title">人生体验卡<br>一日奇幻之旅</h1>
      <p class="comp1-sub">每张卡让你沉浸式体验一种不可能的人生剧本</p>
    </div>
    <button class="comp1-btn" onclick="...">开始体验 ▼</button>
  </section>

  <!-- ===== COMPONENT 2 ===== -->
  <section class="comp2" id="comp2">
    <!-- 中组件-上：占位图 -->
    <div class="comp2-upper">
      <img src="..." alt="占位">
    </div>
    <!-- 中组件-下：体验卡轮播 -->
    <div class="comp2-lower" id="comp2-cards">
      <div class="section-header">...</div>
      <div class="carousel-wrapper" id="carouselWrapper">
        <button class="carousel-arrow carousel-prev">‹</button>
        <div class="carousel-track" id="carouselTrack"></div>
        <button class="carousel-arrow carousel-next">›</button>
        <div class="carousel-dots" id="carouselDots"></div>
      </div>
    </div>
  </section>

  <!-- ===== COMPONENT 3 ===== -->
  <section class="comp3" id="comp3">
    <!-- 中组件-上：占位图 -->
    <div class="comp3-upper">
      <img src="..." alt="占位">
    </div>
    <!-- 中组件-下：对角线双卡片（点击进入恋爱叙事游戏） -->
    <div class="comp3-lower">
      <div class="comp3-card comp3-card-a" onclick="selectCard('love_story_1')">
        <div class="comp3-card-icon">💌</div>
        <div class="comp3-card-title">恋爱故事A</div>
        <div class="comp3-card-text">简介...</div>
      </div>
      <div class="comp3-card comp3-card-b" onclick="selectCard('love_story_2')">
        <div class="comp3-card-icon">💔</div>
        <div class="comp3-card-title">恋爱故事B</div>
        <div class="comp3-card-text">简介...</div>
      </div>
    </div>
    <div class="comp3-footer">...</div>
  </section>

  <!-- ===== COMPONENT 4 ===== -->
  <section class="comp4" id="comp4">
    <!-- 中组件-上：占位（40%） -->
    <div class="comp4-upper"></div>
    <!-- 中组件-下：占位（60%） -->
    <div class="comp4-lower"></div>
  </section>

</div>
```

## JS 改动

| 改动项 | 说明 |
|--------|------|
| `renderStaggeredGrid()` | **删除**，不再需要 |
| `renderHome()` | 只保留 `renderCarousel()` 调用 |
| `openCardModal()` / `closeCardModal()` | **删除**（如果存在），本次设计中不需要 modal |
| `selectCard()` | 保持现有逻辑，点击卡片直接跳转聊天页 |
| 其他函数 | 不变 |

## 导航栏

```html
<nav class="sticky-nav">
  <div class="nav-left">人生体验卡 · 一日奇幻之旅</div>
  <div class="nav-center">
    <a onclick="...scrollTo comp1">首页</a>
    <a onclick="...scrollTo comp2">体验卡</a>
    <a onclick="...scrollTo comp3">关于</a>
  </div>
  <div class="nav-right">
    <button class="nav-btn" onclick="...scrollTo comp2-cards">开始</button>
  </div>
</nav>
```

## 响应式（移动端）

- `max-width:900px`: 隐藏 `.nav-center`
- `max-width:640px`:
  - `.comp1-btn` left/bottom 缩小，font-size 减小
  - `.comp1-title` font-size 缩小
  - `.comp2-upper` / `.comp3-upper` 高度减小
  - `.comp3-lower` 改为单列，卡片取消对角线定位
  - `.comp4` 高度缩小，`min-height:400px`
  - `.carousel-slide` 宽度缩小，隐藏箭头
  - 卡片内部字号缩小

---

**保留不动的内容：**
- Chat 页（`#page-chat`）全部 HTML/CSS/JS
- Result 页（`#page-result`）全部 HTML/CSS/JS
- Overlay 组件
- 6 张体验卡的完整数据（`EXPERIENCE_CARDS`）
- 人格结果映射表（`buildResults`）
- 游戏引擎核心函数（`selectCard`、`startPhase`、`playMessages`、`finishGame`、`renderResult` 等）
- 轮播逻辑（`renderCarousel`、`carouselNext/Prev/GoTo`、滚动监听）
