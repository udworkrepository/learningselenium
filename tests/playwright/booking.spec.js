const { test, expect } = require("@playwright/test");

const pagePath = "/dropdownsPractise/";
const origin = "#ctl00_mainContent_ddl_originStation1";
const destination = "#ctl00_mainContent_ddl_destinationStation1";
const passengers = "#divpaxinfo";

async function airportField(page, id) {
  const legacyField = page.locator(id);
  if (await legacyField.count() && await legacyField.isVisible()) {
    return legacyField;
  }
  return page.locator(`${id}_CTXT`);
}

async function chooseAirport(page, id, label) {
  const field = await airportField(page, id);
  const airportCode = label.match(/\(([^)]+)\)/)[1];
  if (await field.evaluate(element => element.tagName === "SELECT")) {
    await field.selectOption({ label });
    return;
  }

  const cityName = label.slice(0, label.lastIndexOf(" ("));
  const suggestions = page.locator(`#gls${id.slice(1)}_CTNR a[value="${airportCode}"]:visible`);
  await field.click();
  await page.keyboard.type(cityName);
  await suggestions.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(pagePath, { waitUntil: "domcontentloaded" });
});

test("positive: booking page loads with one-way selected", async ({ page }) => {
  await expect(page).toHaveTitle(/QAClickJet/);
  await expect(page.locator("#ctl00_mainContent_rbtnl_Trip_0")).toBeChecked();
});

test("positive: departure list contains Mumbai", async ({ page }) => {
  const field = await airportField(page, origin);
  if (await field.evaluate(element => element.tagName === "SELECT")) {
    await expect(field.locator("option", { hasText: "Mumbai (BOM)" })).toHaveCount(1);
  } else {
    await field.click();
    await page.keyboard.type("Mumbai");
    await expect(page.locator(`#gls${origin.slice(1)}_CTNR a[value="BOM"]:visible`)).toBeVisible();
  }
});

test("positive: selecting Mumbai loads arrival choices", async ({ page }) => {
  await chooseAirport(page, origin, "Mumbai (BOM)");
  const field = await airportField(page, destination);
  if (await field.evaluate(element => element.tagName === "SELECT")) {
    await expect(field.locator("option", { hasText: "Delhi (DEL)" })).toHaveCount(1);
  } else {
    await field.click();
    await expect(page.locator(`#gls${destination.slice(1)}_CTNR a[value="DEL"]:visible`)).toBeVisible();
  }
});

test("positive: arrival autocomplete offers Delhi after departure is selected", async ({ page }) => {
  await chooseAirport(page, origin, "Mumbai (BOM)");
  const field = await airportField(page, destination);
  if (await field.evaluate(element => element.tagName === "SELECT")) {
    await field.selectOption({ label: "Delhi (DEL)" });
    await expect(field).toHaveValue("DEL");
  } else {
    await field.click();
    await page.keyboard.type("Delhi");
    await expect(page.locator(`#gls${destination.slice(1)}_CTNR a[value="DEL"]:visible`)).toBeVisible();
  }
});

test("positive: round trip can be selected", async ({ page }) => {
  await page.locator("#ctl00_mainContent_rbtnl_Trip_1").check();
  await expect(page.locator("#ctl00_mainContent_rbtnl_Trip_1")).toBeChecked();
});

test("positive: one-way can be selected", async ({ page }) => {
  await page.locator("#ctl00_mainContent_rbtnl_Trip_1").check();
  await page.locator("#ctl00_mainContent_rbtnl_Trip_0").check();
  await expect(page.locator("#ctl00_mainContent_rbtnl_Trip_0")).toBeChecked();
});

test("positive: multicity option can be selected", async ({ page }) => {
  await page.locator("#ctl00_mainContent_rbtnl_Trip_2").check();
  await expect(page.locator("#ctl00_mainContent_rbtnl_Trip_2")).toBeChecked();
});

