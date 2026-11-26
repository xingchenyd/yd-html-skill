# yd-html-skill

把研究、课程或方案做成**电影感的动态网页演示**。用空间、材质和动作讲内容，每讲到一步，观众看到的画面就发生一次有意义的变化。成品可以是一个可离线播放的 HTML 文件。

## 动效预览

![浏览器实录。蓝色记录册展开并翻页，散页在空中展开，水量分配图随选项变化。](examples/preview.gif)

样例《屋顶上的 100 升雨水》使用虚构数字，展示**透视翻页、纸张堆叠、分拍揭示和交互图表**。图中录的是 HTML 在 Chromium 内的实际运行过程。下载示例文件后，用浏览器打开并按 **→** 逐拍体验。 [单文件 HTML 示例](https://raw.githubusercontent.com/xingchenyd/yd-html-skill/main/examples/roofwater.html)

## 安装与使用

将仓库克隆到 Codex 的个人技能目录。以下命令使用默认位置。设置过 `CODEX_HOME` 时，使用其中的 `skills` 目录。

**Windows PowerShell**

```powershell
git clone https://github.com/xingchenyd/yd-html-skill.git "$env:USERPROFILE/.codex/skills/yd-html-skill"
```

**macOS / Linux**

```sh
git clone https://github.com/xingchenyd/yd-html-skill.git ~/.codex/skills/yd-html-skill
```

在 Codex 新对话中调用 `$yd-html-skill`。例如：

> 用 $yd-html-skill 把这些资料做成一份 8 分钟的离线 HTML 演示。用适合研究题目的场景和道具，核心结果随讲述分三拍出现，附逐页讲稿。

主题、配色、场景、道具和页数随内容设计。样例使用青蓝雨水记录册，书本和散页是可以替换的道具。研究可以从记录、图表与证据出发，工程可以从机件、负载或轨迹出发。

| 所需内容 | 入口 |
|---|---|
| 从参考演示提炼镜头、动作和节奏 | [分镜与视觉编排](references/storyboard.md) |
| 改写一页、配置节拍、打包为单文件 | [运行与改造](references/runtime.md) |
| 复用透视书本、曲面纸页和飞散纸层 | [实时道具接口](references/motion.md) |
| 快速起步 | [HTML、CSS、JavaScript 工程](assets/starter/) |

## 本地跑样例

在仓库目录执行以下命令，再打开生成的 `roofwater.html`。打包器使用 Python 3.9 及以上版本和标准库。

```sh
python -X utf8 scripts/pack.py roofwater.html
```

**← / →** 逐拍，**↑ / ↓** 跳页，**Esc** 查看目录，**N** 打开讲稿，**F** 切换全屏，**R** 重播本页。支持点击和触屏手势。

可选的浏览器检查使用 Python 3.10 及以上版本，支持离线请求、错误、键盘节拍、触屏、减少动态效果和分帧截图。将 `--output` 指向验收图目录。加 `--montage` 可另导出总览图。

```sh
python -m pip install playwright pillow
python -m playwright install chromium
python scripts/check_deck.py roofwater.html --output qa --montage
```
