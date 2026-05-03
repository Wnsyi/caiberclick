# Component 3 完善方案

## 结构

```
┌──────────────────────────────────────────┐
│  COMPONENT 3                             │
├──────────────────────────────────────────┤
│                                          │
│  中组件-上：comp3-upper                   │
│  - 全宽占位图片 (50vh)                     │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  中组件-下：comp3-lower                   │
│  ┌────────────────┐                      │
│  │  小组件A       │                      │
│  │  grid-row:1    │                      │
│  │  grid-col:1    │    ┌────────────────┐│
│  │  (左上方)      │    │  小组件B       ││
│  │                │    │  grid-row:2    ││
│  │                │    │  grid-col:2    ││
│  │                │    │  (右下方)      ││
│  └────────────────┘    └────────────────┘│
│                                          │
│  (网格 2列 × 2行，只填充对角线两个格子)     │
│                                          │
├──────────────────────────────────────────┤
│  comp3-footer                            │
└──────────────────────────────────────────┘
```

## CSS 新增/修改

| 类名 | 用途 |
|------|------|
| `.comp3-upper` | 中组件上：全宽图片容器，`height:50vh; min-height:350px` |
| `.comp3-lower` | 中组件下：CSS Grid 2列×2行，`max-width:1100px; margin:0 auto; padding:64px 32px` |
| `.comp3-card` | 小组件通用样式：圆角卡片背景，内边距，阴影 |
| `.comp3-card-a` | 小组件A：`grid-row:1; grid-column:1`（左上） |
| `.comp3-card-b` | 小组件B：`grid-row:2; grid-column:2`（右下） |
| `.comp3-card-icon` | 卡片内 emoji/图标 |
| `.comp3-card-title` | 卡片标题 |
| `.comp3-card-text` | 卡片正文 |

### 删除

| 类名 | 原因 |
|------|------|
| `.comp3-image` | 重命名为 `.comp3-upper`，统一命名风格 |

## HTML 改动

将 `#comp3` 从：

```html
<section class="comp3" id="comp3">
  <div class="comp3-image"><img ...></div>
  <div class="comp3-footer">...</div>
</section>
```

改为：

```html
<section class="comp3" id="comp3">
  <!-- 中组件-上：占位图 -->
  <div class="comp3-upper">
    <img src="..." alt="占位图">
  </div>

  <!-- 中组件-下：两个小组件（对角线布局） -->
  <div class="comp3-lower">
    <div class="comp3-card comp3-card-a">
      <div class="comp3-card-icon">📖</div>
      <div class="comp3-card-title">关于人生体验卡</div>
      <div class="comp3-card-text">...</div>
    </div>
    <div class="comp3-card comp3-card-b">
      <div class="comp3-card-icon">⚠️</div>
      <div class="comp3-card-title">免责声明</div>
      <div class="comp3-card-text">...</div>
    </div>
  </div>

  <div class="comp3-footer">...</div>
</section>
```

## 响应式

- `max-width:640px` 时：`.comp3-lower` 改为单列布局 (`grid-template-columns:1fr`)，两个卡片回到正常流（`grid-row/grid-column:auto`），取消对角线偏移

## 影响范围

- CSS：替换 `.comp3` / `.comp3-image` / `.comp3-footer` 相关样式（约 10 行）
- HTML：替换 `#comp3` 内部结构（约 10 行）
- 响应式：新增 `.comp3-lower` / `.comp3-card` 移动端规则（约 5 行）
- JS：无改动
- 其他组件 (comp1, comp2)：无改动
