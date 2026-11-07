# Changelog

## [1.2.0] - 2026-11-07

### Added

- 表格视口虚拟滚动（`renderViewport`）：按前缀和行高偏移仅挂载当前视口及缓冲区的宝可梦行，加工台默认挂载 DOM 节点数从 21,686 降至 1,247（渲染行数从 895 降至 40）。
- 启动期静态预计算：预计算各工作站可选配方集合、宝可梦属性集合、形态分类、特殊标签位掩码与多语言小写搜索索引。
- 分级计算与缓存：将 `currentRows()` 拆分为筛选计算缓存与排序缓存，复用 `Intl.Collator` 实例，并按语言缓存属性标签与形态徽章 HTML。
- 数值等宽字体栈 `--mono`：排名、能力值、速度倍率、期望产出与综合评分统一使用等宽数字排版。
- 浏览器内数据导入（`import.html`）：当前固定支持整合包 `1.1.4-SSV4.1.5A`，页面提供该版本的 CurseForge 下载链接；解析 `manifest.json` 后给出两个所需模组的 CurseForge 下载链接；玩家把整合包 zip 和两个 jar 拖入页面即可在本地生成数据。其他整合包版本会被拒绝，避免使用未验证的 `station-rules.js` 规则。
- `assets/browser-zip.js`：浏览器端 ZIP/JAR 读取器，使用原生 `DecompressionStream`，只解压需要的条目。
- `assets/import-pack.js`：浏览器端解析物种、形态、语言文件和 Farmers 工作站描述，生成与同步脚本一致的数据结构。
- 导入结果存入 `localStorage` 的 `sunlit.imported`；导入数据优先于仓库内的回退数据。玩家不需要安装 Node。
- 导入页支持 i18n（英语 / 中文 / 韩语），使用 `data/lang.js` 的 UI 语言包。
- 读取到两个模组后只显示一个“下载两个模组”按钮，不再为每个模组分列独立下载按钮。

### Changed

- 行展开交互改为原地插入与移除 `<tr class="expandrow">`，不再触发整表重绘。
- 列显隐控制改为切换 `<table>` 的 `hide-multStat`、`hide-prod`、`hide-range` 样式类，替代逐单元格 `querySelectorAll("[data-col]")` 遍历。
- 属性标签栏与配方类型标签栏改为事件委托，仅在工作站、属性或语言变化时重建按钮 DOM。
- 搜索框输入增加 120ms 防抖，`history.replaceState` 仅在查询字符串变化时写入。
- 界面色板与主题变量重构：收敛为亮色与暗色语义 CSS 变量，统一卡片、表头、边框、徽章与阴影定义。
- 工作站切换栏改为一体式分段控制器，筛选项从胶囊圆角改为 6px 小圆角标签，统一激活态配色。
- 模拟参数行（等级、个体值（IV）、努力值（EV）、性格修正、闪光）改为 `<label class="field">` 组合，与属性行、显示行首列左轴对齐。
- 行展开详情区改为三栏分割面板与结构化培养建议区（优先提升属性、每点能力值收益、推荐性格、培养顺序、个体值（IV）、努力值（EV））。
- `index.html` 根据是否已有导入数据跳转到 `best-worker.html` 或 `import.html`；查询页右上角新增“导入数据”入口。
- 导入页明确标注：本站不托管、不分发游戏文件，下载链接指向 CurseForge 官方 CDN，文件只在玩家浏览器本地解析。
- 普通访问不再自动加载随仓库的游戏数据；仅在本地开发时用 `?bundled=1` 加载本地回退数据。从游戏文件生成的数据已加入 `.gitignore`，公开仓库只保留 UI 语言包。
- 项目统一命名为 **Sunlit Cobblemon · Best Worker**；仓库名/包名为 `sunlit-cobblemon-best-worker`，发布包名同步调整。
- 内部命名空间、翻译键、`localStorage` 键、全局变量和语言文件目录统一改为 `ssc_bw`。
- `README.md` 精简为中文 GitHub 首页，新增 `README.en.md` 英文版和语言切换链接；详细使用/部署说明迁移到独立文档，开发辅助文档不进入发布包。
- README 顶部新增 GitHub Pages 在线使用按钮；中英文 README 的声明统一为“非官方粉丝工具、不向整合包/模组社区提交问题、不托管游戏文件”。
- 发布包同步包含中英文 README，不包含开发辅助文档。

### Fixed

