# Xiaoying Ye｜单页作品集

这是 Xiaoying Ye 作品集的原生静态单页版本，不依赖 Wix、框架、在线字体、CDN、分析脚本或外部运行时。页面结构为：Hero → Animation → Seasonal Posters → Other Works + 极简页脚。

## 页面与导航

- 根页面 `index.html` 是唯一可见作品集页面。
- 导航只保留 `HOME` 与 `WORK`；`WORK` 指向 `#animation`，旧锚点 `#selected-motion` 会兼容跳转到 `#animation`。
- 页面采用四个同一视口内绝对叠放的 panel：`Hero → Animation → Seasonal Posters → Other Works + Footer`，不使用整屏纵向 track 滚动。支持 `document.startViewTransition()` 时使用约 760ms 的水墨幕布、朱砂线扫过和 80/150/220ms 内容错时；不支持时使用同构的 `clip-path`/opacity fallback，减少动画时仅保留不超过 100ms 的淡入。鼠标滚轮、键盘方向键/Home/End/PageUp/PageDown 和页面上的切换按钮都会逐屏切换。手机触摸仅在纵向占优且 `abs(deltaY) >= 40px`、`abs(deltaY) >= abs(deltaX) * 1.2` 时切一屏；Seasonal/Other/Animation rail 保留原生横向触摸滚动，不用全局 `touchmove` 粗暴拦截。
- `Seasonal Posters` 位于 `#seasonal-posters`，`Other Works` 位于 `#other-works`，末页按钮为 `BACK TO TOP`。
- 页脚仅包含 `yxyjoyce@qq.com`、`BACK TO TOP` 与 `© 2021 by Xiaoying Ye.`。
- `additional-works/index.html` 相对路径跳转到 `../index.html#other-works`；`about/index.html` 与 `contact/index.html` 相对路径跳转到 `../index.html#home`，兼容旧链接及 `file://` 直接打开。

## 直接打开和本机服务

直接双击项目根目录的 `index.html` 即可离线查看；页面使用项目内相对路径，不需要安装依赖。若需让同一局域网的手机或电脑访问，可运行：

```powershell
node server.mjs
```

服务器默认监听 `0.0.0.0:4173`，也可通过 `PORT` 调整。服务器只提供项目公开的 `GET`、`HEAD` 和视频 Range 读取，不提供上传、表单提交或目录遍历，也不会自动修改 Windows 防火墙。

## 作品与媒体

作品数据统一维护在 `data/works.js`，由 `scripts/site.js` 渲染：

- `motion`：五部主动画，单个主播放器支持切换、播放/暂停、拖动进度和重播。
- `otherWorks`：四件现有平面/插画素材，桌面采用不对称编排，手机自然单列；图片保持完整比例，不裁切主体。
- `seasonal`：惊蛰、大暑、立秋、处暑、白露五部节气动画，横向 snap；进入视口才播放，离开视口暂停，`prefers-reduced-motion` 时仅显示首帧。

五个节气 GIF 来自已授权的只读路径 `E:\BaiduSyncdisk\集团\1.媒体宣传\节气海报\...`，源文件未修改。派生文件位于 `assets/seasonal/`，使用 ASCII 名称 `solar-jingzhe`、`solar-dashu`、`solar-liqiu`、`solar-chushu`、`solar-bailu`，编码为无音频 H.264 `yuv420p`、`faststart` MP4，并提取同名 PNG 首帧海报。每个 MP4 均不超过 25 MiB，最长边不超过 1080px；当前最大文件约 11.91 MiB。

Hero 背景使用用户确认效果图提取的 ImageGen 成品 `assets/images/hero-rendered-background-v1.png`（1777×885），不再引用旧 `hero-f26-background.png` 透明增强图或旧精卫矩形截图。成品背景直接以 `object-fit: cover` 显示，桌面完整宽幅覆盖，手机以 `object-position: 62% center` 保证主峰可见；不再使用 `multiply`、mask 或明显 blur 重构山形。页面暖米白基准保持为 `#f4efe5`，项目中的原始 GIF、`E:\作品` 素材与旧 F26 派生 PNG 均保留但不写回/不引用。
Animation 手机端按“标题 → 16:9 播放器 → 紧凑信息 → 缩略图 rail”排布，完整介绍通过原生底部 `dialog` 抽屉查看；Seasonal 桌面约三张完整卡片加下一张露边，手机卡片约 82vw；Other Works 手机卡片约 84vw。桌面窄高度使用 `max-height: 760px` 紧凑规则，末屏页脚与切换按钮各自占位，避免覆盖。
HTML 为变更后的 CSS 与 Hero 派生 PNG 使用版本查询参数主动绕过旧缓存；本轮 JavaScript 版本同步更新为 `?v=20260831-7`。

## GitHub Pages 发布副本

`github-pages/` 是与根页面同步的独立发布副本，并保留自己的 `.git`。它包含单页 HTML、共享数据/脚本/样式、字体、图片和节气派生媒体；不包含项目规则、检查点、测试、服务脚本或源目录。同步本地副本不会自动提交、推送或部署。

## 本轮调研依据

- [MDN opacity](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/opacity)：用于叠放 panel 的淡入淡出层；透明度不改变布局，因此与绝对定位切换配合。
- [MDN CSS 与 JavaScript 无障碍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/CSS_and_JavaScript)：panel 切换同步 `aria-hidden`、`inert` 与焦点，避免隐藏内容继续进入辅助技术和键盘顺序。
- [MDN wheel 事件](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event)：滚轮监听按垂直方向逐屏切换，并只在需要时取消默认行为；作品 rail 保留原生横向滚动。
- [MDN Scrollbars styling](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scrollbars_styling)：Seasonal/Other 使用原生 `overflow-x: auto` 滚动条，并以红色 thumb 和灰色 track 保持可见对比。
- [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) 与 [view-transition-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-name)：用于同文档 panel 切换的渐进增强和稳定 header/switcher 快照命名。
- [Codrops 2025 Portfolio Case Study](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/) 与 [Codrops Vanilla JS Layered Reveal](https://tympanus.net/codrops/2026/02/26/building-async-page-transitions-in-vanilla-javascript/)：参考分层 reveal、内容错时和幕布式过渡；实现仍保持原生 CSS/JS。

采用原生 View Transition + CSS fallback，不采用 GSAP/WebGL：本项目不需要持续 3D 场景或大型时间轴库，原生方案可离线运行、减少包体与运行时依赖，并在不支持新 API 的浏览器中保留同样的导航和无障碍状态。

## 验证

```powershell
node --check server.mjs
node --check data/works.js
node --check scripts/site.js
node --check tests/smoke.mjs
node tests/smoke.mjs
```

Smoke 覆盖四屏顺序/锚点、`ANIMATION` 与 `动效海报` 标题、旧锚点兼容、无整屏 track `translateY`/`translate3d`、description 无 clamp/ellipsis 截断、相对资源、五部主动画、五部节气 MP4 的元数据/大小/无音频标记、Range/HEAD、方法限制、私有路径 403、路径遍历、代码资源缓存策略，以及 Seasonal/Other 横向 rail 的可滑动静态结构。浏览器回归还应检查 `2560×1271`、`1363×747`、`1363×691`、`1024×600` 桌面和 `390×844`、`393×852`、`360×800` 手机视口、panel 原地切换、播放器交互、节气离屏暂停、详情 dialog、键盘焦点、普通区域上下滑、rail 区域上下滑/左右滑和无文档横向溢出。绿色 `7 Files / MP4 File` 悬浮条属于浏览器扩展注入，不属于站点渲染内容。
