import { test, expect } from "@playwright/test";
import { fixtureCarousel } from "../src/lib/carousel-fixture-decks";
import { readFileSync } from "node:fs";

test("brand heading and body typography persist independently", async ({ page, request }) => {
  const id = `typography-check-${Date.now()}`;
  const response = await request.post("/api/presets", { data: { preset: { id, name: "Typography check", voice: "Direct", audience: "Builders", cta: "Save", handle: "@check", primaryColor: "#123456", secondaryColor: "#654321", defaultWritingStyle: "educational" } } });
  expect(response.ok()).toBe(true);
  try {
    await page.goto(`/settings/brands/${id}`);
    await page.getByLabel("Heading font").selectOption("lora");
    await page.getByLabel("Body font").selectOption("inter");
    await page.getByRole("button", { name: "Save brand", exact: true }).click();
    await expect(page.getByText("Saved Typography check.", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Heading font")).toHaveValue("lora");
    await expect(page.getByLabel("Body font")).toHaveValue("inter");
    await page.evaluate(() => document.fonts.ready);
    const family = await page.getByText("Make your ideas clear / 讓想法更清晰").evaluate(el => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toContain("lora");
    await page.screenshot({ path: "test-results/brand-typography.png", fullPage: true });
  } finally {
    await request.delete("/api/presets", { data: { id } });
  }
});

test("image upload, crop controls and shared asset retention", async ({ page, request }) => {
  let assetId = ""; const draftId = `media-check-${Date.now()}`;
  try {
    await page.goto("/dev/carousel-fixtures");
    await page.getByRole("button", { name: "Load missing-images", exact: true }).click();
    await page.getByRole("button", { name: "Export PDF", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Add an image" })).toContainText("Add an image");
    const responsePromise = page.waitForResponse(r => r.url().endsWith("/api/image-assets") && r.request().method() === "POST");
    await page.getByLabel("Upload hero-right", { exact: true }).setInputFiles("public/fixtures/carousel-proof.png");
    const response = await responsePromise; expect(response.ok()).toBe(true);
    const { asset } = await response.json(); assetId = asset.id;
    await expect(page.getByLabel("Use saved image for hero-right", { exact: true })).toHaveValue(assetId);
    await page.getByLabel("Horizontal focus for hero-right", { exact: true }).focus();
    await page.keyboard.press("End");
    await expect(page.locator('[data-image-slot="hero-right"] img').first()).toHaveCSS("object-position","100% 50%");
    const deck = fixtureCarousel("en");
    deck.slides[0].media = [{ slotId: "hero-right", assetId, focalPoint: { x: 1,y: .5 }, zoom: 1.5 }];
    deck.slides[1].media = [{ slotId: "hero-right", assetId, focalPoint: { x: .5,y: .5 }, zoom: 1 }];
    const saved = await request.post("/api/drafts", { data: { draft: { id: draftId, title: "Media retention check", sourcePost: {}, idea: {}, igCarousel: deck } } });
    expect(saved.ok()).toBe(true);
    expect((await request.delete(`/api/image-assets/${assetId}`)).status()).toBe(409);
    const loaded = await request.get("/api/drafts"); const data = await loaded.json();
    const draft = data.drafts.find((d: { id: string }) => d.id === draftId);
    expect(draft.igCarousel.slides[0].media[0].focalPoint.x).toBe(1);
    expect((await request.get(`/api/image-assets/${assetId}`)).headers()["content-type"]).toBe("image/webp");
    const invalid = await request.post("/api/image-assets", { multipart: { file: { name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not an image") } } });
    expect(invalid.status()).toBe(400);
  } finally {
    await request.delete(`/api/drafts?id=${draftId}`);
    if (assetId) await request.delete(`/api/image-assets/${assetId}`);
  }
});

test("captures real production pattern fixtures at full resolution", async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await page.getByRole("button", { name: "Load en", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  const specimens = page.locator('[data-specimen]');
  await expect(specimens).toHaveCount(9);
  for (const specimen of await specimens.all()) {
    const id = await specimen.getAttribute("data-specimen");
    await specimen.locator("article").evaluate(el => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.id = "golden-capture";
      Object.assign(copy.style,{ position: "fixed",left: "0",top: "0",zIndex: "2147483647",transform: "none" });
      document.body.appendChild(copy);
    });
    await expect(page.locator("#golden-capture")).toHaveScreenshot(`${id}.png`,{ animations: "disabled", maxDiffPixelRatio: .01 });
    await page.locator("#golden-capture").evaluate(el => el.remove());
    await expect(specimen.locator('[data-layout="pattern"]')).toHaveCount(1);
  }
});

test("keyboard deck commands keep focus and count limits", async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await page.getByRole("button", { name: "Move right", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await expect(page.getByText("Slide 2 (body)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate slide", exact: true }).click();
  await expect(page.getByText("6 slides", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue("Clear idea 1");
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await expect(page.getByText("5 slides", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete slide", exact: true })).toBeDisabled();
  await expect(page.getByText("3 slides", { exact: true })).toBeVisible();
});


test("maximum permitted CJK content fits all nine portrait patterns", async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await page.getByRole("button",{name:"Load maximum-content",exact:true}).click();
  await page.evaluate(() => document.fonts.ready);
  for (const article of await page.locator("[data-specimen] article").all()) {
    const bounds = await article.evaluate(el => ({id:el.getAttribute("data-carousel-template"),height:el.scrollHeight,width:el.scrollWidth}));
    expect(bounds.height,bounds.id ?? "").toBeLessThanOrEqual(1350);
    expect(bounds.width,bounds.id ?? "").toBeLessThanOrEqual(1080);
  }
});

test("reference traits require review before saving and exclude the source image", async ({ request }) => {
  let templateId="";
  try {
    const response=await request.post("/api/style-extract",{data:{imageDataUrl:`data:image/png;base64,${readFileSync("public/fixtures/carousel-proof.png").toString("base64")}`,name:"@creator Reference check",useAsBackdrop:true}});
    expect(response.ok()).toBe(true);const {template,analysis,requiresConfirmation}=await response.json();
    expect(requiresConfirmation).toBe(true);expect(template.backdropImageUrl).toBeUndefined();expect(template.name).not.toContain("@creator");
    expect(Object.keys(analysis)).not.toContain("creator");
    expect((await request.post("/api/templates",{data:{template}})).status()).toBe(409);
    const saved=await request.post("/api/templates",{data:{template,confirmReference:true}});expect(saved.ok()).toBe(true);templateId=(await saved.json()).template.id;
  }finally{if(templateId)await request.delete(`/api/templates?id=${templateId}`);}
});

test("Agent Chat creates both carousel formats from a brief", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Agent Chat — create carousels from a brief",{exact:true}).click();
  await page.getByLabel("Carousel brief",{exact:true}).fill("Explain three ways to make a project brief clearer: define the audience, state the outcome, and show evidence. Use only these facts.");
  await page.getByRole("button",{name:"Create carousels from brief",exact:true}).click();
  await expect(page.getByRole("tab",{name:"Instagram Carousel",exact:true})).toBeVisible({timeout:60000});
  await expect(page.getByRole("tab",{name:"LinkedIn Carousel",exact:true})).toBeVisible();
  await expect(page.getByRole("status").filter({hasText:/Created/})).toBeVisible();
});
