const fontDownloads = new Map<string,Promise<string>>();
function usesCharacters(range: string, characters: number[]) {
  if(!range)return true;
  return range.split(",").some(part=>{
    const value=part.trim().replace(/^U\+/i,"");
    const [from,to]=value.includes("?") ? [value.replaceAll("?","0"),value.replaceAll("?","F")] : value.split("-");
    const min=Number.parseInt(from,16),max=Number.parseInt(to ?? from,16);
    return characters.some(c=>c>=min&&c<=max);
  });
}
function base64(buffer: ArrayBuffer) {
  const bytes=new Uint8Array(buffer);let binary="";
  for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return btoa(binary);
}

/** Embed only actual computed families and needed Unicode subsets, including CJK. */
export async function slideFontEmbedCss(element: HTMLElement) {
  const normalize=(value:string)=>value.trim().replace(/["']/g,"");
  const families=new Set([element,...element.querySelectorAll<HTMLElement>("*")].flatMap(el=>getComputedStyle(el).fontFamily.split(",").map(normalize)));
  const characters=[...new Set(Array.from(element.textContent ?? "").map(c=>c.codePointAt(0)!))];
  const rules:CSSFontFaceRule[]=[];
  for(const sheet of document.styleSheets){
    try{for(const rule of sheet.cssRules)if(rule.type===CSSRule.FONT_FACE_RULE)rules.push(rule as CSSFontFaceRule);}catch{continue;}
  }
  return (await Promise.all(rules.filter(rule=>families.has(normalize(rule.style.fontFamily))&&usesCharacters(rule.style.getPropertyValue("unicode-range"),characters)).map(async rule=>{
    let css=rule.cssText;
    const urls=[...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
    for(const match of urls){
      const url=new URL(match[1],rule.parentStyleSheet?.href ?? location.href).href;
      let download=fontDownloads.get(url);
      if(!download){download=fetch(url).then(async response=>{if(!response.ok)throw new Error("A font could not be loaded for export.");return `data:font/woff2;base64,${base64(await response.arrayBuffer())}`;}).catch(error=>{fontDownloads.delete(url);throw error;});fontDownloads.set(url,download);}
      css=css.replace(match[0],`url("${await download}")`);
    }
    return css;
  }))).join("\n");
}
