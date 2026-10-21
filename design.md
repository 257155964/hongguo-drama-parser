<!-- miaoda-design-guide: managed preset=minimal-jade -->
---
version: alpha
name: minimal-jade
name_zh: 简约翡翠
description: 浅灰蓝底、独立白卡与草绿强调；首要图表序列用草绿，次级序列按黑色透明度递减；无衬线超大粗标题，JetBrains Mono 对齐指标和表格数字；12px 圆角卡片带浅阴影和悬停上浮。
colors:
  background: "#F5F7FA"
  card: "#FFFFFF"
  header: "#1D2025"
  foreground: "#1D2025"
  muted-foreground: "#6B7280"
  primary: "#A0E870"
  primaryDark: "#7BC44C"
  border: "#E5E7EB"
  danger: "#EF4444"
typography:
  sans:
    fontFamily: "Inter, system-ui, sans-serif"
    usage: 全部标题与正文(Heading/Body 共用,靠字号/字重区分层级)
  mono:
    fontFamily: '"JetBrains Mono", monospace'
    usage: 全部数字与坐标轴/图例文字,配 tabular-nums 保证对齐
rounded:
  card: 12px
  small: 8px
  tag: 4px
  full: 9999px
spacing:
  section-gap: 40px
  card-gap: 24px
  card-padding: 24px
  page-px: 24px
  page-py: 48px
  container-max: 1300px
components:
  kpi-card:
    background: "{colors.card}"
    borderRadius: "{rounded.card}"
    boxShadow: shadow-sm
    border: "border border-transparent hover:border-gray-100"
    hover: "整体上浮 y:-2px(-translate-y-0.5),带过渡"
    iconBg: "{colors.primary} 10% 透明度"
    iconColor: "{colors.primary}"
    title: "text-sm uppercase tracking-wide,{colors.muted-foreground}"
    value: "text-3xl font-bold tracking-tighter tabular-nums,{colors.foreground}(见 typography.mono)"
    trendUp: "text-xs font-medium,{colors.primaryDark},带上箭头图标"
    trendDown: "text-xs font-medium,{colors.danger},带下箭头图标"
    statusDot: "若需要状态指示点,只能二选一:{colors.primary}(正常)或 {colors.danger}(异常),禁止新增第三种颜色(如橙色)表达'预警/中等'档位"
  chart-card:
    background: "{colors.card}"
    borderRadius: "{rounded.card}"
    boxShadow: shadow-sm
    border: "border border-transparent"
    height: "420px 或 450px 两档"
    title: "font-semibold,{colors.header}"
    tag: "text-xs,{colors.muted-foreground},bg-gray-50 底,{rounded.tag},px-2 py-1"
  ai-insight-card:
    accentBar: "w-1 h-4,{colors.primary} 实色,{rounded.full}"
    title: 与卡片标题样式一致
  status-badge:
    description: "适用于任意'状态/预警/优先级'类徽章、标签芯片、指示点(如渠道明细表状态列、异常指标监控卡片、AI洞察优先级标签)。只允许二档语义:{colors.primary}(正常/健康/低优先级)与 {colors.danger}(异常/预警/高优先级);其余非语义标签(如团队名、分类名)一律用中性灰(bg-gray-50 + {colors.muted-foreground})。禁止引入橙色/黄色/蓝色等表达'中等/三级'档位——多档状态一律压缩为二档"
  charts:
    palette: "单主色 {colors.primary}(首位/主序列);排名类用黑色透明度递减 getRankedColor: index0={colors.primary},index≥1 为 rgba(0,0,0,opacity),opacity=max(0.1,0.9-(index-1)*0.15)"
    multi-series-fallback: "不论是否为'排名'语义,任何图表只要出现多个系列/类别需要区分(趋势线多指标对比、分组柱状图例、饼图多切片等),一律套用同一取色逻辑:首要/主体系列用 {colors.primary},其余系列全部用黑色透明度渐变(同 getRankedColor 公式)或灰阶({colors.muted-foreground}/{colors.border} 系),禁止为区分类别另起色相(黄/橙/蓝等)。这条优先于'排名'字面语义,是本风格图表配色的唯一兜底方案"
    container: "背景 transparent(继承卡片白底),grid 四边留白 top10/right10/bottom0/left0,containLabel true,字体见 typography.mono"
    tooltip: "白底 #fff,1px 边框 {colors.border},{rounded.small},padding 12px,文字纯黑 12px"
    axis: "轴线与刻度隐藏,标签灰 400 系(#9CA3AF)11px;y 轴分隔线浅灰虚线({colors.border} 系),x 轴无分隔线"
    legend: "icon=circle,size 8px,文字{colors.muted-foreground} 色,12px;图例本身不额外引入颜色,系列配色遵循 palette/multi-series-fallback"
    area: "smooth 曲线,线宽 3px,symbol 4px,区域渐变填充(顶部 5% 处 opacity 0.3 → 底部 95% 处 opacity 0)"
    pie: "环形 radius 60%~80%,padAngle 2,无 label,itemStyle 无描边"
    radar: "线宽 2px,填充透明度 0.4"
    bar-horizontal: "barSize 20px,仅右侧圆角 borderRadius [0,4,4,0]"
