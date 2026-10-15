import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-03T04:00:00Z"));
  await page.goto("/");
});

test("content creation, script editing and local persistence", async ({
  page,
}) => {
  await page.getByRole("button", { name: "新建内容", exact: true }).click();
  await page
    .getByRole("textbox", { name: "内容标题", exact: true })
    .fill("测试：我的第一篇 AI 科普");
  await page
    .getByRole("textbox", { name: "口播稿", exact: true })
    .fill("先说一个真实问题，再演示三个步骤。");
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await page.reload();
  await page.locator("nav").getByRole("button", { name: "选题库" }).click();
  await expect(
    page.getByText("测试：我的第一篇 AI 科普", { exact: true }),
  ).toBeVisible();
  await page.getByText("测试：我的第一篇 AI 科普", { exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "口播稿", exact: true }),
  ).toHaveValue("先说一个真实问题，再演示三个步骤。");
  await page.getByLabel("创作状态").selectOption("待发布");
  await page.getByLabel("计划日期").fill("2026-10-10");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("creator-projects")!).find(
            (p: { title: string }) => p.title === "测试：我的第一篇 AI 科普",
          ).status,
      ),
    )
    .toBe("待发布");
});

test("navigation, search and filter", async ({ page }) => {
  await page.getByPlaceholder("搜索你的内容…").fill("搜索引擎");
  await expect(page.getByRole("heading", { name: "搜索结果" })).toBeVisible();
  await expect(page.locator(".table-row")).toHaveCount(1);
  await page.locator("nav").getByRole("button", { name: "脚本工作室" }).click();
  await page.getByRole("button", { name: "小红书", exact: true }).click();
  await expect(page.locator(".table-row")).toHaveCount(2);
  await page.locator("nav").getByRole("button", { name: "数据复盘" }).click();
  await expect(page.locator(".bar-chart button")).toHaveCount(2);
});

test("project workflow stages can be changed", async ({ page }) => {
  await page.locator("nav").getByRole("button", { name: "内容项目" }).click();
  await page
    .getByLabel("调整普通人如何开始学习 AI？的状态")
    .selectOption("剪辑");
  await expect(
    page
      .locator(".kanban-column")
      .filter({
        has: page.locator(".kanban-heading .status", { hasText: "剪辑中" }),
      })
      .getByRole("heading", { name: "普通人如何开始学习 AI？" }),
  ).toBeVisible();
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("creator-projects")!).find(
            (p: { id: string }) => p.id === "4",
          ).status,
      ),
    )
    .toBe("剪辑");
});

test("suggested topics require user confirmation", async ({ page }) => {
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("creator-projects")!).length,
  );
  await page.getByRole("button", { name: "一起找个好选题" }).click();
  await expect(page.locator(".proposal")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("creator-projects")!).length,
    ),
  ).toBe(before);
  await page.getByRole("button", { name: "确认添加", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("creator-projects")!).length,
      ),
    )
    .toBe(before + 1);
  await expect(page.locator(".proposal")).toHaveCount(0);
});

test("assets can be imported, previewed and removed", async ({ page }) => {
  await page.locator("nav").getByRole("button", { name: "素材库" }).click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a00kAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator("input[type=file][multiple]")
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".asset-card")).toHaveCount(1);
  await page.locator(".asset-preview").click();
  await expect(page.getByRole("dialog", { name: "素材预览" })).toBeVisible();
  await page.getByRole("button", { name: "关闭素材预览" }).click();
  await page.reload();
  await page.locator("nav").getByRole("button", { name: "素材库" }).click();
  await expect(page.locator(".asset-card")).toHaveCount(1);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除test.png", exact: true }).click();
  await expect(page.locator(".asset-card")).toHaveCount(0);
});

test("calendar scheduling and metric recording", async ({ page }) => {
  await page.locator("nav").getByRole("button", { name: "发布日历" }).click();
  await page
    .locator(".calendar-day")
    .filter({ has: page.locator("span:first-child", { hasText: /^10$/ }) })
    .click();
  await page.getByRole("button", { name: "为这一天安排内容" }).click();
  await expect(page.getByLabel("计划日期")).toHaveValue("2026-10-10");
  await page
    .getByRole("textbox", { name: "内容标题", exact: true })
    .fill("真实数据记录");
  await page.getByLabel("创作状态").selectOption("已发布");
  await page.getByLabel("播放量").fill("5000");
  await page.getByLabel("点赞量").fill("250");
  await page.getByRole("button", { name: "创建内容", exact: true }).click();
  await page.locator("nav").getByRole("button", { name: "数据复盘" }).click();
  await expect(page.locator(".bar-chart button")).toHaveCount(3);
  await expect(page.locator(".bar-chart")).toContainText("5,000");
});

test("profile and backup export", async ({ page }) => {
  await page.getByRole("button", { name: "设置与偏好" }).click();
  await page.getByLabel("怎么称呼你").fill("创作者小林");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("CreatorOS-backup.json");
  const backup = await readFile((await download.path())!);
  expect(JSON.parse(backup.toString()).profile.name).toBe("创作者小林");
  await page.getByLabel("怎么称呼你").fill("临时名字");
  page.once("dialog", (d) => d.accept());
  await page
    .locator('input[type=file][accept="application/json"]')
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
  await expect(page.getByLabel("怎么称呼你")).toHaveValue("创作者小林");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.reload();
  await expect(page.locator(".page-heading h1")).toContainText("创作者小林");
});

test("mobile layout and navigation work without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "收起 AI 助手" }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "打开导航" }).click();
  await page.locator("nav").getByRole("button", { name: "内容项目" }).click();
  await expect(
    page.getByRole("heading", { name: "内容项目", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/mobile.png",
    fullPage: true,
  });
});

test("all pages render without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of [
    "选题库",
    "脚本工作室",
    "内容项目",
    "素材库",
    "发布日历",
    "数据复盘",
    "首页",
  ]) {
    await page
      .locator("nav")
      .getByRole("button", {
        name: name === "内容项目" ? /^内容项目/ : name,
        exact: true,
      })
      .click();
    await expect(page.locator("main")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
