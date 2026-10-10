import { useEffect, useRef, useState } from "react";
import {
  PenLine,
  X,
  FileText,
  Check,
  Sparkles,
  Download,
  Trash2,
  Eye,
  Clapperboard,
  CheckCircle2,
  LayoutTemplate,
  AlertCircle,
} from "lucide-react";
import {
  stages,
  checklistItems,
  readiness,
  spokenText,
  durationLabel,
  projectMarkdown,
  creativeBrief,
  type Profile,
  type Project,
} from "./workflow";
function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function ContentEditor({
  project,
  creating,
  profile,
  projects,
  onChange,
  onClose,
  onSave,
  onDelete,
  notify,
  storageError,
}: {
  project: Project;
  creating: boolean;
  profile: Profile;
  projects: Project[];
  onChange: (p: Project) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  notify: (s: string) => void;
  storageError: boolean;
}) {
  const [tab, setTab] = useState("脚本");
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLInputElement>(".title-input")?.focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled])",
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);
  const checks = readiness(project);
  const completed = checks.filter((x) => x.done).length;
  const conflict =
    project.date && project.time
      ? projects.find(
          (p) =>
            p.id !== project.id &&
            p.platform === project.platform &&
            p.date === project.date &&
            p.time === project.time &&
            p.status !== "已发布",
        )
      : null;
  async function copyBrief() {
    const text = creativeBrief(project, profile);
    try {
      await navigator.clipboard.writeText(text);
      notify("创作简报已复制，可粘贴到 ChatGPT 等工具");
    } catch {
      downloadText(text, (project.title || "未命名") + "-AI创作简报.md");
      notify("复制不可用，已导出 AI 创作简报");
    }
  }
  function template() {
    if (
      spokenText(project).trim() &&
      !confirm("保留现有稿件，在正文末尾添加创作提纲？")
    )
      return;
    onChange({
      ...project,
      hook: project.hook || "你有没有遇到过这样一个问题？",
      script:
        project.script +
        (project.script ? "\n\n" : "") +
        "【真实场景】\n描述受众熟悉的一个具体问题。\n\n【核心观点】\n用简单的话，解释一个概念。\n\n【三步演示】\n1. 先做什么？\n2. 接着做什么？\n3. 怎样验证结果？",
      cta: project.cta || "今天就试着迈出这一步，也欢迎分享你的体验。",
    });
    notify("已添加结构模板，请替换为你的真实内容");
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="editor-modal structured-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="modal-header">
          <span>
            <PenLine size={18} />
            <b id="editor-title">
              {creating ? "让一个新想法开始" : "内容工作室"}
            </b>
          </span>
          <span className={`draft-status ${storageError ? "save-error" : ""}`}>
            {storageError ? (
              <AlertCircle size={12} />
            ) : (
              <CheckCircle2 size={12} />
            )}{" "}
            {storageError ? "草稿保存失败" : "编辑草稿自动保留"}
            <button aria-label="关闭编辑器" onClick={onClose}>
              <X size={20} />
            </button>
          </span>
        </div>
        <div className="editor-body">
          <input
            className="title-input"
            aria-label="内容标题"
            placeholder="写下你的内容标题…"
            value={project.title}
            onChange={(e) => onChange({ ...project, title: e.target.value })}
          />
          <div className="editor-fields">
            <label>
              创作状态
              <select
                value={project.status}
                onChange={(e) =>
                  onChange({ ...project, status: e.target.value })
                }
              >
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              发布平台
              <select
                value={project.platform}
                onChange={(e) =>
                  onChange({ ...project, platform: e.target.value })
                }
              >
                {["抖音", "小红书", "哔哩哔哩", "视频号"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              内容系列
              <select
                value={project.series}
                onChange={(e) =>
                  onChange({ ...project, series: e.target.value })
                }
              >
                {["认识 AI", "学习 AI", "用好 AI"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              计划日期
              <input
                type="date"
                value={project.date}
                onChange={(e) => onChange({ ...project, date: e.target.value })}
              />
            </label>
            <label>
              计划时间
              <input
                type="time"
                value={project.time}
                onChange={(e) => onChange({ ...project, time: e.target.value })}
              />
            </label>
          </div>
          {conflict && (
            <div className="conflict-note" role="status">
              <ClockWarning />
              同一平台、同一时间已有「{conflict.title}」，建议调整排期。
            </div>
          )}
          <div className="editor-tabs" role="tablist" aria-label="创作阶段">
            {[
              { name: "脚本", icon: FileText },
              { name: "分镜与资料", icon: Clapperboard },
              { name: "发布检查", icon: CheckCircle2 },
            ].map(({ name, icon: Icon }) => (
              <button
                role="tab"
                id={"tab-" + name}
                aria-controls="editor-tabpanel"
                aria-selected={tab === name}
                key={name}
                onClick={() => setTab(name)}
              >
                <Icon size={14} />
                {name}
                {name === "发布检查" && (
                  <small>
                    {completed}/{checks.length}
                  </small>
                )}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="editor-tabpanel"
            aria-labelledby={"tab-" + tab}
          >
            {tab === "脚本" && (
              <>
                <div className="script-toolbar">
                  <b>
                    <FileText size={16} />
                    口播稿
                  </b>
                  <span>{durationLabel(project)}</span>
                  <button
                    className="text-button"
                    onClick={() => setPreview(!preview)}
                  >
                    <Eye size={13} />
                    {preview ? "返回编辑" : "口播预览"}
                  </button>
                </div>
                {preview ? (
                  <div className="spoken-preview">
                    {spokenText(project) ||
                      "写下第一句话，再来预览你的口播稿。"}
                  </div>
                ) : (
                  <>
                    <label className="structured-field">
                      <span>
                        01 <b>开头 Hook</b>
                        <small>前 3 秒，让观众愿意留下来</small>
                      </span>
                      <textarea
                        aria-label="开头 Hook"
                        placeholder="用一个具体问题或反直觉的事实开场…"
                        value={project.hook}
                        onChange={(e) =>
                          onChange({ ...project, hook: e.target.value })
                        }
                      />
                    </label>
                    <label className="structured-field">
                      <span>
                        02 <b>口播正文</b>
                        <small>解释一个概念，讲清一个故事</small>
                      </span>
                      <textarea
                        className="script-editor"
                        aria-label="口播稿"
                        placeholder="一个真实场景 → 核心观点 → 演示或例子 → 使用边界"
                        value={project.script}
                        onChange={(e) =>
                          onChange({ ...project, script: e.target.value })
                        }
                      />
                    </label>
                    <label className="structured-field">
                      <span>
                        03 <b>结尾 CTA</b>
                        <small>留下一步可以实践的行动</small>
                      </span>
                      <textarea
                        aria-label="结尾 CTA"
                        placeholder="看完之后，观众可以做什么？"
                        value={project.cta}
                        onChange={(e) =>
                          onChange({ ...project, cta: e.target.value })
                        }
                      />
                    </label>
                    <div className="script-tools">
                      <button className="secondary-button" onClick={template}>
                        <LayoutTemplate size={14} />
                        插入创作提纲
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => void copyBrief()}
                      >
                        <Sparkles size={14} />
                        复制 AI 创作简报
                      </button>
                    </div>
                    <p className="editor-hint">
                      简报包含当前稿件与创作者档案，可粘贴到你常用的 AI
                      工具。不会自动发送。
                    </p>
                  </>
                )}
              </>
            )}
            {tab === "分镜与资料" && (
              <>
                <label className="structured-field">
                  <span>
                    <b>分镜 / B-roll 计划</b>
                    <small>按时间或场景整理拍摄需求</small>
                  </span>
                  <textarea
                    className="storyboard-editor"
                    aria-label="分镜计划"
                    placeholder="00:00–00:03 · 正面口播 · 屏幕重点词\n00:03–00:15 · 操作录屏 · 演示步骤\n00:15–00:30 · B-roll · 补充解释"
                    value={project.storyboard}
                    onChange={(e) =>
                      onChange({ ...project, storyboard: e.target.value })
                    }
                  />
                </label>
                <label className="structured-field">
                  <span>
                    <b>参考资料与事实核查</b>
                    <small>保存来源链接、引文和待确认的信息</small>
                  </span>
                  <textarea
                    className="sources-editor"
                    aria-label="参考资料"
                    placeholder="来源标题、URL、查阅日期，以及哪些观点还需核实…"
                    value={project.sources}
                    onChange={(e) =>
                      onChange({ ...project, sources: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            {tab === "发布检查" && (
              <>
                <div className="readiness-summary">
                  <span>
                    <CheckCircle2 size={22} />
                  </span>
                  <div>
                    <b>
                      发布准备 · {completed}/{checks.length}
                    </b>
                    <small>完成创作细节，让作品带着把握出发。</small>
                  </div>
                  <strong>
                    {Math.round((completed / checks.length) * 100)}%
                  </strong>
                </div>
                <div className="checklist-progress">
                  <i
                    style={{ width: (completed / checks.length) * 100 + "%" }}
                  />
                </div>
                <div className="publish-checklist">
                  {checks.slice(0, 2).map((i) => (
                    <div className={i.done ? "checked" : ""} key={i.label}>
                      <CheckCircle2 size={15} />
                      {i.label}
                      <small>自动检查</small>
                    </div>
                  ))}
                  {checklistItems.map((i) => (
                    <label key={i.id}>
                      <input
                        type="checkbox"
                        checked={!!project.checklist[i.id]}
                        onChange={(e) =>
                          onChange({
                            ...project,
                            checklist: {
                              ...project.checklist,
                              [i.id]: e.target.checked,
                            },
                          })
                        }
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
                <label className="structured-field">
                  <span>
                    <b>发布文案 / Caption</b>
                    <small>简介、行动引导和话题标签</small>
                  </span>
                  <textarea
                    className="caption-editor"
                    aria-label="发布文案"
                    placeholder="写下发布时要使用的文案…"
                    value={project.caption}
                    onChange={(e) =>
                      onChange({ ...project, caption: e.target.value })
                    }
                  />
                </label>
                <div className="info-note">
                  <CheckCircle2 size={15} />
                  检查清单用于记录准备情况。修改为「已发布」只更新本地记录，不会发布到平台。
                </div>
              </>
            )}
          </div>
          {project.status === "已发布" && (
            <div className="editor-fields metric-fields">
              <label>
                播放量
                <input
                  type="number"
                  min="0"
                  value={project.views}
                  onChange={(e) =>
                    onChange({
                      ...project,
                      views: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label>
                点赞量
                <input
                  type="number"
                  min="0"
                  value={project.likes}
                  onChange={(e) =>
                    onChange({
                      ...project,
                      likes: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <div>
            {!creating && (
              <button
                aria-label="删除内容"
                className="danger-button"
                onClick={onDelete}
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              className="text-button"
              onClick={() =>
                downloadText(
                  projectMarkdown(project),
                  (project.title || "未命名") + ".md",
                )
              }
            >
              <Download size={15} />
              导出创作包
            </button>
          </div>
          <button className="primary-button" onClick={onSave}>
            <Check size={16} />
            {creating ? "创建内容" : "保存修改"}
          </button>
        </div>
      </section>
    </div>
  );
}
function ClockWarning() {
  return <AlertCircle size={14} />;
}
