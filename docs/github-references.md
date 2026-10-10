# GitHub 同类工作台参考与本次改进

于 2026-10-03 检查三个公开仓库的 README 和实际源码。本次参考功能设计，未复制第三方实现代码，也未将它们的服务或依赖安装进 CreatorOS。以下链接固定到实际检出的提交，避免将后续变化当成本次证据。

| 项目                                                                  | 本次看到的实现                                                  | CreatorOS 的落地改进                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [ContentFlow](https://github.com/liuxingqitd/content-flow)            | 当前稿件与页面上下文、关联内容、阶段和发布检查、本地稿件管理    | 保留选题→脚本→制作→发布的流水线；增加关联待办、发布检查、编辑草稿恢复；助手参考当前作品          |
| [Easel](https://github.com/ZJU-REAL/Easel)                            | 六维 Creator Profile；视频脚本按 Hook、时段、画面、caption 组织 | 增加创作边界与可复用经验；将稿件组织为 Hook、正文、CTA、分镜、资料与发布文案，并共同进入创作简报 |
| [Content Dashboard](https://github.com/tenfoldmarc/content-dashboard) | 统一创作者语气、发布队列按时间排序、日期选择器显示已有安排      | 简报复用档案；日历跟随当前日期、支持具体时间、当天列表按时间排序、检测同平台同时间冲突           |

## 源码证据

- ContentFlow：提交 [`6b809166`](https://github.com/liuxingqitd/content-flow/tree/6b8091669ea538e4604b4d1c6384dead5ea512a7)
  - [CopilotBridge.tsx](https://github.com/liuxingqitd/content-flow/blob/6b8091669ea538e4604b4d1c6384dead5ea512a7/src/copilot/CopilotBridge.tsx)：页面与稿件上下文、工具与待确认操作。
  - [PublishChecklistDialog.tsx](https://github.com/liuxingqitd/content-flow/blob/6b8091669ea538e4604b4d1c6384dead5ea512a7/src/pages/Kanban/PublishChecklistDialog.tsx)：发布前检查。
- Easel：提交 [`d80b26ca`](https://github.com/ZJU-REAL/Easel/tree/d80b26ca598dd29bdc23da236cb9743a9a8751bc)
  - [Profile 模板](https://github.com/ZJU-REAL/Easel/blob/d80b26ca598dd29bdc23da236cb9743a9a8751bc/profiles/_template/README.md)：身份、风格、受众、平台、偏好和经验的区分。
  - [video-script](https://github.com/ZJU-REAL/Easel/blob/d80b26ca598dd29bdc23da236cb9743a9a8751bc/skills/openclaw/video-script/SKILL.md)：Hook、口播、字幕、画面和发布文案的脚本结构。
- Content Dashboard：提交 [`d75bdd20`](https://github.com/tenfoldmarc/content-dashboard/tree/d75bdd201c1f8ba62deb53f04ff024965f124e86)
  - [config.ts](https://github.com/tenfoldmarc/content-dashboard/blob/d75bdd201c1f8ba62deb53f04ff024965f124e86/lib/config.ts)：统一 persona 构建。
  - [DateTimePicker.tsx](https://github.com/tenfoldmarc/content-dashboard/blob/d75bdd201c1f8ba62deb53f04ff024965f124e86/components/DateTimePicker.tsx)：日期、平台和已有安排。
  - [PublishingQueue.tsx](https://github.com/tenfoldmarc/content-dashboard/blob/d75bdd201c1f8ba62deb53f04ff024965f124e86/components/PublishingQueue.tsx)：日历/列表和按排期排序。

## 当前实现范围

- 本地规则助手会检查当前稿件的结构，不能替代在线模型。可以复制完整创作简报，手动粘贴到 ChatGPT 等工具，复制不可用时导出 Markdown；不会发送请求。
- 检查清单是作品准备情况的记录，不会阻止你更新状态，也不会执行真实发布。
- 未连接社交平台 API；数据复盘中的点赞率定义为点赞量 ÷ 播放量，不能等同于包含收藏、评论、转发的完整互动率。
- 保留既有内容和稿件；旧三条布尔待办自动迁移为可编辑记录。备份升级至 v2，仍可恢复合法的 v1 备份。
