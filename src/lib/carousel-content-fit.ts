import { getPattern, listPatterns, patternContentWarnings, applyPattern } from "./carousel-pattern-registry";
import { mediaWarnings } from "./carousel-slide-media";
import type { CarouselSlide, SlideImageAsset } from "./types";
export interface SlideFitReport { id: string; errors: string[]; notes: string[] }

export function cjkCopyWarnings(text: string) {
  const warnings: string[] = [];
  if (/^[，。！？、；：」』）】]/m.test(text)) warnings.push("A line begins with closing Chinese punctuation; review the line break.");
  if (/[「『（【]$/m.test(text)) warnings.push("A line ends with opening Chinese punctuation; review the line break.");
  if (text.includes("\n") && /\p{Script=Han}/u.test(text)) {
    const last=text.split("\n").at(-1)?.trim() ?? "";
    if (Array.from(last).length===1 && /\p{Script=Han}/u.test(last)) warnings.push("The final line has a single Chinese character; rebalance the copy.");
  }
  return warnings;
}

function renderedCjkWarnings(root: HTMLElement) {
  const warnings:string[]=[];
  for(const element of root.querySelectorAll<HTMLElement>("[data-content-text], h2, p")){
    if(!/\p{Script=Han}/u.test(element.textContent ?? ""))continue;
    const lines=new Map<number,string>();const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let node:Node|null;let count=0;
    while((node=walker.nextNode()) && count<1000){
      const text=node.textContent ?? "";let offset=0;
      for(const character of text){
        if(count>=1000)break;
        const range=document.createRange();range.setStart(node,offset);offset+=character.length;range.setEnd(node,offset);
        const rect=range.getBoundingClientRect();if(rect.width>0){const top=Math.round(rect.top);lines.set(top,(lines.get(top) ?? "")+character);}count++;
      }
    }
    const rendered=[...lines.values()].map(line=>line.trim()).filter(Boolean);
    if(rendered.some(line=>/^[，。！？、；：」』）】]/.test(line)))warnings.push("Review a Chinese punctuation mark at the beginning of a rendered line.");
    const last=rendered.at(-1) ?? "";
    if(rendered.length>1 && Array.from(last).length===1 && /\p{Script=Han}/u.test(last))warnings.push("The final rendered line has one Chinese character; rebalance the copy.");
  }
  return [...new Set(warnings)];
}

/** Measure actual text boxes at either preview or export scale. No character-count proxy. */
export function measureSlideFit(root: HTMLElement): string[] {
  const errors: string[] = []; const box = root.getBoundingClientRect();
  if (root.scrollHeight > root.clientHeight+1 || root.scrollWidth > root.clientWidth+1) errors.push("Content extends beyond the slide.");
  const texts=[...root.querySelectorAll<HTMLElement>("[data-content-text], h2, h3, p")];
  for (const text of texts) {
    if (!text.textContent?.trim()) continue;
    const r=text.getBoundingClientRect();
    if (r.left<box.left-1 || r.right>box.right+1 || r.top<box.top-1 || r.bottom>box.bottom+1 || text.scrollHeight>text.clientHeight+1 || text.scrollWidth>text.clientWidth+1) errors.push("Text is clipped or outside the slide.");
  }
  for(let i=0;i<texts.length;i++) for(let j=i+1;j<texts.length;j++) {
    const a=texts[i],b=texts[j];if(a.contains(b)||b.contains(a)||!a.textContent?.trim()||!b.textContent?.trim())continue;
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    if(Math.min(ar.right,br.right)-Math.max(ar.left,br.left)>2 && Math.min(ar.bottom,br.bottom)-Math.max(ar.top,br.top)>2)errors.push("Text blocks overlap.");
  }
  return [...new Set(errors)];
}

/** Adapt within the design's permitted scale bounds; callers surface every adaptation. */
export function fitSlide(root: HTMLElement) {
  const notes:string[]=[];
  const isPattern=root.dataset.layout==="pattern";
  if(isPattern){
    root.style.setProperty("--carousel-gap",root.dataset.baseGap ?? "32");
    root.style.setProperty("--carousel-heading-scale",root.dataset.headingScale ?? "1");
    root.style.setProperty("--carousel-body-scale",root.dataset.bodyScale ?? "1");
  }
  let errors=measureSlideFit(root);
  if(errors.length && isPattern){
    root.style.setProperty("--carousel-gap","20");errors=measureSlideFit(root);notes.push("Spacing tightened to keep the slide readable.");
    let heading=Number(root.dataset.headingScale ?? 1),body=Number(root.dataset.bodyScale ?? 1);
    while(errors.length && (heading>.8501 || body>.9001)){
      heading=Math.max(.85,Math.round((heading-.05)*100)/100);body=Math.max(.9,Math.round((body-.05)*100)/100);
      root.style.setProperty("--carousel-heading-scale",String(heading));root.style.setProperty("--carousel-body-scale",String(body));
      errors=measureSlideFit(root);
    }
    if(heading!==Number(root.dataset.headingScale ?? 1)||body!==Number(root.dataset.bodyScale ?? 1)) notes.push("Type adjusted within the permitted size range; body copy stays at least 32 px.");
  }
  return {errors,notes:[...notes,...renderedCjkWarnings(root)]};
}

export function compatibleFitAlternatives(slide: CarouselSlide, assets: SlideImageAsset[]) {
  const current=getPattern(slide.templateId)?.pattern;
  if(!current)return [];
  const density={light:0,balanced:1,dense:2};
  return listPatterns().filter(p=>p.id!==slide.templateId && p.pattern && density[p.pattern.density]<density[current.density] && current.requiredSlots.every(field=>p.pattern!.requiredSlots.includes(field)||p.pattern!.optionalSlots.includes(field))).filter(p=>{const candidate=applyPattern(slide,p.id);return !patternContentWarnings(candidate).length&&!mediaWarnings(candidate,assets).length;});
}

export async function prepareSlideCapture(elements: HTMLElement[]) {
  await document.fonts.ready;
  await Promise.all(elements.flatMap(el=>[...el.querySelectorAll("img")].map(async img=>{try{await img.decode();}catch{throw new Error("An image has not loaded. Replace it or retry before exporting.");}})));
  for(const el of elements){
    const root=el.matches("[data-carousel-template]")?el:el.querySelector<HTMLElement>("[data-carousel-template]");
    if(root){const result=fitSlide(root);if(result.errors.length)throw new Error("A slide has overflowing or overlapping text. Shorten the copy or choose a simpler layout before exporting.");}
  }
}
