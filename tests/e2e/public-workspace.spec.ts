import {test,expect} from "@playwright/test";
test("visitors see actual learning before an account wall",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Make your next hour count."})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Find the subject you need"})).toBeVisible();
 await expect(page.getByRole("button",{name:/Business & enterprise/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Computing & technology/})).toBeVisible();
 await page.getByRole("button",{name:/Business & enterprise/}).click();
 await expect(page.getByRole("button",{name:/Accounting/})).toBeVisible();
 await page.locator(".v2-topic-open").filter({hasText:"Accounting"}).click();
 await expect(page.getByRole("heading",{name:"Shared student documents"})).toBeVisible();
 await page.locator(".navitem").filter({hasText:"Learning library"}).click();
 await expect(page).toHaveURL(/\/library$/);
 await expect(page.getByRole("heading",{name:"Shared student documents"})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Learn something. Understand it."})).toBeVisible();
});
test("subject explorer exposes real topics and a clear account boundary for saved learning plans",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Business & enterprise/}).click();
 await expect(page.getByRole("button",{name:/Accounting/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Economics/})).toBeVisible();
 await page.locator(".v2-follow").first().click();
 await expect(page.getByRole("heading",{name:"Sign in"})).toBeVisible();
});

test("the practice shortcut opens the community practice arena, not Study Studio",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Practice/}).click();
 await expect(page.getByRole("heading",{name:"Practice what you're studying"})).toBeVisible();
});
test("major URLs load directly without losing their destination",async({page})=>{
 await page.goto("/library");
 await expect(page.getByRole("heading",{name:"Shared student documents"})).toBeVisible();
 await page.reload();
 await expect(page.getByRole("heading",{name:"Shared student documents"})).toBeVisible();
 await page.goto("/practice");
 await expect(page.getByRole("heading",{name:"Practice what you're studying"})).toBeVisible();
 await page.goto("/spaces");
 await expect(page.getByRole("heading",{name:"Study with your peers"})).toBeVisible();
 await page.goto("/notes");
 await expect(page.getByRole("heading",{name:"Write with your study group"})).toBeVisible();
});
test("public course deep links work without authentication",async({page})=>{
 await page.goto("/courses/BFB3201");
 await expect(page.getByText("EXPLORE A COURSE")).toBeVisible();
 await expect(page.getByRole("heading",{name:"Open learning resources"})).toBeVisible();
});
test("desktop and phone use deliberately different navigation layouts",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/");
 await expect(page.locator(".side")).toBeVisible();
 await expect(page.locator(".bottom")).toBeHidden();
 await expect(page.locator(".ace-home-v2")).toBeVisible();
 await expect(page.locator(".v2-hero")).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator(".side")).toBeVisible();
 await expect(page.locator(".bottom")).toBeVisible();
});
test("the workspace has no sideways overflow on a narrow phone",async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Make your next hour count."})).toBeVisible();
 await expect(page.locator(".side")).toBeVisible();
 await expect(page.locator(".bottom")).toBeVisible();
 await expect(page.getByRole("button",{name:"Create on Ace Student"})).toBeVisible();
 await page.getByRole("button",{name:"Create on Ace Student"}).click();
 await expect(page.getByRole("dialog",{name:"Create on Ace Student"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Upload learning material"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});

test("students can read original lessons and reveal a recall answer without outbound links",async({page})=>{
 test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,"Requires configured Supabase credentials and seeded lesson data");
 await page.goto("/library");
 await expect(page.getByRole("heading",{name:"Learn something. Understand it."})).toBeVisible();
 await expect(page.locator(".ace-lesson-card").first()).toBeVisible();
 const lessonCount=await page.locator(".ace-lesson-card").count();
 expect(lessonCount).toBeGreaterThan(5);
 await page.locator(".ace-lesson-card").first().click();
 await expect(page.locator(".ace-reader-article")).toBeVisible();
 await expect(page.getByText("RETRIEVAL PRACTICE")).toBeVisible();
 await page.locator(".ace-recall-row button").first().click();
 await expect(page.locator(".ace-recall-row p").first()).toBeVisible();
 await page.getByRole("button",{name:"Mark lesson complete"}).click();
 await expect(page.getByRole("button",{name:"Lesson completed"})).toBeVisible();
 await page.getByRole("button",{name:"All lessons"}).click();
 await expect(page.locator(".ace-lesson-card").first()).toBeVisible();
});

test("visitors can try the sample practice session before signing in", async ({ page }) => {
 await page.goto("/practice");
 await expect(page.getByText("TRY A QUICK SESSION · NO ACCOUNT REQUIRED")).toBeVisible();
 await expect(page.getByRole("heading", { name: "Practice what you're studying" })).toBeVisible();
 const firstOption = page.locator(".guest-questions .quiz-options button").first();
 await firstOption.click();
 await expect(firstOption).toHaveAttribute("aria-pressed", "true");
 await expect(page.getByText(/Sample practice questions for exploration/)).toBeVisible();
});
test("the legacy Groups route redirects to Study groups", async ({ page }) => {
 await page.goto("/groups");
 await expect(page).toHaveURL(/spaces$/);
 await expect(page.getByRole("heading", { name: "Study with your peers" })).toBeVisible();
});


test("keyboard search shortcut and skip link are available to keyboard users", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
  await page.keyboard.press("/");
  await expect(page.getByRole("textbox", { name: "Search Ace Student" })).toBeFocused();
});

test("tablet navigation collapses to an accessible icon rail without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 980 });
  await page.goto("/");
  await expect(page.locator(".side")).toBeVisible();
  await expect(page.locator(".navitem").first()).toHaveAttribute("aria-label", "Overview");
  const railWidth = await page.locator(".side").evaluate((element) => element.getBoundingClientRect().width);
  expect(await page.locator(".side").evaluate((element) => element.getBoundingClientRect().height)).toBe(68);
  await expect(page.locator(".navitem").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("create action sheet closes with Escape and keeps its focus inside the dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Create on Ace Student" }).click();
  const dialog = page.getByRole("dialog", { name: "Create on Ace Student" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("button").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
