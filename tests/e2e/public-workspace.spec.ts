import {test,expect} from "@playwright/test";
test("visitors see actual learning before an account wall",async({page})=>{
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Make room for progress."})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Explore learning areas"})).toBeVisible();
 await expect(page.getByRole("button",{name:/Business & enterprise/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Computing & technology/})).toBeVisible();
 await page.getByRole("button",{name:/Business & enterprise/}).click();
 await expect(page.getByRole("button",{name:/Accounting/})).toBeVisible();
 await page.locator(".home-topic-open").filter({hasText:"Accounting"}).click();
 await expect(page.getByRole("heading",{name:"Learning materials"})).toBeVisible();
 await page.locator(".navitem").filter({hasText:"Learning library"}).click();
 await expect(page).toHaveURL(/\/library$/);
 await expect(page.getByRole("heading",{name:"Learning materials"})).toBeVisible();
 await expect(page.getByRole("heading",{name:/Free learning resources/})).toBeVisible();
});
test("subject explorer exposes real topics and a clear account boundary for saved learning plans",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Business & enterprise/}).click();
 await expect(page.getByRole("button",{name:/Accounting/})).toBeVisible();
 await expect(page.getByRole("button",{name:/Economics/})).toBeVisible();
 await page.locator(".home-follow").first().click();
 await expect(page.getByRole("heading",{name:"Sign in"})).toBeVisible();
});

test("the practice shortcut opens the community practice arena, not Study Studio",async({page})=>{
 await page.goto("/");
 await page.getByRole("button",{name:/Practice arena/}).click();
 await expect(page.getByRole("heading",{name:"Practice with Ace Student"})).toBeVisible();
});
test("major URLs load directly without losing their destination",async({page})=>{
 await page.goto("/library");
 await expect(page.getByRole("heading",{name:"Learning materials"})).toBeVisible();
 await page.reload();
 await expect(page.getByRole("heading",{name:"Learning materials"})).toBeVisible();
 await page.goto("/practice");
 await expect(page.getByRole("heading",{name:"Practice with Ace Student"})).toBeVisible();
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
 await expect(page.locator(".home-columns")).toHaveCSS("display","grid");
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator(".side")).toBeHidden();
 await expect(page.locator(".bottom")).toBeVisible();
});
test("the workspace has no sideways overflow on a narrow phone",async({page})=>{
 await page.setViewportSize({width:360,height:780});
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Make room for progress."})).toBeVisible();
 await expect(page.locator(".side")).toBeHidden();
 await expect(page.locator(".bottom")).toBeVisible();
 await expect(page.getByRole("button",{name:"Create on Ace Student"})).toBeVisible();
 await page.getByRole("button",{name:"Create on Ace Student"}).click();
 await expect(page.getByRole("dialog",{name:"Create on Ace Student"})).toBeVisible();
 await expect(page.getByRole("button",{name:"Upload learning material"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});
