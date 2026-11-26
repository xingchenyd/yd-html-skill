# 场景道具动效

`assets/starter/motion.js` 提供透明 Canvas 2D 道具。封面、纸缘、纸面弯曲和阴影由透视投影计算，适合有实体书册、档案页或印刷品的主题。也可省略道具模块，用同一播放器呈现其他物体和动效。

## 接入播放器

在播放器脚本之前加载 `motion.js`。两个入口可以独立调用。

```html
<canvas id="notebook" class="scene-prop" aria-hidden="true"></canvas>
<canvas id="pages" class="scene-prop" aria-hidden="true"></canvas>
```

```css
.scene-prop {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.scene-prop[hidden] {
  display: none;
}
```

由 CSS 给画布外层一个明确的宽和高。立体书的设计视域是 900×800，散页为 1150×850，两个道具都按视域等比适配画布。可以给宽屏的道具舞台留出右半边，也可以让道具在窄屏上排列到正文下方。正文、图表读数和无障碍信息留在 HTML 中。

```js
const book = window.startArchiveBook(document.getElementById("notebook"), {
  cover: {
    emblem: "✧",
    eyebrow: "O B S E R V A T I O N S",
    title: ["夜空", "观测手册"],
    subtitle: "N I G H T   S K Y",
    footer: "Vol. II",
  },
  pages: {
    left: { eyebrow: "观测笔记", heading: "星图", rows: ["方位", "高度角"] },
    right: { heading: "目标", rows: ["亮星", "星团"], footer: "现场记录" },
    under: { heading: "观测准备", rows: ["对焦", "校准"], checks: true },
  },
  materials: {
    cover: ["#435b72", "#263949", "#131f2a"],
    liner: ["#4b5f71", "#283544", "#192530"],
    binding: ["#293d50", "#182837", "#334959", "#455970"],
    foil: ["#526277", "#d9e3e6", "#b6c9d8", "#ecf3f8", "#6a859d"],
    halo: [108, 148, 184],
  },
});
const sheets = window.startArchiveSheets(document.getElementById("pages"), {
  count: 10,
  materials: { paper: [226, 236, 244], ink: [32, 55, 73] },
});

book.set("cover", 0);
book.set("cover", 1);
book.set("cover", 2);
book.set("sleep");
sheets.set(0);
sheets.set(1);
sheets.set(2);
sheets.sleep();
```

在播放器每次抵达一个段落时只调用对应的 `set`。上述连续调用用于说明接口，演出时由观众翻页触发各段。

## 书册

- `set("cover", 0|1|2)` 依次呈现闭合、展开、翻过一张纸。用 `set("close", 0|1)` 开始收尾并合上书。
- 离开道具场景时用 `set("sleep")` 停止动画循环，然后隐藏该画布。再入场前先显示画布。`resize()` 手动同步尺寸，`dispose()` 取消绘制并解除尺寸侦听。
- `cover.title` 可给一个字符串或最多三行的数组。其余封面字段为字符串。页面支持 `eyebrow`、`heading`、`rows`（至多十三行字符串）、`footer` 和 `checks`。
- `materials.cover`、`liner`、`left`、`right`、`under` 各为三个 CSS 颜色，由亮至暗。`foil` 为五个箔片渐变颜色。`binding` 和 `edges` 各为四个边缘颜色，顺序为远端、外侧、近端和书脊。`ink`、`accent`、`rule` 为 CSS 颜色，`halo` 为 RGB 数组。
- 若已有设计图，可以传入 `textures.cover`、`liner`、`left`、`right` 或 `under`，值为加载完成的图片、位图或 Canvas。自绘图片会覆盖对应面的文字与底材；提供 610×860 纵向图片效果最佳。打包离线 HTML 时使用内嵌资源。

## 散页

- `set(0|1|2)` 依次呈现漂浮、展开成扇形和收成一叠。调用 `sleep()` 停止循环。画布显示或容器尺寸变化后调用 `resize()`。
- `count` 支持 1–24 张，默认为 13 张。`duration` 是相邻姿态之间的过渡秒数，支持 0.14–8 秒。`materials.paper`、`ink`、`stamp` 和 `shadow` 都采用 RGB 数组。
- `decorate(context, point, { index, front })` 可替换默认印刷线条。回调在每张纸的裁剪区内执行，`point(u, v)` 将纸面 0–1 之间的坐标投影成画布 `{x, y, z}`，可用它画可随旋转弯曲的线条，从 `front` 区分纸张正反面。

开启系统减少动态效果时，两个道具直接绘制目标姿态。可在浏览器检查逐段动作、窄屏构图及离场后循环取消。
