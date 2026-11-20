import { test, expect } from "@playwright/test";
import { fixtureCarousel } from "../src/lib/carousel-fixture-decks";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import type { Download } from "@playwright/test";

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


for(const contentCase of ["maximum-content","maximum-english","mixed","missing-images"]) test(`portrait pattern fit for ${contentCase}`, async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await page.getByRole("button",{name:`Load ${contentCase}`,exact:true}).click();
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

for (const scenario of [{name:"legacy",count:5,load:""},{name:"cjk",count:9,load:"zh-Hant"}]) {
 test(`downloads full-resolution PNGs and PDF for ${scenario.name}`, async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("/dev/carousel-fixtures");
  if(scenario.load)await page.getByRole("button",{name:`Load ${scenario.load}`,exact:true}).click();
  const downloads:Download[]=[];page.on("download",d=>downloads.push(d));
  await page.getByRole("button",{name:"Export PNGs",exact:true}).click();
  await expect.poll(()=>downloads.length,{timeout:120000}).toBe(scenario.count);
  for(let i=0;i<scenario.count;i++){
    const path=`test-results/export-${scenario.name}-slide-${i+1}.png`;await downloads[i].saveAs(path);
    const meta=await sharp(path).metadata();expect(meta.width).toBe(1080);expect(meta.height).toBe(1350);
  }
  await page.locator('div[aria-hidden="true"] [data-carousel-template]').first().evaluate(el=>{
    const copy=el.cloneNode(true) as HTMLElement;copy.id="export-preview-capture";
    Object.assign(copy.style,{position:"fixed",left:"0",top:"0",zIndex:"2147483647",transform:"none"});document.body.appendChild(copy);
  });
  await page.locator("#export-preview-capture").screenshot({path:`test-results/preview-${scenario.name}.png`});
  await page.locator("#export-preview-capture").evaluate(el=>el.remove());
  const png=await sharp(`test-results/export-${scenario.name}-slide-1.png`).removeAlpha().raw().toBuffer();
  const preview=await sharp(`test-results/preview-${scenario.name}.png`).removeAlpha().raw().toBuffer();
  expect(png.length).toBe(preview.length);
  let difference=0;for(let i=0;i<png.length;i++)difference+=Math.abs(png[i]-preview[i]);
  expect(difference/png.length).toBeLessThan(1.5);
  console.log(`${scenario.name} preview/PNG mean channel difference: ${difference/png.length}`);
  await expect(page.getByRole("button",{name:"Export PDF",exact:true})).toBeEnabled();
  const pending=page.waitForEvent("download");await page.getByRole("button",{name:"Export PDF",exact:true}).click();
  const pdf=await pending;const pdfPath=`test-results/export-${scenario.name}-carousel.pdf`;await pdf.saveAs(pdfPath);
  const bytes=readFileSync(pdfPath);
  expect(bytes.subarray(0,4).toString()).toBe("%PDF");
  expect(bytes.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(scenario.count);
 });
}

test("long copy is reported and cannot silently export clipped slides", async ({ page }) => {
  await page.goto("/dev/carousel-fixtures");
  await page.getByLabel("Headline",{exact:true}).fill("Long heading ".repeat(200));
  await expect(page.getByRole("status").filter({hasText:/clipped|beyond|overlap/}).first()).toBeVisible();
  await page.getByRole("button",{name:"Export PDF",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:/overflowing|overlapping/})).toBeVisible();
});

for(const mode of ["light","dark"]) test(`golden patterns in ${mode} mode`,async({page})=>{
  await page.goto("/dev/carousel-fixtures");
  await page.getByRole("button",{name:"Load en",exact:true}).click();
  await page.getByRole("button",{name:`Use ${mode} mode`,exact:true}).click();
  await page.evaluate(()=>document.fonts.ready);
  for(const specimen of await page.locator("[data-specimen]").all()){
    const id=await specimen.getAttribute("data-specimen");
    await specimen.locator("article").evaluate(el=>{const copy=el.cloneNode(true) as HTMLElement;copy.id="mode-capture";Object.assign(copy.style,{position:"fixed",left:"0",top:"0",zIndex:"2147483647",transform:"none"});document.body.appendChild(copy);});
    await expect(page.locator("#mode-capture")).toHaveScreenshot(`${id}-${mode}.png`,{animations:"disabled",maxDiffPixelRatio:.01});
    await page.locator("#mode-capture").evaluate(el=>el.remove());
  }
});

test("large brand type adapts within permitted bounds without lowering body text below 32px",async({page})=>{
  await page.goto("/dev/carousel-fixtures");await page.getByRole("button",{name:"Load maximum-content",exact:true}).click();
  await page.getByRole("button",{name:"Use large brand type",exact:true}).click();
  const roots=page.locator('div[aria-hidden="true"] [data-layout="pattern"]');
  await expect.poll(async()=>roots.evaluateAll(nodes=>nodes.every(el=>el.scrollHeight<=el.clientHeight+1)),{timeout:10000}).toBe(true);
  const sizes=await roots.evaluateAll(nodes=>nodes.flatMap(el=>[...el.querySelectorAll('[data-content-text]')].map(text=>Number.parseFloat(getComputedStyle(text).fontSize))));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(32);
});