anchors:
  - id: mono-numbers
    type: token
    desc: 所有 KPI 数值/趋势数字用等宽字体(见 typography.mono)+tabular-nums 对齐,是本风格最强识别符
  - id: single-accent-jade
    type: token
    desc: 全局仅一个强调色(见 colors.primary),图标/图表/装饰条/状态徽章统一复用,不叠加其他鲜艳色
  - id: ranked-gradient
    type: pattern
    desc: 图表排名类数据用黑色透明度递减渐变区分名次(见 components.charts),仅第一名保留主色;非排名类多系列图表同样套用此逻辑
  - id: card-float-hover
    type: pattern
    desc: 卡片默认透明边框+浅阴影,hover 时整体上浮并边框转浅灰(见 Elevation & Depth)
  - id: giant-title
    type: token
    desc: 页面主标题使用极大字号建立层级(见 typography 页面标题层级)
  - id: kpi-icon-tint
    type: component
    desc: KPI 卡片图标底色为主色的低透明度版本,图标本身为主色实色
  - id: gray-blue-canvas
    type: token
    desc: 页面底色为浅灰蓝(见 colors.background),卡片底为纯白(见 colors.card)形成层次
gaps:
  - header/foreground/muted-foreground/border 四个 token 的 hex 由源给出的 hsl(H S% L%) 精确换算得出(非取整近似);background/primary/primaryDark 三色源已直接给出 hex,按源 hex 原样使用
  - danger(下降趋势色)为补充项:源仅写"下降 red-500"(Tailwind 类名,无具体 hex),按 Tailwind 官方默认值换算为 #EF4444
  - 字体 @import 地址为补充项:源仅给出字体名(Inter/JetBrains Mono),未提供具体 @import URL,按 Google Fonts 官方 CSS2 API 标准格式补充,字重档位(400/500/600/700)为常见档推测
  - rounded 四档(card/small/tag/full)为补充项:源仅给出 Tailwind 类名(rounded-xl/rounded-lg/rounded/rounded-full),未给具体 px,按 Tailwind 官方默认值换算
  - Inter/JetBrains Mono 均为纯拉丁字体无 CJK 字形,源未指定中文兜底(非手写/展示体清单成员,非强制规则,原样保留)
  - 图表容器高度源给两档(420px/450px),未说明各自适用图表类型,原样列出未做区分
  - 无暗色模式定义
  - 无表单控件(input/select 等)规范
  - 无漏斗(funnel)组件规范:第一版实验中生成模型曾自行加入转化漏斗组件并出现数字与标签重叠的排版问题,该组件超出本风格源文件定义范围,不在此补造具体规格(避免编造),仅在 Do's and Don'ts 提示自查
exceptions:
  - 图标背景使用 primary 10% 透明度作浅底,不受"仅一个强调色、不额外引入强调色"限制,属常规图标底色处理
  - AI 洞察卡片左侧装饰条使用 primary 实色,视为组件签名而非额外强调色
  - 卡片默认 border-transparent,hover 时转浅灰 border-gray-100,不受阴影/圆角统一约束(边框颜色变化例外)
  - 元数据标签与小徽章允许使用 rounded/rounded-lg(见 rounded.tag/small)而非卡片档 rounded.card
---

## Overview

简洁商务数据界面风格。浅灰蓝({colors.background})基底上浮动纯白卡片({colors.card})，用克制留白和清晰数据层级组织内容。整体气质专业、可信赖、数据驱动;色彩极简,仅一个草绿主色({colors.primary})贯穿全局,数字均用等宽字体保证对齐,图表以黑色透明度渐变而非多彩配色表达排名优先级。

## Colors

