import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-03T04:00:00Z"));
  await page.goto("/");
});

test("legacy records and completed tasks migrate without losing the script", async ({
  page,
}) => {
  await page.evaluate(() => {
    const project = JSON.parse(localStorage.getItem("creator-projects")!)[0];
    for (const key of [
      "time",
      "hook",
      "cta",
      "storyboard",
      "caption",
      "sources",
      "checklist",
    ])
      delete project[key];
    localStorage.setItem("creator-projects", JSON.stringify([project]));
    localStorage.setItem("creator-tasks", JSON.stringify([true, false, true]));
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("creator-tasks")!)[0].done,
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!)[0].script,
    ),
  ).toContain("ChatGPT");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!)[0].hook,
    ),
  ).toBe("");
  await page.getByRole("button", { name: "显示已完成", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "取消完成：完成「别再把 AI 当搜索引擎」的剪辑",
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("linked task CRUD and completion persist", async ({ page }) => {
  await page.getByRole("button", { name: "添加创作待办", exact: true }).click();
  await page.getByLabel("待办标题").fill("录制第三个案例");
  await page.getByLabel("关联内容", { exact: true }).selectOption("3");
  await page.getByLabel("截止日期").fill("2026-10-02");
  await page.getByLabel("优先级").selectOption("优先");
  await page.getByRole("button", { name: "保存待办", exact: true }).click();
  const row = page.locator(".task-row").filter({ hasText: "录制第三个案例" });
  await expect(row).toContainText("已逾期");
  await row
    .getByRole("button", { name: "为什么 AI 会一本正经地胡说八道？" })
    .click();
  await expect(page.getByLabel("内容标题", { exact: true })).toHaveValue(
    "为什么 AI 会一本正经地胡说八道？",
  );
  await page.getByRole("button", { name: "关闭编辑器" }).click();
  await row.getByRole("button", { name: "编辑待办：录制第三个案例" }).click();
  await page.getByLabel("待办标题").fill("录制第四个案例");
  await page.getByRole("button", { name: "保存待办", exact: true }).click();
  await page
    .getByRole("button", { name: "完成：录制第四个案例", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "显示已完成", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "取消完成：录制第四个案例", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除待办：录制第四个案例" }).click();
  await expect(page.getByText("录制第四个案例", { exact: true })).toHaveCount(
    0,
  );
});

test("uncommitted drafts recover after reload and commit only on save", async ({
  page,
}) => {
  const count = await page.evaluate(
    () => JSON.parse(localStorage.getItem("creator-projects")!).length,
  );
  await page.getByRole("button", { name: "新建内容", exact: true }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("可恢复的创作草稿");
  await page
    .getByLabel("开头 Hook", { exact: true })
    .fill("你有没有想过 AI 为什么会犯错？");
  await page
    .getByLabel("口播稿", { exact: true })
    .fill("这一段是尚未提交的正文。");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(JSON.parse(localStorage.getItem("creator-drafts")!))
            .length,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(page.locator(".draft-recovery")).toContainText(
    "可恢复的创作草稿",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!).length,
    ),
  ).toBe(count);
  await page.getByRole("button", { name: "继续编辑", exact: true }).click();
  await expect(page.getByLabel("开头 Hook", { exact: true })).toHaveValue(
    "你有没有想过 AI 为什么会犯错？",
  );
  await expect(page.getByLabel("口播稿", { exact: true })).toHaveValue(
    "这一段是尚未提交的正文。",
  );
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await expect(page.locator(".draft-recovery")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!).length,
    ),
  ).toBe(count + 1);
});

test("structured script, checklist and complete Markdown export", async ({
  page,
}) => {
  await page.getByRole("button", { name: "新建内容", exact: true }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("一条完整创作包");
  await page
    .getByLabel("开头 Hook", { exact: true })
    .fill("一个引人好奇的开头");
  await page
    .getByLabel("口播稿", { exact: true })
    .fill("用一个真实案例讲清楚 AI。");
  await page
    .getByLabel("结尾 CTA", { exact: true })
    .fill("今天试着验证一个答案。");
  await page.getByRole("button", { name: "口播预览", exact: true }).click();
  await expect(page.locator(".spoken-preview")).toContainText(
    "一个引人好奇的开头",
  );
  await expect(page.locator(".spoken-preview")).toContainText(
    "今天试着验证一个答案。",
  );
  await page.getByRole("tab", { name: "分镜与资料", exact: true }).click();
  await page
    .getByLabel("分镜计划", { exact: true })
    .fill("00:00–00:03 正面口播，接操作录屏。");
  await page
    .getByLabel("参考资料", { exact: true })
    .fill("https://example.com/reference · 已核实");
  await page.getByRole("tab", { name: /发布检查/ }).click();
  for (const label of [
    "事实与引用来源已核查",
    "封面与标题已准备",
    "字幕、音量与画面已检查",
    "发布文案与平台格式已检查",
  ])
    await page.getByRole("checkbox", { name: label, exact: true }).check();
  await page
    .getByLabel("发布文案", { exact: true })
    .fill("这一次，一起把 AI 用好。 #AI科普");
  await expect(page.locator(".readiness-summary")).toContainText("100%");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出创作包", exact: true }).click();
  const download = await downloadPromise;
  const markdown = await readFile((await download.path())!, "utf8");
  for (const text of [
    "一个引人好奇的开头",
    "今天试着验证一个答案。",
    "正面口播",
    "https://example.com/reference",
    "这一次，一起把 AI 用好。",
    "[x] 字幕",
  ])
    expect(markdown).toContain(text);
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("creator-projects")!).find(
      (p: { title: string }) => p.title === "一条完整创作包",
    ),
  );
  expect(saved.hook).toBe("一个引人好奇的开头");
  expect(saved.checklist.facts).toBe(true);
  expect(saved.storyboard).toContain("操作录屏");
});

