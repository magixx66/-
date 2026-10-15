import { useState, type FormEvent } from "react";
import {
  Check,
  Plus,
  PenLine,
  Trash2,
  Clapperboard,
  ArrowUpRight,
} from "lucide-react";
import { dateKey, type Project, type Task } from "./workflow";
export function TasksPanel({
  tasks,
  setTasks,
  projects,
  onProject,
}: {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
  onProject: (p: Project) => void;
}) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);
  const today = dateKey();
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const ordered = [...(showDone ? tasks : open)].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      Number(b.priority === "优先") - Number(a.priority === "优先") ||
      (a.due || "9999").localeCompare(b.due || "9999"),
  );
  function save(e: FormEvent) {
    e.preventDefault();
    if (!editing?.title.trim()) return;
    setTasks(
      tasks.some((t) => t.id === editing.id)
        ? tasks.map((t) =>
            t.id === editing.id
              ? { ...editing, title: editing.title.trim() }
              : t,
          )
        : [...tasks, { ...editing, title: editing.title.trim() }],
    );
    setEditing(null);
  }
  return (
    <section className="today-panel enhanced-tasks">
      <div className="section-title">
        <h2>
          创作待办
          <span>
            {open.length} 个待办 · {done.length} 已完成
          </span>
        </h2>
        <button className="text-button" onClick={() => setShowDone(!showDone)}>
          {showDone ? "隐藏已完成" : "显示已完成"}
        </button>
      </div>
      <div className="task-list">
        {ordered.map((t) => {
          const project = projects.find((p) => p.id === t.projectId);
          return (
            <div className={`task-row ${t.done ? "done" : ""}`} key={t.id}>
              <button
                className="task-check"
                aria-label={(t.done ? "取消完成" : "完成") + "：" + t.title}
                aria-pressed={t.done}
                onClick={() =>
                  setTasks(
                    tasks.map((x) =>
                      x.id === t.id ? { ...x, done: !x.done } : x,
                    ),
                  )
                }
              >
                {t.done && <Check size={12} />}
              </button>
              <div className="task-detail">
                <span>{t.title}</span>
                <small>
                  {t.due && (
                    <span
                      className={t.due < today && !t.done ? "overdue-text" : ""}
                    >
                      {t.due < today && !t.done ? "已逾期 · " : ""}
                      {t.due}
                    </span>
                  )}
                  {project ? (
                    <button onClick={() => onProject(project)}>
                      <Clapperboard size={10} />
                      {project.title}
                      <ArrowUpRight size={10} />
                    </button>
                  ) : t.projectId ? (
                    <span>关联内容已删除</span>
                  ) : (
                    <span>独立待办</span>
                  )}
                </small>
              </div>
              {t.priority === "优先" && !t.done && (
                <span className="priority">优先</span>
              )}
              <button
                className="task-edit"
                aria-label={"编辑待办：" + t.title}
                onClick={() => setEditing({ ...t })}
              >
                <PenLine size={12} />
              </button>
              <button
                className="task-edit"
                aria-label={"删除待办：" + t.title}
                onClick={() => {
                  if (confirm("删除待办「" + t.title + "」？"))
                    setTasks(tasks.filter((x) => x.id !== t.id));
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
        {ordered.length === 0 && (
          <div className="task-empty">
            <Check size={19} />
            <span>当前没有待办，给下一个好想法留点时间。</span>
          </div>
        )}
      </div>
      {editing ? (
        <form className="task-form" onSubmit={save}>
          <input
            autoFocus
            aria-label="待办标题"
            placeholder="下一步要完成什么？"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            required
          />
          <label>
            关联内容
            <select
              aria-label="关联内容"
              value={editing.projectId}
              onChange={(e) =>
                setEditing({ ...editing, projectId: e.target.value })
              }
            >
              <option value="">独立待办</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <div className="task-form-fields">
            <label>
              截止日期
              <input
                type="date"
                value={editing.due}
                onChange={(e) =>
                  setEditing({ ...editing, due: e.target.value })
                }
              />
            </label>
            <label>
              优先级
              <select
                value={editing.priority}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    priority: e.target.value as Task["priority"],
                  })
                }
              >
                <option>普通</option>
                <option>优先</option>
              </select>
            </label>
          </div>
          <div className="task-form-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(null)}
            >
              取消
            </button>
            <button type="submit" className="primary-button">
              <Check size={13} />
              保存待办
            </button>
          </div>
        </form>
      ) : (
        <button
          className="subtle-add"
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              title: "",
              done: false,
              projectId: "",
              due: today,
              priority: "普通",
            })
          }
        >
          <Plus size={14} />
          添加创作待办
        </button>
      )}
    </section>
  );
}
