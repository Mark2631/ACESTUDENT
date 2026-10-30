import {test,expect} from "@playwright/test";

test.beforeEach(async({page})=>{
 await page.goto("/studio");
});

test("guest can create a private notebook, review cards and test understanding",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Intro to Economics");
 await page.getByLabel("Course code").fill("ECO 101");
 await page.getByLabel("Tags").fill("economics, fundamentals");
 await page.getByLabel("Study material").fill([
  "Opportunity cost: The value of the next best alternative given up when making a choice.",
  "Supply: The quantity producers are willing to sell at a given price."
 ].join("\n"));
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Intro to Economics"})).toBeVisible();
 await expect(page.getByText("2 cards",{exact:false})).toBeVisible();

 await page.getByRole("tab",{name:"Flashcards"}).click();
 await expect(page.getByText("Opportunity cost")).toBeVisible();
 await page.getByRole("button",{name:"Reveal answer"}).click();
 await expect(page.getByText(/next best alternative given up/)).toBeVisible();
 await page.getByRole("button",{name:"Good",exact:true}).click();
 await expect(page.getByText(/cards to review|Browse your cards/)).toBeVisible();

 await page.getByRole("tab",{name:"Quick test"}).click();
 await expect(page.getByText("Check what you know")).toBeVisible();
 await page.getByRole("button",{name:/The value of the next best alternative given up/}).click();
 await expect(page.getByText(/Correct — nicely done/)).toBeVisible();
});

test("guest notebooks survive reload and remain searchable",async({page})=>{
 await page.getByRole("button",{name:"New notebook"}).click();
 await page.getByLabel("Notebook name").fill("Research Methods");
 await page.getByLabel("Study material").fill("Hypothesis: A testable statement predicting a relationship between variables.");
 await page.getByRole("button",{name:"Create notebook"}).click();
 await expect(page.getByRole("heading",{name:"Research Methods"})).toBeVisible();
 await page.getByRole("button",{name:"All notebooks"}).click();
 await page.reload();
 await expect(page.getByText("Research Methods")).toBeVisible();
 await page.getByRole("textbox",{name:"Search notebooks"}).fill("Research");
 await expect(page.getByText("Research Methods")).toBeVisible();
 await page.getByRole("textbox",{name:"Search notebooks"}).fill("No matching content");
 await expect(page.getByText("You haven't made a notebook yet.")).toHaveCount(0);
});

test("focus timer requires a notebook and can be opened without creating noise",async({page})=>{
 await page.getByRole("button",{name:"Focus timer"}).click();
 await expect(page.getByText("25:00")).toBeVisible();
 await page.getByRole("button",{name:"Start"}).click();
 await expect(page.getByText(/Open a notebook before starting/)).toBeVisible();
});