test("positive: USD currency can be selected", async ({ page }) => {
  await page.locator("#ctl00_mainContent_DropDownListCurrency").selectOption("USD");
  await expect(page.locator("#ctl00_mainContent_DropDownListCurrency")).toHaveValue("USD");
});

test("positive: AED currency can be selected", async ({ page }) => {
  await page.locator("#ctl00_mainContent_DropDownListCurrency").selectOption("AED");
  await expect(page.locator("#ctl00_mainContent_DropDownListCurrency")).toHaveValue("AED");
});

test("positive: fare preference checkboxes can be enabled", async ({ page }) => {
  for (const id of [
    "#ctl00_mainContent_chk_friendsandfamily",
    "#ctl00_mainContent_chk_SeniorCitizenDiscount",
    "#ctl00_mainContent_chk_StudentDiscount",
    "#ctl00_mainContent_chk_IndArm"
  ]) {
    await page.locator(id).check();
    await expect(page.locator(id)).toBeChecked();
  }
});

test("positive: country autocomplete offers and selects India", async ({ page }) => {
  const country = page.locator("#autosuggest");
  await country.fill("Ind");
  await page.getByText("India", { exact: true }).click();
  await expect(country).toHaveValue("India");
});

test("positive: adult passenger count can be increased", async ({ page }) => {
  await page.locator(passengers).click();
  await page.locator("#hrefIncAdt").click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(passengers)).toContainText("2 Adult");
});

test("positive: child passenger count can be increased", async ({ page }) => {
  await page.locator(passengers).click();
  await page.locator("#hrefIncChd").click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(passengers)).toContainText("1 Child");
});

test("positive: infant passenger count can be increased", async ({ page }) => {
  await page.locator(passengers).click();
  await page.locator("#hrefIncInf").click();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(passengers)).toContainText("1 Infant");
});

test("positive: departure and return date controls are available", async ({ page }) => {
  await expect(page.locator("#ctl00_mainContent_view_date1")).toBeVisible();
  await expect(page.locator("#ctl00_mainContent_view_date1")).toBeEnabled();
  await expect(page.locator("#ctl00_mainContent_view_date2")).toBeVisible();
  await expect(page.locator("#ctl00_mainContent_view_date2")).toBeEnabled();
});

test("negative: arrival choices are unavailable before choosing a departure", async ({ page }) => {
  const field = await airportField(page, destination);
  if (await field.evaluate(element => element.tagName === "SELECT")) {
    await expect(field.locator("option")).toHaveCount(1);
  } else {
    await expect(field).toHaveValue("Arrival City");
    await expect(field).toHaveAttribute("selectedvalue", "");
  }
});

test("negative: adult count cannot be reduced below one", async ({ page }) => {
  await page.locator(passengers).click();
  await expect(page.locator("#hrefDecAdt")).toHaveClass(/pax-disabled/);
  await expect(page.locator("#spanAudlt")).toHaveText("1");
});

test("negative: child count cannot be reduced below zero", async ({ page }) => {
  await page.locator(passengers).click();
  await expect(page.locator("#hrefDecChd")).toHaveClass(/pax-disabled/);
  await expect(page.locator("#spanChild")).toHaveText("0");
});

test("negative: booking more than nine passengers shows a validation alert", async ({ page }) => {
  await page.locator(passengers).click();
  let alertText = "";
  page.on("dialog", async dialog => {
    alertText = dialog.message();
    await dialog.accept();
  });
  for (let count = 1; count < 9; count += 1) {
    await page.locator("#hrefIncAdt").click();
  }
  await page.locator("#hrefIncAdt").click();
  await expect.poll(() => alertText).toContain("maximum of 9 passengers");
});

test("negative: unmatched country text does not offer a selection", async ({ page }) => {
  await page.locator("#autosuggest").fill("not-a-real-country-xyz");
  await expect(page.locator(".ui-autocomplete:visible")).toHaveCount(0);
});
