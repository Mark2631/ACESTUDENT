import {test,expect} from "@playwright/test";
test.beforeEach(async({page})=>{await page.goto("/");await expect(page.getByRole("heading",{name:"Sign in"})).toBeVisible()});
test("sign-in is focused and supports recovery",async({page})=>{
 await expect(page.locator("#email")).toHaveAttribute("type","email");
 await expect(page.locator("#password")).toHaveAttribute("type","password");
 await expect(page.getByRole("button",{name:"Continue with Google"})).toBeVisible();
 await page.getByRole("button",{name:"Show password"}).click();
 await expect(page.locator("#password")).toHaveAttribute("type","text");
 await page.getByRole("button",{name:"Forgot password?"}).click();
 await expect(page.getByRole("heading",{name:"Reset password"})).toBeVisible();
 await expect(page.locator("#password")).toHaveCount(0);
 await page.getByRole("button",{name:"Back to sign in"}).click();
 await expect(page.locator("#password")).toBeVisible();
});
test("registration is minimal with four academic years",async({page})=>{
 await page.getByRole("button",{name:"Create account",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Create account"})).toBeVisible();
 await expect(page.locator("#fullName")).toBeVisible();
 await expect(page.locator("#year")).toBeVisible();
 await expect(page.locator("#year option")).toHaveCount(5);
 await expect(page.locator("#institution")).toHaveCount(0);
 await expect(page.locator("#programme")).toHaveCount(0);
 await page.getByRole("button",{name:"Sign in",exact:true}).click();
 await expect(page.locator("#fullName")).toHaveCount(0);
});
test("theme persists after navigation",async({page})=>{
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await page.getByRole("button",{name:"Toggle color theme"}).click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
 await page.reload();
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
});
test("registration fits a narrow Android viewport",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.getByRole("button",{name:"Create account",exact:true}).click();
 await expect(page.locator("#year")).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 expect(overflow).toBe(false);
});