test("calendar uses today, persists times and detects scheduling conflicts", async ({
  page,
}) => {
  await page.locator("nav").getByRole("button", { name: "发布日历" }).click();
  await expect(
    page.getByRole("button", { name: "2026-10-03，1条内容" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "为这一天安排内容" }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("时间排期 A");
  await page.getByLabel("计划时间").fill("15:30");
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await expect(page.locator(".schedule-list")).toContainText("15:30");
  await page.getByRole("button", { name: "为这一天安排内容" }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("时间排期 B");
  await page.getByLabel("计划时间").fill("15:30");
  await expect(page.locator(".conflict-note")).toContainText("时间排期 A");
  await page.getByLabel("计划时间").fill("16:00");
  await expect(page.locator(".conflict-note")).toHaveCount(0);
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await page.getByRole("button", { name: "下个月", exact: true }).click();
  await page.getByRole("button", { name: "今天", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "2026-10-03，3条内容" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("assistant retains focused content and brief includes unsaved draft and profile", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "设置与偏好" }).click();
  await page.getByLabel("内容边界与偏好").fill("不夸大效率，不编造结果");
  await page.getByLabel("可复用的创作经验").fill("先演示具体场景再解释概念");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.getByRole("button", { name: "新建内容", exact: true }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("带着上下文的稿件");
  await page
    .getByLabel("口播稿", { exact: true })
    .fill("这是一段尚未保存的正文。");
  await page
    .getByRole("button", { name: "复制 AI 创作简报", exact: true })
    .click();
  const brief = await page.evaluate(() => navigator.clipboard.readText());
  for (const text of [
    "带着上下文的稿件",
    "尚未保存的正文",
    "不夸大效率",
    "先演示具体场景",
  ])
    expect(brief).toContain(text);
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await page.getByRole("button", { name: "打磨我的脚本" }).click();
  await expect(page.locator(".chat-message.assistant").last()).toContainText(
    "带着上下文的稿件",
  );
  await expect(page.locator(".focused-content")).toContainText(
    "带着上下文的稿件",
  );
});

test("malformed backup does not partially replace data", async ({ page }) => {
  const before = await page.evaluate(() =>
    localStorage.getItem("creator-projects"),
  );
  const backup = await page.evaluate(() => ({
    version: 2,
    projects: JSON.parse(localStorage.getItem("creator-projects")!),
    profile: JSON.parse(localStorage.getItem("creator-profile")!),
    tasks: JSON.parse(localStorage.getItem("creator-tasks")!),
    assets: [],
    drafts: {},
  }));
  backup.projects[0].hook = { invalid: true };
  await page
    .locator('input[type=file][accept="application/json"]')
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await expect(page.getByRole("status")).toContainText("备份格式不正确");
  expect(
    await page.evaluate(() => localStorage.getItem("creator-projects")),
  ).toBe(before);
});

test("failed draft persistence is reported and kept open", async ({ page }) => {
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "creator-drafts")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "新建内容", exact: true }).click();
  await page.getByLabel("内容标题", { exact: true }).fill("存储失败时保留编辑");
  await expect(page.locator(".draft-status")).toContainText("草稿保存失败");
  await page.getByRole("button", { name: "关闭编辑器" }).click();
  await expect(
    page.getByRole("dialog", { name: "让一个新想法开始" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("无法保存草稿");
});

test("version one backup restores legacy tasks and script fields", async ({
  page,
}) => {
  const backup = await page.evaluate(() => {
    const projects = JSON.parse(localStorage.getItem("creator-projects")!);
    for (const p of projects)
      for (const key of [
        "time",
        "hook",
        "cta",
        "storyboard",
        "caption",
        "sources",
        "checklist",
      ])
        delete p[key];
    const profile = JSON.parse(localStorage.getItem("creator-profile")!);
    delete profile.memory;
    delete profile.preferences;
    return {
      version: 1,
      projects,
      profile,
      tasks: [false, true, true],
      assets: [],
    };
  });
  page.once("dialog", (d) => d.accept());
  await page
    .locator('input[type=file][accept="application/json"]')
    .setInputFiles({
      name: "v1.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await expect(page.getByRole("status")).toContainText("备份已恢复");
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!)[0].script,
    ),
  ).toContain("ChatGPT");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!)[0].checklist,
    ),
  ).toEqual({});
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-tasks")!)[1].done,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-profile")!).memory,
    ),
  ).toBe("");
});