- 移除排名列（`#`）表头无效的 `sortable` 样式类与排序箭头。
- 修复行展开时主行与详情面板左侧出现双层错位蓝边的问题。
- 消除切换工作站与筛选时先写 DOM 再读布局引发的同步二次回流。
- 将 `scripts/station-rules.mjs` 改为 `scripts/station-rules.js`，避免 GitHub Pages/静态服务器对 `.mjs` MIME 处理不一致导致导入模块加载失败。
- `import.html` 不再请求 CFWidget 的整合包版本列表，固定显示 `1.1.4-SSV4.1.5A`；导入其他版本会给出“当前只支持该版本”的错误，并显示脚本加载失败诊断提示。

### Removed

- 移除 42 行硬编码的 `html[data-theme="dark"]` 选择器覆盖规则，全部合并至 `:root` 与 `html[data-theme="dark"]` 变量表。

## [1.1.0] - 2026-11-07（暂定）

### Added

- 站点 i18n 系统：所有 UI 文案改为翻译键，语言文件放在 `assets/ssc_bw/lang/`。
- 右上角语言切换，默认英语；选择写入 `localStorage`，支持 `?lang=ko` 等 URL 参数。
- 韩语支持：新增 `ko_kr.json`，工作站、职能、描述使用 Cobblemon Farmers 官方韩语文本；属性、能力值、性格使用 Cobblemon 官方韩语文本。
- 额外语言自动发现：在 `assets/ssc_bw/lang/` 放入 `<locale>.json` 后，运行 `npm run lang` 会自动加入语言列表；缺失 UI 键回退英文。
- 宝可梦名多语言数据由导入流程在本地生成。
- 特殊形态子类别筛选：地区形态、阿罗拉 / 伽勒尔 / 洗翠 / 帕底亚、超级进化、超极巨化、原始回归、霸主、其他形态；状态写入 URL。
- 形态命名统一：列表优先使用 Cobblemon 完整形态译名（如“超级电龙”“超级喷火龙X”）；Mega 类别改称“超级进化”；霸主形态不再显示 `Totem`。
- 亮色 / 暗色主题切换：默认跟随系统，选择写入 `localStorage`，支持 `?theme=dark|light`。
- 页脚站点说明：免责声明、数据来源、感谢名单、问题反馈。
- 数据来源链接：
  - Sunlit Cobblemon：<https://www.curseforge.com/minecraft/modpacks/society-sunlit-cobblemon>
  - Cobblemon：<https://gitlab.com/cable-mc/cobblemon/-/tree/main/common/src/main/resources/data/cobblemon/species?ref_type=heads>
- `scripts/languages.mjs`：默认语言列表和已知 locale 的显示名 / BCP47 标签。
- `scripts/build-lang.mjs`：校验 UI 语言键，生成 UI 语言包和本地宝可梦名数据。
- `npm run lang` 脚本。

### Changed

- 项目内部命名空间统一为当前 `ssc_bw` 命名体系：
  - `assets/ssc_bw`
  - 翻译键 `ssc_bw.*`
  - 全局变量 `SSC_BW_LANG` / `SSC_BW_LANGUAGES`
  - `localStorage` 键 `ssc_bw.lang` / `ssc_bw.theme`
- 默认语言范围收窄为英语、中文、韩语；其他语言改为“手动添加语言文件后自动启用”。
- 英文界面术语与 Cobblemon Farmers / Cobblemon 官方语言数据对齐，包括工作站、职能、描述、属性、能力值和性格。
- 非英语语言的宝可梦列表显示“本地语言名 + 英文名”；英语列表只显示英文名。
- 英文搜索框提示改为只提示英文名 / 物种 ID，不再提示中文名。
- 站点顶部标题和标签页名称调整：
  - 标签页：`Sunlit Cobblemon · Best Worker`
  - 页面标题：`Sunlit Cobblemon · Best Worker`
- 中文副标题改为：“列出所有能在工作站工作的宝可梦，并按实际工作站公式排序、筛选。”
- 同步脚本的宝可梦名来源改为优先读取站点自带语言文件。
- 桌面端取消 1320px 最大宽度，页面全宽展示；表格改为自适应宽度并收紧单元格间距，常见桌面宽度下不再出现横向滚动。
- 特殊形态、传说、幻兽、异兽、悖谬等标签移到宝可梦名称下方，减少名称列宽度。
- 速度倍率取消进度条，只显示 `×数值`。
- 没有产量乘区的配方从 `—` 改为显示“固定产出”，并增加说明 tooltip。
- 页脚数据来源改为直接写整合包名称和模组名称，不公开实现细节。
- 项目文档同步更新多语言、主题、构建产物和开发约定。

