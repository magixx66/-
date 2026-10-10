export const stages = ["选题", "脚本", "拍摄", "剪辑", "待发布", "已发布"];
export type Project = {
  id: string;
  title: string;
  series: string;
  platform: string;
  status: string;
  date: string;
  time: string;
  script: string;
  hook: string;
  cta: string;
  storyboard: string;
  caption: string;
  sources: string;
  checklist: Record<string, boolean>;
  style: number;
  views: number;
  likes: number;
};
export type Task = {
  id: string;
  title: string;
  done: boolean;
  projectId: string;
  due: string;
  priority: "普通" | "优先";
};
export type Profile = {
  name: string;
  niche: string;
  audience: string;
  voice: string;
  preferences: string;
  memory: string;
};
export type Draft = { project: Project; creating: boolean; updatedAt: string };
export const checklistItems = [
  { id: "facts", label: "事实与引用来源已核查" },
  { id: "cover", label: "封面与标题已准备" },
  { id: "subtitles", label: "字幕、音量与画面已检查" },
  { id: "caption", label: "发布文案与平台格式已检查" },
];
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T12:00:00");
  return Number.isFinite(parsed.getTime()) && dateKey(parsed) === value;
}
export function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  if (
    !["id", "title", "series", "platform", "script", "status"].every(
      (k) => typeof p[k] === "string",
    ) ||
    !p.id ||
    !stages.includes(p.status as string) ||
    !validDate(p.date) ||
    !["style", "views", "likes"].every(
      (k) =>
        typeof p[k] === "number" &&
        Number.isFinite(p[k]) &&
        (p[k] as number) >= 0,
    )
  )
    return null;
  const optional = ["time", "hook", "cta", "storyboard", "caption", "sources"];
  if (optional.some((k) => p[k] !== undefined && typeof p[k] !== "string"))
    return null;
  if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time as string))
    return null;
  if (
    p.checklist !== undefined &&
    (!p.checklist ||
      typeof p.checklist !== "object" ||
      Array.isArray(p.checklist) ||
      Object.values(p.checklist).some((x) => typeof x !== "boolean"))
  )
    return null;
  return {
    ...p,
    time: p.time ?? "",
    hook: p.hook ?? "",
    cta: p.cta ?? "",
    storyboard: p.storyboard ?? "",
    caption: p.caption ?? "",
    sources: p.sources ?? "",
    checklist: p.checklist ?? {},
  } as Project;
}
const taskTitles = [
  "完成「别再把 AI 当搜索引擎」的剪辑",
  "打磨 AI 工具推荐的开头 Hook",
  "整理本周 AI 资讯与灵感",
];
export function migrateTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 3 && value.every((x) => typeof x === "boolean"))
    return value.map((done, i) => ({
      id: "legacy-task-" + i,
      title: taskTitles[i],
      done,
      projectId: ["1", "2", ""][i],
      due: "",
      priority: i === 0 ? "优先" : "普通",
    }));
  if (!value.every(isTask)) throw new Error("待办格式不正确");
  if (new Set(value.map((t) => t.id)).size !== value.length)
    throw new Error("待办编号重复");
  return value;
}
function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Task;
  return (
    typeof t.id === "string" &&
    !!t.id &&
    typeof t.title === "string" &&
    typeof t.done === "boolean" &&
    typeof t.projectId === "string" &&
    validDate(t.due) &&
    ["普通", "优先"].includes(t.priority)
  );
}
export function normalizeProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Profile;
  if (
    !["name", "niche", "audience", "voice"].every(
      (k) => typeof (p as unknown as Record<string, unknown>)[k] === "string",
    )
  )
    return null;
  if (
    (p.preferences !== undefined && typeof p.preferences !== "string") ||
    (p.memory !== undefined && typeof p.memory !== "string")
  )
    return null;
  return { ...p, preferences: p.preferences ?? "", memory: p.memory ?? "" };
}
export function spokenText(p: Project) {
  return [p.hook, p.script, p.cta].filter((x) => x.trim()).join("\n\n");
}
export function durationLabel(p: Project) {
  const count = spokenText(p).replace(/\s/g, "").length;
  const seconds = Math.ceil((count / 220) * 60);
  return `${count} 字 · 约 ${seconds < 60 ? seconds + " 秒" : Math.floor(seconds / 60) + " 分 " + (seconds % 60) + " 秒"}`;
}
export function readiness(p: Project) {
  return [
    { label: "标题已填写", done: !!p.title.trim() },
    { label: "口播稿已准备", done: !!spokenText(p).trim() },
    ...checklistItems.map((i) => ({
      label: i.label,
      done: !!p.checklist[i.id],
    })),
  ];
}
export function projectMarkdown(p: Project) {
  return `# ${p.title || "未命名内容"}\n\n平台：${p.platform} · 系列：${p.series}\n状态：${p.status}\n计划发布：${p.date || "未排期"}${p.time ? " " + p.time : ""}\n\n## 口播稿\n\n${spokenText(p) || "尚未填写"}\n\n## 分镜与 B-roll\n\n${p.storyboard || "尚未填写"}\n\n## 发布文案\n\n${p.caption || "尚未填写"}\n\n## 参考资料\n\n${p.sources || "尚未填写"}\n\n## 发布检查\n\n${readiness(
    p,
  )
    .map((i) => `- [${i.done ? "x" : " "}] ${i.label}`)
    .join("\n")}\n`;
}
export function creativeBrief(p: Project, profile: Profile) {
  return `请作为我的内容创作伙伴，基于以下创作简报优化脚本。\n\n## 创作者档案\n姓名：${profile.name}\n定位：${profile.niche}\n受众：${profile.audience}\n表达风格：${profile.voice}\n内容边界：${profile.preferences || "尚未填写"}\n历史经验：${profile.memory || "尚未填写"}\n\n## 当前内容\n${projectMarkdown(p)}\n## 期望输出\n1. 三个开头 Hook 方案，说明各自适合的受众场景。\n2. 保持我的表达风格，给出可直接口播的稿件。\n3. 按场景给出画面、字幕和 B-roll 建议。\n4. 根据 ${p.platform} 给出标题和发布文案。\n5. 不编造数据或来源；无法核实的信息请列为待核查。\n仅提供建议，不代替我修改记录或发布内容。`;
}
