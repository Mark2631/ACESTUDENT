import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{await page.goto("/");await expect(page.getByRole("heading",{name:"Create your account"})).toBeVisible()});
test("new students see registration with optional academic context",async({page})=>{
 await expect(page.locator("#fullName")).toBeVisible();
 await expect(page.locator("#email")).toHaveAttribute("type","email");
 await expect(page.locator("#password")).toHaveAttribute("type","password");
 await expect(page.locator("#institution")).not.toHaveAttribute("required","");
 await expect(page.locator("#programme")).not.toHaveAttribute("required","");
 await expect(page.locator("#year")).not.toHaveAttribute("required","");
 await expect(page.getByRole("button",{name:"Continue with Google"})).toBeVisible();
});
test("students can switch between registration and password login",async({page})=>{
 await page.getByRole("button",{name:"Sign in",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Welcome back"})).toBeVisible();
 await expect(page.locator("#fullName")).toHaveCount(0);
 await expect(page.locator("#email")).toBeVisible();
 await expect(page.locator("#password")).toBeVisible();
 await page.getByRole("button",{name:"Create account",exact:true}).first().click();
 await expect(page.locator("#fullName")).toBeVisible();
});
test("dark and light choices survive navigation",async({page})=>{
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.getByRole("button",{name:"Toggle color theme"}).click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
 await page.reload();
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
});
test("signup fits a narrow Android viewport",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await expect(page.locator("#year")).toBeVisible();
 const overflows=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 expect(overflows).toBe(false);
});
