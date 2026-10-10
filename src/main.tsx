import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  LayoutDashboard,
  Lightbulb,
  PenLine,
  Clapperboard,
  FolderOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  Sparkles,
  Bell,
  MoreHorizontal,
  Check,
  Clock3,
  Play,
  FileText,
  Upload,
  Download,
  PanelRightClose,
  CircleHelp,
  Layers,
  CheckCircle2,
  Link,
  Music,
  Trash2,
  Grip,
  ExternalLink,
  Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./style.css";
import { ContentEditor } from "./ContentEditor";
import { TasksPanel } from "./TasksPanel";
import {
  stages,
  dateKey,
  normalizeProject,
  normalizeProfile,
  migrateTasks,
  type Project,
  type Profile,
  type Task,
  type Draft,
} from "./workflow";

type Page =
  | "首页"
  | "选题库"
  | "脚本工作室"
  | "内容项目"
  | "素材库"
  | "发布日历"
  | "数据复盘";
type Asset = {
  id: string;
  name: string;
  kind: string;
  data: string;
  size: string;
};
const initialProjects = [
  {
    id: "1",
    title: "别再把 AI 当搜索引擎了",
    series: "用好 AI",
    platform: "抖音",
    status: "剪辑",
    date: "2026-10-02",
    script:
      "你是不是也经常打开 ChatGPT，问完一个问题就关掉？\n\n其实，你只用到了它很小的一部分能力。搜索引擎帮你找答案，而 AI 可以陪你拆问题、做方案、反复打磨。\n\n试试这三个步骤：先告诉它你是谁，再说清你想完成什么，最后让它先问你三个问题。\n\n下次别只问“是什么”，试着问“和我一起怎么做”。",
    style: 0,
    views: 0,
    likes: 0,
  },
  {
    id: "2",
    title: "3 个真正帮你省时间的 AI 工具",
    series: "用好 AI",
    platform: "小红书",
    status: "脚本",
    date: "2026-10-04",
    script:
      "今天只分享三个我真正每天都在用的 AI 工具。\n\n第一步：整理重复工作。第二步：选择合适工具。第三步：验证输出。",
    style: 1,
    views: 0,
    likes: 0,
  },
  {
    id: "3",
    title: "为什么 AI 会一本正经地胡说八道？",
    series: "认识 AI",
    platform: "哔哩哔哩",
    status: "拍摄",
    date: "2026-10-05",
    script:
      "你有没有发现，AI 有时候说得越自信，越可能是错的？\n\n这叫“幻觉”。它在预测下一个词，而不是从事实数据库里直接拿答案。\n\n遇到重要信息，记得核查来源。",
    style: 2,
    views: 0,
    likes: 0,
  },
  {
    id: "4",
    title: "普通人如何开始学习 AI？",
    series: "学习 AI",
    platform: "抖音",
    status: "选题",
    date: "",
    script: "",
    style: 3,
    views: 0,
    likes: 0,
  },
  {
    id: "5",
    title: "我用 AI 重新整理了我的生活",
    series: "用好 AI",
    platform: "抖音",
    status: "已发布",
    date: "2026-09-30",
    script: "从任务清单开始，让工具服务于生活。",
    style: 1,
    views: 128400,
    likes: 6230,
  },
  {
    id: "6",
    title: "一分钟看懂什么是 AI Agent",
    series: "认识 AI",
    platform: "小红书",
    status: "已发布",
    date: "2026-09-28",
    script: "Agent 不只是回答问题，还可以按照目标执行步骤。",
    style: 2,
    views: 94200,
    likes: 4860,
  },
  {
    id: "7",
    title: "这 5 个提示词，让 AI 更懂你",
    series: "用好 AI",
    platform: "抖音",
    status: "待发布",
    date: "2026-10-03",
    script: "角色、背景、目标、约束、输出格式：把这五件事说清楚。",
    style: 0,
    views: 0,
    likes: 0,
  },
].map((p) => normalizeProject(p)!);
const nav: { name: Page; icon: LucideIcon }[] = [
  { name: "首页", icon: LayoutDashboard },
  { name: "选题库", icon: Lightbulb },
  { name: "脚本工作室", icon: PenLine },
  { name: "内容项目", icon: Clapperboard },
  { name: "素材库", icon: FolderOpen },
  { name: "发布日历", icon: CalendarDays },
  { name: "数据复盘", icon: ChartNoAxesCombined },
];
const defaultProfile: Profile = {
  name: "启生",
  niche: "AI 科普与效率工具",
  audience: "想认识 AI、用好 AI 的普通人",
  voice: "自然、真诚，像朋友聊天",
  preferences: "用真实案例解释，不夸大工具能力，不编造来源。",
  memory: "",
};
const newId = () => crypto.randomUUID();
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const fmt = (v: number) =>
  v >= 10000 ? (v / 10000).toFixed(1) + "万" : v.toLocaleString();