### Fixed

- 修复英文界面中 Actual Role 描述仍显示中文的问题。
- 修复英文宝可梦列表显示中文名的问题。
- 修复暗色主题下展开计算区边框仍为亮色的问题。
- 修复宝可梦形态名重复拼接基础名称的问题。
- 修复语言切换后主题按钮文案未重新翻译的问题。
- 修复列表纵向滚动条与卡片边框重叠的问题，滚动条现在位于列表边框外侧。

### Removed

- 移除临时支持的日语、德语、俄语、繁体中文等默认语言项；改为按语言文件手动启用。
- 从开发计划中移除“六项独立 IV / EV”方案，保持全局 IV / EV，避免增加界面噪音。

### Data Notes

- 钢系同时包含粗矿粉碎和锡罐回收（锡罐 → 黄铜硬币）；整合包把两者统一注册为 `steel` 的 `craft_station` 配方，页面统一显示为「粉碎粗矿」，没有单独的回收类型。
- 形态分类中 `Alola-Totem` 归入阿罗拉形态，`Busted-Totem` 归入霸主；两者不会重复出现在多个类别。
- 旧数据说明仍写着 31 IV，实际页面默认 0 IV，以 `DEFAULTS` 为准。

### Developer Notes

- 修改 UI 语言文件后运行：

```bash
npm run lang
```

生成：

```text
UI 语言包 + 启用语言列表
本地宝可梦名数据
```

- 语言回退规则：当前语言缺失的 UI 键回退英文；宝可梦名按对应本地语言文件加载。
- 同步数据：

```bash
node scripts/sync-data.mjs --modpack "<整合包路径>"
```

- 当前支持语言默认值：`en_us`、`zh_cn`、`ko_kr`。
- 站点为纯静态页面，生成的 JS 数据保证 `file://` 直接打开也能工作。

## [1.0.0] - 2026-11-06

### Added

- 初始版本：`Sunlit Cobblemon · Best Worker` 查询页。
- 纯 Node + 静态 HTML 架构，无数据库、无后端、无第三方 npm 依赖，不需要 `npm install`。
- 支持双击 `best-worker.html` 直接打开，也支持 `node scripts/serve.mjs` 本地服务器。
- 数据同步脚本：从 Sunlit Cobblemon 整合包读取物种、形态、语言文件、Cobblemon Farmers 工作站规则和 KubeJS 配方数据。
- 生成数据文件：站点数据与本地回退数据。
- 初始数据量：1025 个基础物种、312 个形态，共 1337 条宝可梦数据。
- 5 个工作站：
  - 加工台
  - 园艺站
  - 神秘矿井
  - 水晶球
  - 能量塔
- 工作站能力值映射：速度、产量、范围根据工作站和配方类型使用不同能力值。
- 加工台 / 神秘矿井支持配方类型区分，并按每个配方单独排序。
- 完整计算逻辑：
  - 能力值计算（等级、IV、EV、性格）
  - 速度倍率
  - 产量百分比与期望产出
  - 作用范围
  - 行动时间
  - 综合评分
- 页面筛选与交互：
  - 工作站切换
  - 宝可梦属性单选的标签
  - 实际职能与描述
  - 配方类型标签
  - 等级、IV、EV、性格、闪光
  - 特殊形态 / 传说 / 幻兽 / 异兽 / 悖谬显示标签
  - 中文名 / 英文名 / 物种 ID 搜索
  - 表头排序
  - 点击行展开乘区、范围、行动时间、评分、能力值 +1 收益、培养顺序和推荐性格
- 页面状态写入 URL 查询参数，并兼容旧链接参数。
- 默认模拟条件：Lv.100 / 0 IV / 0 EV / 勤奋（无修正）/ 非闪光。
- 项目文档。

### Data Notes

- 整合包装有 Create，矿石翻倍配方被禁用；钢系实际只保留「粉碎粗矿」。
- KubeJS 动态配方无法完全从静态文件获取，部分工作站规则和配方类型由 `scripts/station-rules.js` 手工维护。
- 修改 `station-rules.js` 后必须重新运行数据同步脚本。

### Known Limitations

- IV / EV 使用全局一个值，不是六项独立输入。
- 能量塔电池、水晶球宝石等外部加成未模拟。
- 没有自动化测试，只能通过浏览器手动检查。
- 页面为单文件 HTML + 内联 CSS/JS，尚未拆分组件。