| 角色 | 值 | 用法 |
|-----|-----|-----|
| background | {colors.background} | 页面背景,浅灰蓝 |
| card | {colors.card} | 卡片背景,纯白 |
| header | {colors.header} | 页面/卡片标题文字 |
| foreground | {colors.foreground} | 主要文字、KPI 数值 |
| muted-foreground | {colors.muted-foreground} | 次要文字、副标题、KPI 标题、坐标轴与图例文字、元数据标签 |
| primary | {colors.primary} | 全局唯一强调色:图标、图表主序列、装饰条、状态徽章"正常"档;每处强调仅用此色 |
| primaryDark | {colors.primaryDark} | 深绿强调:趋势上升数值与箭头 |
| border | {colors.border} | 卡片 hover 边框、图表容器分隔线/Tooltip 边框 |
| danger | {colors.danger} | 趋势下降数值与箭头、状态徽章"异常/预警"档(补充项,见 gaps) |

## Typography

全局样式首行按以下方式加载字体(HARD REQUIREMENT,禁止替换;源未提供具体 @import 地址,此行为补充项,按 Google Fonts 官方 CSS2 API 标准格式生成,见 gaps):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

Inter/JetBrains Mono 均为纯拉丁字体,源未要求 CJK 兜底(非手写/展示体,原样保留)。

| 层级 | 样式(Tailwind) | 颜色 |
|-----|-----|-----|
| 页面标题 | text-5xl md:text-6xl font-bold tracking-tight | header |
| 页面副标题 | text-base tracking-wide | muted-foreground |
| 卡片标题 | font-semibold | header |
| KPI 标题 | text-sm uppercase tracking-wide | muted-foreground |
| KPI 数值 | text-3xl font-bold font-mono tracking-tighter tabular-nums | foreground |
| 趋势数字(上升) | text-xs font-medium font-mono | primaryDark |
| 趋势数字(下降) | text-xs font-medium font-mono | danger |

## Layout