function App() {
  const [projects, setProjects] = useState<Project[]>(() =>
    read<Project[]>("creator-projects", initialProjects)
      .map(normalizeProject)
      .filter((p): p is Project => p !== null),
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    read("creator-assets", []),
  );
  const [profile, setProfile] = useState<Profile>(
    () =>
      normalizeProfile(read("creator-profile", defaultProfile)) ??
      defaultProfile,
  );
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      return migrateTasks(read("creator-tasks", [false, false, true]));
    } catch {
      return [];
    }
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const raw = read<Record<string, Draft>>("creator-drafts", {});
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(
      Object.entries(raw).flatMap(([id, d]) => {
        const project = normalizeProject(d?.project);
        return project &&
          project.id === id &&
          typeof d.creating === "boolean" &&
          typeof d.updatedAt === "string"
          ? [[id, { ...d, project }]]
          : [];
      }),
    );
  });
  const [saveErrors, setSaveErrors] = useState<Record<string, boolean>>({});
  const baselineRef = useRef("");
  const [focusedId, setFocusedId] = useState("");
  const today = dateKey();
  const [page, setPage] = useState<Page>("首页");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("全部");
  const [editor, setEditor] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(() => window.innerWidth > 1050);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [notification, setNotification] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    [],
  );
  const [proposal, setProposal] = useState("");
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(() => dateKey());
  const [assetFilter, setAssetFilter] = useState("全部");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  function persist(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setSaveErrors((e) => ({ ...e, [key]: false }));
    } catch {
      setSaveErrors((e) => ({ ...e, [key]: true }));
    }
  }
  useEffect(() => persist("creator-projects", projects), [projects]);
  useEffect(() => persist("creator-assets", assets), [assets]);
  useEffect(() => persist("creator-profile", profile), [profile]);
  useEffect(() => persist("creator-tasks", tasks), [tasks]);
  useEffect(() => persist("creator-drafts", drafts), [drafts]);
  useEffect(() => {
    if (editor) {
      if (JSON.stringify(editor) !== baselineRef.current) {
        setDrafts((d) => ({
          ...d,
          [editor.id]: {
            project: editor,
            creating,
            updatedAt: new Date().toISOString(),
          },
        }));
      } else
        setDrafts((d) => {
          if (!d[editor.id]) return d;
          const next = { ...d };
          delete next[editor.id];
          return next;
        });
    }
  }, [editor, creating]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, proposal]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEditor();
        setProfileOpen(false);
        setPreviewAsset(null);
        setMobileNav(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && editor) {
        e.preventDefault();
        saveProject();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [editor, creating, projects]);
  function notify(s: string) {
    setToast(s);
  }
  function navigate(p: Page) {
    setPage(p);
    setFilter("全部");
    setSearch("");
    setMobileNav(false);
    setFocusedId("");
  }
  function closeEditor() {
    if (editor && JSON.stringify(editor) !== baselineRef.current) {
      const draft = {
        project: editor,
        creating,
        updatedAt: new Date().toISOString(),
      };
      setDrafts((d) => ({ ...d, [editor.id]: draft }));
      try {
        localStorage.setItem(
          "creator-drafts",
          JSON.stringify({ ...drafts, [editor.id]: draft }),
        );
        notify("编辑草稿已保留，可稍后继续");
      } catch {
        notify("无法保存草稿，请先导出创作包");
        return;
      }
    }
    setEditor(null);
  }
  function newContent(status = "选题", title = "") {
    const project = normalizeProject({
      id: newId(),
      title,
      series: "用好 AI",
      platform: "抖音",
      status,
      date: page === "发布日历" ? selectedDay : "",
      script: "",
      style: projects.length % 4,
      views: 0,
      likes: 0,
    })!;
    baselineRef.current = JSON.stringify(project);
    setCreating(true);
    setEditor(project);
  }
  function openProject(p: Project) {
    baselineRef.current = JSON.stringify(p);
    setCreating(false);
    setFocusedId(p.id);
    setEditor({ ...(drafts[p.id]?.project ?? p) });
    if (drafts[p.id]) notify("已恢复此内容的编辑草稿");
  }
  function resumeDraft(draft: Draft) {
    baselineRef.current = JSON.stringify(
      projects.find((p) => p.id === draft.project.id) ?? {},
    );
    setCreating(
      draft.creating || !projects.some((p) => p.id === draft.project.id),
    );
    setFocusedId(draft.project.id);
    setEditor({ ...draft.project });
  }
  function clearDraft(id: string) {
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }
  function saveProject() {
    if (!editor?.title.trim()) {
      notify("请先写下内容标题");
      return;
    }
    const project = normalizeProject({ ...editor, title: editor.title.trim() });
    if (!project) {
      notify("请检查日期、时间和数据格式");
      return;
    }
    const next = creating
      ? [project, ...projects]
      : projects.map((x) => (x.id === project.id ? project : x));
    try {
      localStorage.setItem("creator-projects", JSON.stringify(next));
    } catch {
      notify("内容保存失败，请导出创作包并清理存储空间");
      return;
    }
    setProjects(next);
    clearDraft(project.id);
    setFocusedId(project.id);
    setEditor(null);
    notify(creating ? "新内容已创建" : "修改已保存");
  }
  function move(id: string, status: string) {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    notify("已移动到" + status);
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 2, projects, assets, profile, tasks, drafts },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CreatorOS-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("备份已导出");
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (![1, 2].includes(data.version) || !Array.isArray(data.projects))
        throw Error();
      const nextProjects: Project[] = data.projects.map(normalizeProject);
      if (
        nextProjects.some((p) => !p) ||
        new Set(nextProjects.map((p) => p.id)).size !== nextProjects.length
      )
        throw Error();
      const nextAssets: Asset[] = data.assets ?? [];
      if (
        !Array.isArray(nextAssets) ||
        !nextAssets.every(
          (a) =>
            a &&
            typeof a.id === "string" &&
            typeof a.name === "string" &&
            typeof a.size === "string" &&
            ["image", "audio", "video"].includes(a.kind) &&
            typeof a.data === "string" &&
            a.data.startsWith("data:" + a.kind + "/"),
        )
      )
        throw Error();
      const nextProfile = normalizeProfile(data.profile);
      if (!nextProfile) throw Error();
      const nextTasks = migrateTasks(data.tasks ?? []);
      const nextDrafts: Record<string, Draft> = {};
      if (data.drafts !== undefined) {
        if (
          !data.drafts ||
          typeof data.drafts !== "object" ||
          Array.isArray(data.drafts)
        )
          throw Error();
        for (const [id, raw] of Object.entries(
          data.drafts as Record<string, Draft>,
        )) {
          const project = normalizeProject(raw?.project);
          if (
            !project ||
            project.id !== id ||
            typeof raw.creating !== "boolean" ||
            typeof raw.updatedAt !== "string"
          )
            throw Error();
          nextDrafts[id] = { ...raw, project };
        }
      }
      if (!confirm("导入会替换当前内容、素材、待办和创作者资料。确定继续？"))
        return;
      const entries = [
        ["creator-projects", nextProjects],
        ["creator-assets", nextAssets],
        ["creator-profile", nextProfile],
        ["creator-tasks", nextTasks],
        ["creator-drafts", nextDrafts],
      ] as const;
      const previous = entries.map(
        ([key]) => [key, localStorage.getItem(key)] as const,
      );
      try {
        for (const [key, value] of entries)
          localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        for (const [key, value] of previous) {
          if (value === null) localStorage.removeItem(key);
          else localStorage.setItem(key, value);
        }
        throw error;
      }
      setProjects(nextProjects);
      setAssets(nextAssets);
      setProfile(nextProfile);
      setTasks(nextTasks);
      setDrafts(nextDrafts);
      setFocusedId("");
      notify("备份已恢复");
    } catch {
      notify("备份格式不正确，或浏览器存储空间不足");
    }
  }
  async function upload(files: FileList | null) {
    if (!files) return;
    const next: Asset[] = [];
    for (const file of Array.from(files)) {
      if (!/^(image|audio|video)\//.test(file.type)) {
        notify("支持图片、音频和视频文件");
        continue;
      }
      if (file.size > 1500000) {
        notify("本地演示版单个素材限 1.5 MB");
        continue;
      }
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      next.push({
        id: newId(),
        name: file.name,
        kind: file.type.split("/")[0],
        data,
        size: (file.size / 1024).toFixed(0) + " KB",
      });
    }
    try {
      localStorage.setItem(
        "creator-assets",
        JSON.stringify([...next, ...assets]),
      );
      setAssets((a) => [...next, ...a]);
      if (next.length) notify(`已导入 ${next.length} 个素材`);
    } catch {
      notify("浏览器存储空间不足，请先清理素材");
    }
  }
  function askAi(text = aiInput) {
    if (!text.trim()) return;
    setAiInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    let answer = "";
    if (/选题|灵感/.test(text)) {
      const options = [
        `普通人如何用 AI 改善${/工作/.test(text) ? "工作效率" : "日常生活"}？`,
        "用一个真实案例，讲清 AI 的能力边界",
        "第一次用 AI，先避开这三个误区",
      ];
      const title =
        options.find((t) => !projects.some((p) => p.title === t)) ??
        `${profile.niche}：一个值得验证的新场景（${projects.length + 1}）`;
      answer = `基于你的定位「${profile.niche}」和受众「${profile.audience}」，可以从一个具体场景切入：\n\n「${title}」\n\n建议结构：一个真实问题 → 三步演示 → 使用边界。下面是待确认选题，确认后才会添加到选题库。`;
      setProposal(title);
    } else if (/复盘|数据/.test(text)) {
      const published = projects.filter((p) => p.status === "已发布");
      const top = [...published].sort((a, b) => b.views - a.views)[0];
      answer = top
        ? `已记录 ${published.length} 条已发布内容，总播放 ${fmt(published.reduce((s, p) => s + p.views, 0))}。\n\n「${top.title}」播放量最高（${fmt(top.views)}）。可把它的选题拆成后续系列。当前样本较少，尚不能判断因果；建议补充完播率、发布时间和前三秒留存。`
        : "尚无已发布记录。先在内容详情中填写播放和点赞数据，再进行复盘。";
    } else if (/脚本|口播|标题|分镜/.test(text)) {
      const focused = editor ?? projects.find((p) => p.id === focusedId);
      answer = focused
        ? `我正在参考「${focused.title}」的稿件。\n\n开头 Hook：${focused.hook.trim() ? "已填写" : "尚未填写，建议从受众的一个具体问题开场"}\n口播正文：${focused.script.replace(/\s/g, "").length} 字\n结尾行动：${focused.cta.trim() ? "已填写" : "尚未填写，给观众一个可以实践的动作"}\n分镜计划：${focused.storyboard.trim() ? "已填写" : "尚未填写"}\n\n针对 ${focused.platform}，保持「${profile.voice}」的表达风格。可在内容工作室复制包含全文和档案的 AI 创作简报，交给你常用的模型继续打磨。`
        : `先打开一条内容，我就能参考它的稿件。\n\n建议结构：一个真实问题 → 一个清楚的解释 → 一个可以实践的动作。语气保持「${profile.voice}」。当前是本地规则助手，不会调用在线模型。`;
    } else {
      answer = `我看到你正在「${page}」，有 ${projects.filter((p) => p.status !== "已发布").length} 条内容进行中。\n\n建议先完成最接近发布的内容，再为下周储备选题。你可以让我推荐选题、梳理脚本结构或汇总已记录的数据。\n\n当前为本地规则助手，未连接在线模型。`;
    }
    setMessages((m) => [...m, { role: "assistant", text: answer }]);
  }
  const active = projects
    .filter((p) => p.status !== "已发布")
    .sort(
      (a, b) =>
        stages.indexOf(b.status) - stages.indexOf(a.status) ||
        (a.date || "9999").localeCompare(b.date || "9999"),
    );
  const focusedProject = editor ?? projects.find((p) => p.id === focusedId);
  const unfinishedDrafts = Object.values(drafts).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const overdue = active.filter((p) => p.date && p.date < today);
  const todayProjects = active.filter((p) => p.date === today);
  const storageError = Object.values(saveErrors).some(Boolean);
  const published = projects.filter((p) => p.status === "已发布");
  const visible = projects.filter(
    (p) =>
      (!search ||
        `${p.title}${p.series}${p.platform}${p.hook}${p.script}${p.caption}${p.sources}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (filter === "全部" || p.status === filter || p.platform === filter),
  );
  const views = published.reduce((s, p) => s + p.views, 0);
  const likes = published.reduce((s, p) => s + p.likes, 0);
  const dateNow = new Date();
  const greeting =
    dateNow.getHours() < 12
      ? "上午好"
      : dateNow.getHours() < 18
        ? "下午好"
        : "晚上好";
  function Thumb({
    project,
    small = false,
  }: {
    project: Project;
    small?: boolean;
  }) {
    return (
      <div
        className={`thumbnail thumb-${project.style % 4} ${small ? "small" : ""}`}
      >
        <span className="thumb-grain" />
        <div className="thumb-label">
          {project.series.toUpperCase()} <span>↗</span>
        </div>
        <div className="thumb-title">
          {project.style % 4 === 0 ? (
            <>
              AI，不止
              <br />
              一个答案。
            </>
          ) : project.style % 4 === 1 ? (
            <>
              LESS WORK.
              <br />
              <em>MORE LIFE.</em>
            </>
          ) : project.style % 4 === 2 ? (
            <>
              认识 AI
              <br />
              <em>从好奇开始</em>
            </>
          ) : (
            <>
              把灵感
              <br />
              变成作品。
            </>
          )}
        </div>
        <div className="thumb-art">
          {project.style % 4 === 0 ? (
            <>
              <span className="orbit o1" />
              <span className="orbit o2" />
              <span className="orb" />
            </>
          ) : project.style % 4 === 1 ? (
            <>
              <span className="stairs s1" />
              <span className="stairs s2" />
              <span className="stairs s3" />
            </>
          ) : project.style % 4 === 2 ? (
            <Sparkles />
          ) : (
            <Lightbulb />
          )}
        </div>
        <span className="thumb-bottom">QISHENG STUDIO · CREATOROS</span>
      </div>
    );
  }
  function Status({ value }: { value: string }) {
    return (
      <span className={`status status-${stages.indexOf(value)}`}>
        <i />
        {value === "选题"
          ? "灵感"
          : value === "待发布" || value === "已发布"
            ? value
            : value + "中"}
      </span>
    );
  }
  function ProjectCard({ p }: { p: Project }) {
    return (
      <button className="project-card" onClick={() => openProject(p)}>
        <Thumb project={p} />
        <div className="project-card-body">
          <div className="project-meta">
            <span>{p.platform}</span>
            <MoreHorizontal size={16} />
          </div>
          <h3>{p.title}</h3>
          <div className="project-card-foot">
            <Status value={p.status} />
            <span>
              <Clock3 size={12} />
              {p.date ? p.date.slice(5).replace("-", "月") + "日" : "未排期"}
            </span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: ((stages.indexOf(p.status) + 1) / 6) * 100 + "%",
              }}
            />
          </div>
        </div>
      </button>
    );
  }
  function SectionTitle({
    title,
    sub,
    action,
    go,
  }: {
    title: string;
    sub?: string;
    action?: string;
    go?: () => void;
  }) {
    return (
      <div className="section-title">
        <div>
          <h2>
            {title}
            {sub && <span>{sub}</span>}
          </h2>
        </div>
        {action && (
          <button className="text-button" onClick={go}>
            {action}
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    );
  }
  function Calendar({ compact = false }: { compact?: boolean }) {
    const start = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    return (
      <div className={"calendar " + (compact ? "compact" : "")}>
        <div className="calendar-top">
          <strong>
            {year}年 {month + 1}月
          </strong>
          <div>
            <button
              className="today-calendar-button"
              onClick={() => {
                const now = new Date();
                setMonth(now.getMonth());
                setYear(now.getFullYear());
                setSelectedDay(dateKey(now));
              }}
            >
              今天
            </button>
            <button
              aria-label="上个月"
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear(year - 1);
                } else setMonth(month - 1);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="下个月"
              onClick={() => {
                if (month === 11) {
                  setMonth(0);
                  setYear(year + 1);
                } else setMonth(month + 1);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
            <span className="weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: start }, (_, i) => (
            <span key={"blank" + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const items = projects.filter((p) => p.date === date);
            return (
              <button
                className={`calendar-day ${date === selectedDay ? "selected" : ""} ${date === today ? "is-today" : ""} ${items.length ? "has-content" : ""}`}
                key={date}
                aria-label={date + "，" + items.length + "条内容"}
                aria-pressed={date === selectedDay}
                onClick={() => setSelectedDay(date)}
              >
                <span>{i + 1}</span>
                {compact
                  ? items.length > 0 && <i />
                  : items.map((p) => (
                      <span
                        key={p.id}
                        className="calendar-event"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(p);
                        }}
                      >
                        {p.time && <b>{p.time} </b>}
                        {p.title}
                      </span>
                    ))}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className={`app-shell ${aiOpen ? "with-ai" : ""}`}>
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("首页");
          }}
        >
          <span className="brand-icon">
            <Layers size={22} />
          </span>
          <strong>
            Creator<span>OS</span>
            <small>创作者的第二大脑</small>
          </strong>
        </a>
        <button
          className="workspace-switch"
          onClick={() => setProfileOpen(true)}
        >
          <span className="avatar lavender">启</span>
          <span>
            <b>{profile.name}的创作空间</b>
            <small>
              个人工作室 <span className="pro">LOCAL</span>
            </small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-caption">工作空间</div>
        <nav>
          {nav.map(({ name, icon: Icon }) => (
            <button
              className={page === name ? "active" : ""}
              key={name}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "内容项目" && <small>{active.length}</small>}
              {name === "首页" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="brain-card">
            <span className="brain-title">
              <Sparkles size={16} />
              你的创作者大脑
            </span>
            <p>让每一次创作，都更像你。</p>
            <button onClick={() => setProfileOpen(true)}>
              完善创作者档案
              <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="bottom-nav" onClick={() => setProfileOpen(true)}>
            <Settings size={17} />
            设置与偏好
          </button>
          <button
            className="bottom-nav"
            onClick={() =>
              notify("数据保存在当前浏览器。建议在设置中定期导出备份。")
            }
          >
            <CircleHelp size={17} />
            使用帮助
            <ExternalLink size={13} />
          </button>
          <button className="user-info" onClick={() => setProfileOpen(true)}>
            <span className="avatar dark">{profile.name.slice(0, 1)}</span>
            <span>
              <b>{profile.name}</b>
              <small>保持好奇，持续创作</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="打开导航"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={18} />
            </button>
            <span>工作空间</span>
            <ChevronRight size={13} />
            <b>{page === "首页" ? "今日工作台" : page}</b>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={15} />
              <input
                id="global-search"
                placeholder="搜索你的内容…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="icon-button notification-button"
              aria-label="通知"
              onClick={() => setNotification(!notification)}
            >
              <Bell size={18} />
              <i />
            </button>
            <span className="header-divider" />
            <button
              className={`ai-toggle ${aiOpen ? "selected" : ""}`}
              onClick={() => setAiOpen(!aiOpen)}
            >
              <Sparkles size={16} />
              <span>AI 助手</span>
            </button>
          </div>
          {notification && (
            <div className="notification-popover">
              <b>创作提醒</b>
              {projects
                .filter((p) => p.date === today && p.status !== "已发布")
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      openProject(p);
                      setNotification(false);
                    }}
                  >
                    今天安排：{p.title}
                    <ArrowRight size={14} />
                  </button>
                ))}
              {!todayProjects.length && <p>今天暂时没有内容排期。</p>}
              <p>排期为本地记录，不会自动发布到平台。</p>
            </div>
          )}
        </header>
        <main>
          {storageError && (
            <div className="storage-warning" role="alert">
              部分修改尚未保存到本地，请导出备份并清理浏览器存储空间。
            </div>
          )}
          {unfinishedDrafts.length > 0 && !editor && (
            <div className="draft-recovery">
              <FileText size={17} />
              <span>
                <b>有 {unfinishedDrafts.length} 份编辑草稿等待继续</b>
                <small>
                  最近：{unfinishedDrafts[0].project.title || "未命名内容"}
                </small>
              </span>
              <button
                className="secondary-button"
                onClick={() => resumeDraft(unfinishedDrafts[0])}
              >
                继续编辑
                <ArrowRight size={13} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  if (confirm("丢弃最近这份编辑草稿？已保存的内容不会删除。"))
                    clearDraft(unfinishedDrafts[0].project.id);
                }}
              >
                丢弃
              </button>
            </div>
          )}
          {page === "首页" && !search ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE SOMETHING THAT MATTERS</div>
                  <h1>
                    {greeting}，{profile.name}
                    <span className="greeting-spark">✳︎</span>
                  </h1>
                  <p>把想法变成作品，让创作有条不紊。</p>
                </div>
                <button className="primary-button" onClick={() => newContent()}>
                  <Plus size={17} />
                  新建内容
                </button>
              </div>
              <div className="dashboard-stats">
                <div className="stat-item">
                  <span className="stat-icon purple">
                    <Clapperboard size={19} />
                  </span>
                  <div>
                    <small>进行中的内容</small>
                    <strong>
                      {active.length}
                      <span>个项目</span>
                    </strong>
                  </div>
                  <span className="stat-tag">继续前进 ↗</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon green">
                    <Play size={18} />
                  </span>
                  <div>
                    <small>
                      累计播放量 <span className="demo-label">示例数据</span>
                    </small>
                    <strong>{fmt(views)}</strong>
                  </div>
                  <span className="mini-bars">▂▃▂▅▄▆▅█</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon orange">
                    <CheckCircle2 size={19} />
                  </span>
                  <div>
                    <small>已发布内容</small>
                    <strong>
                      {published.length}
                      <span>篇作品</span>
                    </strong>
                  </div>
                  <span className="stat-note">每一篇都算数</span>
                </div>
              </div>
              <div className="focus-banner">
                <div className="focus-copy">
                  <span className="focus-tag">
                    <span />
                    今日创作指南
                  </span>
                  <h2>少一点纠结，多一个作品。</h2>
                  <p>从一个小小的灵感开始，剩下的我们一起完成。</p>
                  <button
                    onClick={() => {
                      navigate("脚本工作室");
                      if (active[0]) openProject(active[0]);
                      else newContent("脚本");
                    }}
                  >
                    开始今天的创作
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="focus-illustration">
                  <div className="floating-tag tag-one">
                    <Check size={13} />
                    灵感就位
                  </div>
                  <div className="art-paper">
                    <div className="paper-top">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="paper-lines">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="paper-check">
                      <Check size={18} />
                    </div>
                  </div>
                  <div className="art-star">✳︎</div>
                  <div className="floating-tag tag-two">
                    <Sparkles size={14} />
                    让好想法发生
                  </div>
                  <div className="orbit-line" />
                </div>
              </div>
              <div className="daily-agenda">
                <span>
                  <CalendarDays size={15} />
                  {today} · 今日排期 {todayProjects.length} 条
                </span>
                {overdue.length > 0 ? (
                  <button onClick={() => openProject(overdue[0])}>
                    <Clock3 size={13} />
                    {overdue.length} 条内容已过计划日期
                    <ArrowUpRight size={13} />
                  </button>
                ) : (
                  <span className="agenda-clear">
                    <Check size={13} />
                    没有逾期内容
                  </span>
                )}
              </div>
              <section className="recent-section">
                <SectionTitle
                  title="继续创作"
                  sub={`${active.length} 个进行中`}
                  action="查看全部项目"
                  go={() => navigate("内容项目")}
                />
                <div className="project-grid">
                  {active.slice(0, 3).map((p) => (
                    <ProjectCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
              <div className="dashboard-lower">
                <TasksPanel
                  tasks={tasks}
                  setTasks={setTasks}
                  projects={projects}
                  onProject={openProject}
                />
                <section className="calendar-panel">
                  <SectionTitle
                    title="发布计划"
                    action="完整日历"
                    go={() => navigate("发布日历")}
                  />
                  <Calendar compact />
                  <div className="calendar-summary">
                    <span className="purple-dot" />
                    {selectedDay.slice(5).replace("-", "月")}日 ·{" "}
                    {projects.filter((p) => p.date === selectedDay).length}{" "}
                    条内容排期
                  </div>
                </section>
              </div>
              <footer className="dashboard-footer">
                <span>
                  <span className="green-dot" />
                  {storageError
                    ? "有修改未完成本地保存"
                    : "所有修改已自动保存到本地"}
                </span>
                <span>
                  保持好奇，慢慢来。 <span>✦</span>
                </span>
              </footer>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR CREATIVE WORKSPACE</div>
                  <h1>{search ? "搜索结果" : page}</h1>
                  <p>
                    {
                      {
                        首页: "找到你的下一篇内容",
                        选题库: "收藏每一次灵光一现，让好想法有迹可循。",
                        脚本工作室: "从第一句话开始，把你的想法讲清楚。",
                        内容项目: "从灵感到发布，看见每一步进展。",
                        素材库: "把创作需要的一切，放在一个地方。",
                        发布日历: "给每一份用心的内容，安排一个好时间。",
                        数据复盘: "记录真实反馈，让下一次创作更有方向。",
                      }[page]
                    }
                  </p>
                </div>
                {page === "素材库" ? (
                  <button
                    className="primary-button"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={16} />
                    导入素材
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    onClick={() =>
                      newContent(page === "脚本工作室" ? "脚本" : "选题")
                    }
                  >
                    <Plus size={17} />
                    新建内容
                  </button>
                )}
              </div>
              {(search || page === "选题库" || page === "脚本工作室") && (
                <>
                  <div className="filter-bar">
                    {[
                      "全部",
                      ...(page === "选题库"
                        ? ["选题", "脚本", "已发布"]
                        : ["抖音", "小红书", "哔哩哔哩"]),
                    ].map((f) => (
                      <button
                        key={f}
                        className={filter === f ? "active" : ""}
                        onClick={() => setFilter(f)}
                      >
                        {f === "选题" ? "灵感" : f}
                      </button>
                    ))}
                    <span>{visible.length} 条内容</span>
                  </div>
                  {page === "选题库" && !search && (
                    <button
                      className="idea-banner"
                      onClick={() => {
                        setAiOpen(true);
                        askAi("帮我推荐一个新选题");
                      }}
                    >
                      <Sparkles size={22} />
                      <span>
                        <b>还没找到下一个好选题？</b>
                        <small>围绕你的创作者定位，探索一个新方向。</small>
                      </span>
                      <ArrowRight size={20} />
                    </button>
                  )}
                  <div className="content-table">
                    <div className="table-header">
                      <span>内容标题</span>
                      <span>系列 / 平台</span>
                      <span>当前状态</span>
                      <span>计划发布</span>
                      <span />
                    </div>
                    {visible.map((p) => (
                      <button
                        className="table-row"
                        key={p.id}
                        onClick={() => openProject(p)}
                      >
                        <span className={"table-title"}>
                          <span className={`document-icon doc-${p.style % 4}`}>
                            <FileText size={19} />
                          </span>
                          <span>
                            <b>{p.title}</b>
                            <small>
                              {p.script
                                ? `${p.script.length} 字 · 已保存脚本`
                                : "等待好想法发生"}
                            </small>
                          </span>
                        </span>
                        <span className="table-platform">
                          {p.series}
                          <small>{p.platform}</small>
                        </span>
                        <Status value={p.status} />
                        <span className="table-date">{p.date || "未排期"}</span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {visible.length === 0 && (
                      <div className="empty-state">
                        <Search />
                        <h3>没有找到内容</h3>
                        <p>换一个关键词，或创建你的第一个选题。</p>
                        <button
                          className="secondary-button"
                          onClick={() => newContent()}
                        >
                          新建内容
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {!search && page === "内容项目" && (
                <div className="kanban">
                  {stages.map((s) => (
                    <section
                      className="kanban-column"
                      key={s}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData("text/plain");
                        if (projects.some((p) => p.id === id)) move(id, s);
                      }}
                    >
                      <div className="kanban-heading">
                        <Status value={s} />
                        <span>
                          {projects.filter((p) => p.status === s).length}
                        </span>
                        <button
                          aria-label={"新建" + s + "内容"}
                          onClick={() => newContent(s)}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      {projects
                        .filter((p) => p.status === s)
                        .map((p) => (
                          <div
                            draggable
                            onDragStart={(e) =>
                              e.dataTransfer.setData("text/plain", p.id)
                            }
                            key={p.id}
                            className="kanban-card"
                          >
                            <button
                              className="kanban-open"
                              onClick={() => openProject(p)}
                            >
                              {p.style % 2 === 0 && <Thumb project={p} small />}
                              <span className="series-label">{p.series}</span>
                              <h3>{p.title}</h3>
                              <span className="kanban-meta">
                                {p.platform} ·{" "}
                                {p.date ? p.date.slice(5) : "未排期"}
                              </span>
                            </button>
                            <div className="kanban-move">
                              <Grip size={13} />
                              <select
                                aria-label={"调整" + p.title + "的状态"}
                                value={p.status}
                                onChange={(e) => move(p.id, e.target.value)}
                              >
                                {stages.map((x) => (
                                  <option key={x}>{x}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                    </section>
                  ))}
                </div>
              )}
              {!search && page === "素材库" && (
                <>
                  <div className="filter-bar">
                    {["全部", "图片", "视频", "音频"].map((f) => (
                      <button
                        key={f}
                        className={assetFilter === f ? "active" : ""}
                        onClick={() => setAssetFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                    <span>{assets.length} 个本地素材</span>
                  </div>
                  <div className="asset-grid">
                    {assets
                      .filter(
                        (a) =>
                          assetFilter === "全部" ||
                          a.kind ===
                            (
                              {
                                图片: "image",
                                视频: "video",
                                音频: "audio",
                              } as Record<string, string>
                            )[assetFilter],
                      )
                      .map((a) => (
                        <div className="asset-card" key={a.id}>
                          <button
                            className="asset-preview"
                            onClick={() => setPreviewAsset(a)}
                          >
                            {a.kind === "image" ? (
                              <img src={a.data} alt={a.name} />
                            ) : a.kind === "video" ? (
                              <Play size={36} />
                            ) : (
                              <Music size={36} />
                            )}
                          </button>
                          <div>
                            <b>{a.name}</b>
                            <small>{a.size} · 本地文件</small>
                            <button
                              aria-label={"删除" + a.name}
                              onClick={() => {
                                if (confirm("删除素材「" + a.name + "」？")) {
                                  setAssets((v) =>
                                    v.filter((x) => x.id !== a.id),
                                  );
                                  notify("素材已删除");
                                }
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    <button
                      className="upload-zone"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={26} />
                      <b>导入你的创作素材</b>
                      <span>图片、视频或音频</span>
                      <small>本地演示版 · 单文件 ≤ 1.5 MB</small>
                    </button>
                  </div>
                  <div className="info-note">
                    <FolderOpen size={16} />
                    素材保存在当前浏览器，可通过设置导出备份。大文件管理将在后续接入本地文件系统。
                  </div>
                </>
              )}
              {!search && page === "发布日历" && (
                <>
                  <div className="info-note calendar-note">
                    <CalendarDays size={16} />
                    这是你的创作排期。内容不会自动发布，请到对应平台完成发布。
                  </div>
                  <Calendar />
                  <div className="schedule-list">
                    <SectionTitle title={`${selectedDay} 的安排`} />
                    {projects
                      .filter((p) => p.date === selectedDay)
                      .sort((a, b) =>
                        (a.time || "99:99").localeCompare(b.time || "99:99"),
                      )
                      .map((p) => (
                        <button key={p.id} onClick={() => openProject(p)}>
                          <span className="schedule-time">
                            {p.time || "待定"}
                            <small>{p.time ? "计划时间" : "尚未设置"}</small>
                          </span>
                          <div>
                            <b>{p.title}</b>
                            <small>{p.platform}</small>
                          </div>
                          <Status value={p.status} />
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                    {!projects.some((p) => p.date === selectedDay) && (
                      <p className="muted">
                        这一天还没有安排，给下一篇作品留一个位置。
                      </p>
                    )}
                    <button
                      className="subtle-add"
                      onClick={() => newContent("待发布")}
                    >
                      <Plus size={15} />
                      为这一天安排内容
                    </button>
                  </div>
                </>
              )}
              {!search && page === "数据复盘" && (
                <>
                  <div className="info-note">
                    <ChartNoAxesCombined size={16} />
                    初始记录为示例数据。点击作品可录入真实播放和点赞；当前未连接平台
                    API。
                  </div>
                  <div className="analytics-stats">
                    {[
                      ["总播放量", fmt(views)],
                      ["总点赞量", fmt(likes)],
                      [
                        "点赞率",
                        views ? ((likes / views) * 100).toFixed(1) + "%" : "—",
                      ],
                      ["已发布", String(published.length)],
                    ].map(([a, b]) => (
                      <div key={a}>
                        <small>{a}</small>
                        <strong>{b}</strong>
                      </div>
                    ))}
                  </div>
                  <section className="analytics-chart">
                    <SectionTitle title="作品表现" sub="按播放量" />
                    <div className="bar-chart">
                      {[...published]
                        .sort((a, b) => b.views - a.views)
                        .map((p) => (
                          <button key={p.id} onClick={() => openProject(p)}>
                            <span>{p.title}</span>
                            <div>
                              <i
                                style={{
                                  width:
                                    Math.max(
                                      2,
                                      (p.views /
                                        Math.max(
                                          1,
                                          ...published.map((x) => x.views),
                                        )) *
                                        100,
                                    ) + "%",
                                }}
                              />
                            </div>
                            <b>{fmt(p.views)}</b>
                          </button>
                        ))}
                    </div>
                    {published.length === 0 && (
                      <p className="muted">
                        还没有已发布的作品。发布后在内容详情中录入数据。
                      </p>
                    )}
                  </section>
                  <button
                    className="idea-banner"
                    onClick={() => {
                      setAiOpen(true);
                      askAi("帮我复盘数据");
                    }}
                  >
                    <Sparkles size={23} />
                    <span>
                      <b>从数据中找到下一次创作的灵感</b>
                      <small>让本地助手汇总已记录的作品表现。</small>
                    </span>
                    <ArrowRight size={20} />
                  </button>
                </>
              )}
            </>
          )}
        </main>
      </div>
      {aiOpen && (
        <aside className="ai-panel">
          <div className="ai-panel-header">
            <span>
              <span className="ai-logo">
                <Sparkles size={16} />
              </span>
              <b>创作伙伴</b>
              <span className="beta">BETA</span>
            </span>
            <button aria-label="收起 AI 助手" onClick={() => setAiOpen(false)}>
              <PanelRightClose size={17} />
            </button>
          </div>
          <div className="ai-context">
            <span className="green-dot" />
            {focusedProject
              ? "正在参考 · " + focusedProject.title
              : "正在陪你浏览 · " + (page === "首页" ? "今日工作台" : page)}
            <ChevronDown size={13} />
          </div>
          <div className="ai-body" ref={chatRef}>
            {focusedProject && (
              <button
                className="focused-content"
                onClick={() => openProject(focusedProject)}
              >
                <FileText size={15} />
                <span>{focusedProject.title}</span>
                <ArrowUpRight size={13} />
              </button>
            )}
            <div className="assistant-intro">
              <div className="assistant-symbol">
                <Sparkles size={25} />
              </div>
              <h3>好想法，值得一起打磨。</h3>
              <p>
                我了解你的风格，也在意你的下一篇作品。
                <br />
                从灵感到发布，陪你走完每一步。
              </p>
            </div>
            <div className="ai-profile">
              <span className="avatar lavender">
                {profile.name.slice(0, 1)}
              </span>
              <div>
                <b>
                  {profile.name} · {profile.niche}
                </b>
                <small>{profile.voice}</small>
              </div>
              <button
                aria-label="编辑创作者档案"
                onClick={() => setProfileOpen(true)}
              >
                <PenLine size={13} />
              </button>
            </div>
            <div className="suggestion-label">我们可以从这里开始</div>
            <div className="ai-suggestions">
              {[
                {
                  icon: Lightbulb,
                  title: "一起找个好选题",
                  sub: "从你的定位，发现新的灵感",
                  q: "帮我推荐一个新选题",
                },
                {
                  icon: PenLine,
                  title: "打磨我的脚本",
                  sub: "更自然，更像你的表达",
                  q: "帮我梳理口播脚本结构",
                },
                {
                  icon: ChartNoAxesCombined,
                  title: "看看最近的内容表现",
                  sub: "把数据变成下一次的方向",
                  q: "帮我复盘数据",
                },
              ].map(({ icon: Icon, title, sub, q }) => (
                <button key={title} onClick={() => askAi(q)}>
                  <span>
                    <Icon size={17} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </div>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
            <div className="ai-divider">
              <span>为你，记住更多</span>
            </div>
            <div className="memory-note">
              <span className="memory-icon">
                <Layers size={17} />
              </span>
              <p>
                你的创作者档案已就绪
                <small>
                  定位、受众和表达风格
                  <br />
                  会随每次创作一起成长。
                </small>
              </p>
              <CheckCircle2 size={15} />
            </div>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={"chat-message " + m.role}>
                  {m.role === "assistant" && <Sparkles size={14} />}
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            {proposal && (
              <div className="proposal">
                <small>待确认的新选题</small>
                <b>{proposal}</b>
                <div>
                  <button
                    className="primary-button"
                    onClick={() => {
                      setProjects((p) => [
                        normalizeProject({
                          id: newId(),
                          title: proposal,
                          series: "用好 AI",
                          status: "选题",
                          platform: "抖音",
                          date: "",
                          script: "",
                          style: 3,
                          views: 0,
                          likes: 0,
                        })!,
                        ...p,
                      ]);
                      setProposal("");
                      notify("已添加到选题库");
                    }}
                  >
                    确认添加
                  </button>
                  <button onClick={() => setProposal("")}>取消</button>
                </div>
              </div>
            )}
          </div>
          <div className="ai-compose">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAi();
              }}
            >
              <textarea
                aria-label="给创作伙伴发送消息"
                placeholder="聊聊你的想法，或让我帮你…"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    askAi();
                  }
                }}
              />
              <div>
                <span>
                  <Link size={13} />
                  页面上下文已关联
                </span>
                <button
                  type="submit"
                  aria-label="发送消息"
                  disabled={!aiInput.trim()}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
            <p>
              <span className="purple-dot" />
              本地规则助手 · 未连接在线模型
            </p>
          </div>
        </aside>
      )}
      {editor && (
        <ContentEditor
          project={editor}
          creating={creating}
          profile={profile}
          projects={projects}
          onChange={setEditor}
          onClose={closeEditor}
          onSave={saveProject}
          storageError={!!saveErrors["creator-drafts"]}
          notify={notify}
          onDelete={() => {
            if (confirm("删除这条内容？此操作无法撤销。")) {
              setProjects((p) => p.filter((x) => x.id !== editor.id));
              clearDraft(editor.id);
              setEditor(null);
              setFocusedId("");
              notify("内容已删除");
            }
          }}
        />
      )}
      {profileOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setProfileOpen(false);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <div className="modal-header">
              <span>
                <Sparkles size={18} />
                <b id="profile-title">你的创作者档案</b>
              </span>
              <button
                aria-label="关闭档案"
                onClick={() => setProfileOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="profile-body">
              <p>让你的每一次创作，都保持自己的声音。</p>
              {[
                { key: "name", label: "怎么称呼你" },
                { key: "niche", label: "内容定位" },
                { key: "audience", label: "你想与谁对话" },
                { key: "voice", label: "你的表达风格" },
                { key: "preferences", label: "内容边界与偏好" },
                { key: "memory", label: "可复用的创作经验" },
              ].map(({ key, label }) => (
                <label key={key}>
                  {label}
                  <input
                    value={profile[key as keyof Profile]}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <div className="backup-section">
                <b>数据与备份</b>
                <p>内容仅存于当前浏览器，清理浏览器数据会丢失记录。</p>
                <div>
                  <button className="secondary-button" onClick={exportData}>
                    <Download size={15} />
                    导出备份
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={15} />
                    恢复备份
                  </button>
                </div>
              </div>
              <div className="info-note">
                <Sparkles size={15} />
                AI 为本地规则模式。在线模型与真实平台发布尚未接入。
              </div>
            </div>
            <div className="modal-footer">
              <span className="muted">修改自动保存</span>
              <button
                className="primary-button"
                onClick={() => setProfileOpen(false)}
              >
                完成
                <Check size={15} />
              </button>
            </div>
          </section>
        </div>
      )}
      {previewAsset && (
        <div className="modal-backdrop" onClick={() => setPreviewAsset(null)}>
          <section
            className="asset-modal"
            role="dialog"
            aria-modal="true"
            aria-label="素材预览"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <b>{previewAsset.name}</b>
              <button
                aria-label="关闭素材预览"
                onClick={() => setPreviewAsset(null)}
              >
                <X size={20} />
              </button>
            </div>
            {previewAsset.kind === "image" ? (
              <img src={previewAsset.data} alt={previewAsset.name} />
            ) : previewAsset.kind === "video" ? (
              <video controls src={previewAsset.data} />
            ) : (
              <audio controls src={previewAsset.data} />
            )}
          </section>
        </div>
      )}
      <input
        ref={fileRef}
        hidden
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={importRef}
        hidden
        type="file"
        accept="application/json"
        onChange={(e) => {
          void importData(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
