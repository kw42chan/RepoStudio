import { chromium } from "playwright";
import { mkdir,writeFile } from "node:fs/promises";
const browser=await chromium.launch();
const page=await browser.newPage();
page.setDefaultTimeout(45000);
const rows=[];
const cases=[
  ["X","https://x.com/jack/status/1833951636005552366","We reject: kings, presidents, and voting."],
  ["LinkedIn","https://www.linkedin.com/feed/update/urn:li:activity:7496582593438523392","campaign brief checklist"],
  ["Instagram","https://www.instagram.com/p/C8QJv0sR0eY/",null],
  ["Threads","https://www.threads.net/@mosseri",null],
  ["Video transcript",null,"[00:00:01] The offer was weak, so more ads could not save it.\n[00:00:04] Rewriting the first line made the same budget convert."],
  ["YouTube","https://www.youtube.com/watch?v=jNQXAC9IVRw",null],
];
try {for(const [source,url,expected] of cases){
  const row={source,load:"Fail",ideas:"Not run",angles:"Not run",detail:""};
  try{
    await page.goto("http://localhost:3100/");
    const copied=page.getByPlaceholder("Paste the post you want to repurpose here...");
    if(url){
      await page.getByPlaceholder("https://www.linkedin.com/posts/...").fill(url);
      const pending=page.waitForResponse(r=>r.url().endsWith("/api/source-fetch"));
      await page.getByRole("button",{name:"Load link",exact:true}).click();
      const response=await pending;const data=await response.json();
      if(!response.ok()){row.detail=data.error;rows.push(row);console.log(JSON.stringify(row));continue;}
      const text=await copied.inputValue();row.detail=text.slice(0,350);
      if(source==="Threads"&&/followers|log in|sign up/i.test(text)){rows.push(row);console.log(JSON.stringify(row));continue;}
      if(expected&&!text.includes(expected)){rows.push(row);console.log(JSON.stringify(row));continue;}
      if(text.trim().length<20){rows.push(row);console.log(JSON.stringify(row));continue;}
      row.load="Pass";
    }else{await copied.fill(expected);row.load="Pass (paste)";}
    const pendingIdeas=page.waitForResponse(r=>r.url().endsWith("/api/ideate"));
    await page.getByRole("button",{name:"Generate Repurpose Ideas",exact:true}).click();
    const response=await pendingIdeas;const data=await response.json();
    if(!response.ok()){row.detail=data.error;rows.push(row);console.log(JSON.stringify(row));continue;}
    row.ideas="Pass";row.detail+=` Key insight: ${data.sourceAnalysis.keyInsight}`;
    const openings=[];
    for(const idea of data.ideas.slice(0,2)){
      await page.getByRole("button").filter({has:page.getByRole("heading",{name:idea.title,exact:true})}).click();
      const generated=page.waitForResponse(r=>r.url().endsWith("/api/generate")&&r.request().postDataJSON()?.formats?.includes("reel"));
      await page.getByRole("button",{name:"Generate selected angle",exact:true}).click();
      const reelData=await(await generated).json();
      openings.push(reelData.reel?.beats?.[0]?.spokenLine ?? "");
      if(reelData.reel?.beats?.some(b=>/\[\d\d:\d\d:\d\d\]/.test(b.spokenLine)))row.angles="Fail: timestamps remain in beats";
      await page.getByRole("button",{name:"Generate selected angle",exact:true}).waitFor({state:"visible"});
      await page.waitForFunction(()=>![...document.querySelectorAll('button')].some(b=>b.textContent?.includes("Writing content...")));
    }
    if(!row.angles.startsWith("Fail"))row.angles=openings[0]&&openings[0]!==openings[1]?"Pass":"Fail: identical openings";
    row.detail+=` Openings: ${openings.join(" | ")}`;
  }catch(e){row.detail+=` ${String(e).slice(0,350)}`;}
  rows.push(row);console.log(JSON.stringify(row));
}}finally{await browser.close();await mkdir("test-results",{recursive:true});await writeFile("test-results/source-flow.json",JSON.stringify(rows,null,2));}
