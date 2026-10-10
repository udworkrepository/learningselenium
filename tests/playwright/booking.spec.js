const { test, expect } = require("@playwright/test");
const origin = "#ctl00_mainContent_ddl_originStation1";
const destination = "#ctl00_mainContent_ddl_destinationStation1";
const pax = "#divpaxinfo";
const id = n => `TC-${String(n).padStart(4, "0")}`;

async function field(page, selector) {
  const legacy = page.locator(selector);
  return await legacy.count() && await legacy.isVisible() ? legacy : page.locator(`${selector}_CTXT`);
}

async function airport(page, selector, label) {
  const el = await field(page, selector), code = label.match(/\(([^)]+)\)/)[1];
  if (await el.evaluate(e => e.tagName === "SELECT")) return el.selectOption({ label });
  await el.click();
  await page.keyboard.type(label.slice(0, label.lastIndexOf(" (")));
  await page.locator(`#gls${selector.slice(1)}_CTNR a[value="${code}"]:visible`).click();
}

const scenarios = [
  ["positive: booking page loads with one-way selected", async p => {
    await expect(p).toHaveTitle(/QAClickJet/);
    await expect(p.locator("#ctl00_mainContent_rbtnl_Trip_0")).toBeChecked();
  }],
  ["positive: departure list contains Mumbai", async p => {
    const el = await field(p, origin);
    if (await el.evaluate(e => e.tagName === "SELECT")) await expect(el.locator("option", { hasText: "Mumbai (BOM)" })).toHaveCount(1);
    else {
      await el.click(); await p.keyboard.type("Mumbai");
      await expect(p.locator(`#gls${origin.slice(1)}_CTNR a[value="BOM"]:visible`)).toBeVisible();
    }
  }],
  ["positive: selecting Mumbai loads arrival choices", async p => {
    await airport(p, origin, "Mumbai (BOM)");
    const el = await field(p, destination);
    if (await el.evaluate(e => e.tagName === "SELECT")) await expect(el.locator("option", { hasText: "Delhi (DEL)" })).toHaveCount(1);
    else {
      await el.click();
      await expect(p.locator(`#gls${destination.slice(1)}_CTNR a[value="DEL"]:visible`)).toBeVisible();
    }
  }],
  ["positive: arrival autocomplete offers Delhi after departure", async p => {
    await airport(p, origin, "Mumbai (BOM)");
    const el = await field(p, destination);
    if (await el.evaluate(e => e.tagName === "SELECT")) {
      await el.selectOption({ label: "Delhi (DEL)" }); await expect(el).toHaveValue("DEL");
    } else {
      await el.click(); await p.keyboard.type("Delhi");
      await expect(p.locator(`#gls${destination.slice(1)}_CTNR a[value="DEL"]:visible`)).toBeVisible();
    }
  }],
  ...[["Round trip", 1], ["One-way", 0], ["Multicity", 2]].map(([name, n]) => [
    `positive: ${name} can be selected`, async p => {
      if (n === 0) await p.locator("#ctl00_mainContent_rbtnl_Trip_1").check();
      await p.locator(`#ctl00_mainContent_rbtnl_Trip_${n}`).check();
      await expect(p.locator(`#ctl00_mainContent_rbtnl_Trip_${n}`)).toBeChecked();
    }
  ]),
  ...["USD", "AED"].map(currency => [`positive: ${currency} currency can be selected`, async p => {
    const el = p.locator("#ctl00_mainContent_DropDownListCurrency");
    await el.selectOption(currency); await expect(el).toHaveValue(currency);
  }]),
  ["positive: fare preference checkboxes can be enabled", async p => {
    for (const selector of ["friendsandfamily", "SeniorCitizenDiscount", "StudentDiscount", "IndArm"]) {
      const el = p.locator(`#ctl00_mainContent_chk_${selector}`);
      await el.check(); await expect(el).toBeChecked();
    }
  }],
  ["positive: country autocomplete selects India", async p => {
    const el = p.locator("#autosuggest");
    await el.fill("Ind"); await p.getByText("India", { exact: true }).click(); await expect(el).toHaveValue("India");
  }],
  ...[["Adult", "Adt", "2 Adult"], ["Child", "Chd", "1 Child"], ["Infant", "Inf", "1 Infant"]]
    .map(([name, code, expected]) => [`positive: ${name.toLowerCase()} count can be increased`, async p => {
      await p.locator(pax).click(); await p.locator(`#hrefInc${code}`).click();
      await p.locator("#btnclosepaxoption").click(); await expect(p.locator(pax)).toContainText(expected);
    }]),
  ["positive: departure and return date controls are available", async p => {
    for (const n of [1, 2]) {
      const el = p.locator(`#ctl00_mainContent_view_date${n}`);
      await expect(el).toBeVisible(); await expect(el).toBeEnabled();
    }
  }],
  ["negative: arrival choices unavailable before departure", async p => {
    const el = await field(p, destination);
    if (await el.evaluate(e => e.tagName === "SELECT")) await expect(el.locator("option")).toHaveCount(1);
    else {
      await expect(el).toHaveValue("Arrival City");
      await expect(el).toHaveAttribute("selectedvalue", "");
    }
  }],
  ...[["adult", "Adt", "spanAudlt", "1"], ["child", "Chd", "spanChild", "0"]]
    .map(([name, code, countId, count]) => [`negative: ${name} count cannot go below ${count}`, async p => {
      await p.locator(pax).click();
      await expect(p.locator(`#hrefDec${code}`)).toHaveClass(/pax-disabled/);
      await expect(p.locator(`#${countId}`)).toHaveText(count);
    }]),
  ["negative: more than nine passengers shows an alert", async p => {
    await p.locator(pax).click();
    let message = "";
    p.on("dialog", async d => { message = d.message(); await d.accept(); });
    for (let n = 1; n <= 9; n++) await p.locator("#hrefIncAdt").click();
    await expect.poll(() => message).toContain("maximum of 9 passengers");
  }],
  ["negative: unmatched country text offers no selection", async p => {
    await p.locator("#autosuggest").fill("not-a-real-country-xyz");
    await expect(p.locator(".ui-autocomplete:visible")).toHaveCount(0);
  }]
];

test.beforeEach(async ({ page }) => page.goto("/dropdownsPractise/", { waitUntil: "domcontentloaded" }));
for (const [n, [name, run]] of scenarios.entries()) test(`${id(n + 1)}: ${name}`, ({ page }) => run(page));