- 全局容器:max-w-[1300px](见 spacing.container-max),mx-auto,px-6(见 spacing.page-px);区块间距 space-y-10(见 spacing.section-gap 40px);页面上下 padding pt-12/pb-12(见 spacing.page-py 48px)。
- 标题区:border-b border-gray-200/60(~{colors.border} 60% 透明度) pb-6;页面标题建立层级,副标题 {colors.muted-foreground};元数据标签 text-[10px] uppercase tracking-widest,灰 400 系(#9CA3AF)。
- 标题、指标、图表、表格或操作模块按任务关系组合；不固定出现顺序、卡片数量或 2/3+1/3 分栏。
- 网格间距 gap-6(见 spacing.card-gap 24px);卡片内边距 p-6(见 spacing.card-padding 24px)。
- 响应式按可用宽度和信息关系减少列数，窄屏保证数值、图例和操作完整可读。

## Elevation & Depth

- 卡片阴影统一 shadow-sm,不叠加更强档位;默认边框 border-transparent,hover 转 border-gray-100(浅灰,~{colors.border} 系)。
- Hover 交互:卡片整体上浮 y:-2px(配 motion 过渡),边框由透明变浅灰;不使用缩放/旋转/更强投影。
- 层次感仅来自"卡片白底 + 浅阴影 + hover 微浮动",无多层堆叠或渐变阴影。

## Shapes

- 圆角三档(见 frontmatter rounded):卡片用 {rounded.card}(12px);按钮/小元素用 {rounded.small}(8px)或 {rounded.tag}(4px);圆形装饰用 {rounded.full}(9999px,如 AI 洞察卡片装饰条端点)。
- 边框语言:卡片默认 transparent,hover 转浅灰({colors.border});图表容器同样 transparent;标签徽章 bg-gray-50 无边框。
- 无手绘/有机形态,无阴影模糊之外的装饰纹理;视觉极简,靠留白与色块层级表达信息密度。

## Components

核心组件规格见 frontmatter components(kpi-card / chart-card / ai-insight-card / status-badge / charts)。补充细节:

- **KPI 卡片**:标题(KPI 名)居上,数值居中放大,趋势行(上下箭头+涨跌幅)居底;图标底色为 primary 10% 透明度,图标本身 primary 实色;hover 整体上浮。若卡片带状态指示点,只能用 primary 或 danger 二色(见 components.kpi-card.statusDot)。
- **图表卡片**:标题 font-semibold + 可选灰底小标签;容器高度按数据量和可用空间确定;内部 ECharts 网格保持克制留白(见 components.charts.container)。
- **AI 洞察卡片**:左侧竖条(w-1 h-4,primary 实色,rounded-full)+ 标题,内容排版与普通卡片一致,用于突出"AI 生成建议"类文本块。
- **状态徽章/标签/优先级标签**(如渠道明细表状态列、异常指标监控、AI洞察优先级标签):只允许 primary(正常/健康/低优先级)与 danger(异常/预警/高优先级)二档语义色,非语义标签(团队名、分类名)用中性灰底(bg-gray-50 + muted-foreground)。**不得为表达"中等/三级"档位新增橙色、黄色等本风格未声明的色相**(见 components.status-badge)。
- **图表(ECharts)**:序列色单主色 + 排名渐变(见 components.charts.palette);不论图表是否为"排名"语义,只要存在多系列/多类别对比,一律套用同一取色逻辑——主体系列 primary,其余系列黑色渐变或灰阶,禁止引入新色相区分类别(见 components.charts.multi-series-fallback);面积图/饼图/雷达/横向柱状各自默认样式见 components.charts;坐标轴线与刻度隐藏,只留浅色虚线网格,弱化图表"骨架"、突出数据本身。
- 本风格未定义漏斗(funnel)等组件的具体排版规格(见 gaps);若页面确需该类组件,配色仍须遵守单一强调色规则,不因组件未定义而自由发挥新色相。

## Do's and Don'ts

- 数字与数据统一用等宽字体(JetBrains Mono)+ tabular-nums,确保多行/多列对齐。
- 图表优先用排名渐变色系统(getRankedColor)表达数据优先级,而非分配多种颜色;非排名类的多系列图表同样只用 primary + 黑色渐变/灰阶,不新增色相。
- 卡片 hover 时加入轻微上浮(y:-2)增强交互感,避免更强的缩放/旋转效果。
- 标题区适合使用极大字号(text-5xl/6xl)建立视觉层级,正文与标签保持克制的小字号。
- 图表整体配色保持克制,避免过度丰富的色彩,优先单主色 + 黑色渐变的组合。
- 状态徽章、优先级标签、指示圆点、图例等任何"需要区分状态/类别"的元素,一律复用 primary/primaryDark/danger 三色 + 灰阶;禁止为"预警/中优先级/第三分类"等语义临时新增颜色(如橙色、黄色、蓝色)——多档状态一律压缩为二档表达。

## Hard Rules

- KPI 数值与趋势数字必须使用等宽字体(见 typography.mono)+ tabular-nums,禁止用默认无衬线字体渲染数字。
- 图表与界面强调色统一使用单一主色 primary({colors.primary}),排名/次序数据用黑色透明度渐变区分层级,禁止引入除 primaryDark/danger 语义色外的其他强调色。**该约束覆盖界面全部元素,不限于图表**:状态徽章、优先级标签、指示圆点、Tab/Chip、图表图例等任何用于区分状态或类别的地方,只能从 primary/primaryDark/danger + 灰阶(muted-foreground/border/#9CA3AF)中取色,禁止新增任何未在 colors 中声明的色相(橙色/黄色/蓝色等)表达"预警/中优先级/第三档状态"——多档状态一律压缩为二档(如"异常/预警"统一用 danger,"正常/健康/低优先级"统一用 primary)。
- 任意图表出现多个系列/类别需要区分时(不论是否为"排名"语义:趋势线多指标对比、分组柱状图例、饼图多切片等),一律套用同一取色逻辑——首要/主体系列用 primary,其余系列全部用黑色透明度渐变(getRankedColor 公式)或灰阶,不得为区分类别另起色相。
- 所有卡片圆角统一 {rounded.card},阴影统一 shadow-sm,不使用更强阴影或其他圆角档位。
- 页面主标题可在 text-5xl md:text-6xl 范围建立强层级；空间不足或信息密集时允许自适应缩放。
- 语义色 primaryDark/danger 仅用于趋势方向指示(涨跌箭头与数值)及状态徽章的"正常/异常"二元判断,不作为装饰、多级优先级或跨场景强调色。
- 字体 @import 必须原样写入全局样式首行,禁止替换或省略。

## Exceptions

- 图标背景使用 primary 10% 透明度作浅底,不受"仅一个强调色、不额外引入强调色"限制,属常规图标底色处理。
- AI 洞察卡片左侧装饰条使用 primary 实色,视为组件签名而非额外强调色。
- 卡片默认 border-transparent,hover 时转浅灰 border-gray-100,不受阴影/圆角统一约束(边框颜色变化例外)。
- 元数据标签与小徽章允许使用 {rounded.tag}/{rounded.small} 而非卡片档 {rounded.card}。
