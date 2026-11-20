// Preparation references only. Production renderers replace these captures in Phase 4.3.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("src/lib/carousel-templates/manifest.v1.json", root), "utf8"));
const decks = JSON.parse(await readFile(new URL("src/lib/carousel-templates/fixtures/decks.json", root), "utf8"));
const output = new URL("docs/carousel-phase-4-0/golden/", root);
await mkdir(output, { recursive: true });
const ink = "#202124", accent = "#BD4A28", muted = "#65635D";
const esc = text => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const rect = (x,y,w,h,fill=ink) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${fill}"/>`;
const text = (value,x,y,size=36,fill=ink,weight=500,font="Arial, Microsoft JhengHei, sans-serif") => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(value)}</text>`;
const line = (x,y,x2,y2) => `<path d="M${x} ${y}L${x2} ${y2}" stroke="${accent}" stroke-width="5"/>`;
const node = (n,x,y) => `<circle cx="${x}" cy="${y}" r="26" fill="${accent}"/>${text(n,x-10,y+11,30,"#fff",700)}`;
const image = (slot,x,y,w,h) => rect(x,y,w,h,"#E0DFD8") + rect(x+18,y+18,w-36,Math.min(38,h*.15),"#CBCAC2") + text(slot,x+16,y+h*.60,Math.min(24,w/8),muted) + line(x+18,y+h*.82,x+w-18,y+h*.7);
const index = [];
for (const template of manifest.templates.filter(t => t.pattern?.release === "first")) {
  const p = template.pattern;
  const sample = decks.find(d => d.id === "en").slides.find(s => s.templateId === template.id);
  const serif = p.familyId !== "editorial-signal";
  const headingFont = serif ? "Georgia, Microsoft JhengHei, serif" : "Arial, Microsoft JhengHei, sans-serif";
  let body = "";
  const items = sample.items ?? [];
  switch(template.id) {
    case "signal-statement":
      body = text("One useful idea",80,570,80,ink,700)+text("changes the next step.",80,675,72,accent,700)+text(sample.body,80,800); break;
    case "signal-cta":
      body = text("Put the idea to work.",80,580,76,ink,700)+rect(80,720,520,110,accent)+text("Save it. Try it today.",115,790,40,"#fff",700); break;
    case "signal-numbered-list":
      body = items.map((item,i) => rect(80,400+i*225,920,195)+node(i+1,135,455+i*225)+text(["Define the outcome","Choose the evidence","Make the next move"][i],190,465+i*225,40,"#fff",700)+text(item.body,190,530+i*225,36,"#E9E6DF")).join(""); break;
    case "signal-vertical-timeline":
      body = line(115,410,115,1100)+items.map((_,i) => node(i+1,115,425+i*130)+text(["Define","Gather","Choose","Build","Review","Ship"][i],180,438+i*130,38,ink,700)+text("One clear action at a time",180,485+i*130,32,muted)).join(""); break;
    case "signal-horizontal-timeline":
      body = line(130,690,950,690)+items.map((_,i) => {const x=130+i*205; return node(i+1,x,690)+text(["Define","Gather","Build","Review","Ship"][i],x-45,i%2?800:610,30,ink,700)+image(`timeline-${i+1}`,x-50,i%2?850:425,100,110);}).join("")+text("A complete journey at a glance",80,1100,36,muted); break;
    case "spec-ab-comparison":
      body = ["A / Before","B / After"].map((label,i)=>rect(80+i*475,430,445,650,i?"#EAD6CD":"#E6E3DB")+text(label,110+i*475,500,38,ink,700)+image(`example-${i?"b":"a"}`,110+i*475,540,385,300)+text(i?"A deliberate choice":"A generic starting point",110+i*475,915,26)+text("Evidence, then a decision.",110+i*475,970,24,muted)).join(""); break;
    case "signal-metric-evidence":
      body = text("42%",80,490,150,accent,800)+text("Illustrative metric",80,560,38)+image("evidence-left",80,650,450,420)+items.map((_,i)=>rect(575,650+i*105,425,80,"#E3DFD4")+text(`Outcome ${i+1}`,600,702+i*105,32)).join(""); break;
    case "signal-collage-cover":
      body = text("A workflow",80,460,80,ink,700)+text("you can reuse.",80,560,80,accent,700)+image("hero-right",530,640,470,460)+image("support-bottom-center",320,950,340,190)+image("support-bottom-right",700,1010,300,180)+text("01  Clear input",80,760,34)+text("02  Useful proof",80,830,34)+text("03  Next action",80,900,34); break;
    case "story-prompt-outcome":
      body = rect(80,370,920,145,"#E7DDCE")+text("Turn my brief into a useful result",110,455,38)+line(540,535,540,590)+image("result-preview",130,610,820,360)+items.map((_,i)=>node(i+1,140+i*260,1070)+text(["Brief","Build","Refine","Deliver"][i],95+i*260,1150,30)).join(""); break;
    default: throw new Error(`Missing reference composition: ${template.id}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">${rect(0,0,1080,1350,"#F5F1E8")}${text("REPOSTUDIO / DESIGN REFERENCE",80,90,24,muted,600)}${text("01 / 09",875,90,24,muted)}${line(80,130,1000,130)}${text(template.id.replace(/^(signal|spec|story)-/,"").replaceAll("-"," ").toUpperCase(),80,240,48,ink,700,headingFont)}${body}${line(80,1230,1000,1230)}${text("PHASE 4.0 / REFERENCE ONLY",80,1290,24,muted)}${text("→",950,1290,36,accent)}</svg>`;
  await writeFile(new URL(`${template.id}.svg`,output),svg);
  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(`${template.id}.png`,output)));
  index.push({templateId:template.id,width:1080,height:1350,kind:"design-reference",typography:{heading:headingFont,headerSize:48,displaySizes:[72,76,80],headingWeight:700,body:"Arial, Microsoft JhengHei, sans-serif",bodySize:36,bodyWeight:500,metadataSizes:[24,26,30,32],note:"Exact sizes are recorded in each SVG; metric uses 150 px / 800."},imageBehavior:p.imageSlots.length ? p.imageSlots.map(s=>`${s.id}: ${s.fit}; ${s.required?"required (missing blocks production)":"optional (absent leaves no frame)"}; focal point 0.5/0.5`) : ["No image controls or frames"],productionRenderer:"pending Phase 4.3"});
}
await writeFile(new URL("index.json",output),JSON.stringify(index,null,2)+"\n");
console.log(`Wrote ${index.length} design references at 1080 × 1350.`);
