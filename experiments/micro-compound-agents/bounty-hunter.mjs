/**
 * Opportunity Hunter: public GitHub bounty discovery only.
 * Never submits applications, opens paid accounts, sends messages, spends money or claims an award.
 * Payouts are UNVERIFIED indications in issue text; confirm sponsor and acceptance rules manually.
 */
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const queries=[
 'is:issue is:open label:bounty',
 'is:issue is:open bounty in:title',
 'is:issue is:open "algora" in:body',
 'is:issue is:open "USDC" "bounty"'
];
const now=Date.now(),env=process.env;
const token=env.GITHUB_TOKEN;
const headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'MicroCompound-OpportunityHunter/1.0',...(token?{'Authorization':'Bearer '+token}:{})};
function amounts(text){
 const list=[...String(text).matchAll(/(?:US\$|USD\s*|\$\s*)([1-9]\d{0,5}(?:,\d{3})*(?:\.\d{1,2})?)\b/gi)]
 .map(m=>Number(m[1].replaceAll(',',''))).filter(n=>n>=5&&n<=1e6);
 return list.length?Math.max(...list):null;
}
function classify(i){
 const title=String(i.title||'').slice(0,220);
 const body=String(i.body||'').slice(0,4500);
 const labels=(i.labels||[]).map(l=>String(typeof l==='string'?l:l.name).toLowerCase());
 const t=(title+' '+body+' '+labels.join(' ')).toLowerCase();
 const upfront=/(registration fee|pay.*to apply|deposit.*first|send.*private key|seed phrase|wallet recovery|upfront.*fee)/i.test(t);
 const aggregator=/(bounty[- ]?radar|bounty[- ]?scout|bounty alert|external[- ]?mirror|opportunity aggregator|index of bounties)/i.test(t);
 const proposed=/(bounty proposal|reward proposed|proposed bounty|\$\d+ proposed)/i.test(title);
 const hugeClaim=payout=>payout!==null && payout>20000;
 const payout=amounts(title+' '+body);
 const ageDays=(now-Date.parse(i.created_at||now))/864e5;
 const recent=(now-Date.parse(i.updated_at||now))/864e5;
 const bountyFlag=labels.some(l=>l.includes('bounty'))||/\bbounty\b/i.test(title);
 let score=20;
 if(bountyFlag)score+=18;
 if(payout!==null)score+=Math.min(22,Math.round(Math.log2(payout+1)*2));
 if(labels.includes('help wanted'))score+=5;
 if(recent<7)score+=12;
 else if(recent<30)score+=7;
 if(ageDays>120)score-=14;
 if(/documentation|docs|readme|translation|frontend|bugfix|bug fix|ui\b/i.test(t))score+=5;
 if(upfront)score-=100;
 if(aggregator)score-=45;
 if(proposed)score-=25;
 if(hugeClaim(payout))score-=28;
 const status=upfront?'REJECT / HIGH-RISK':aggregator?'AGGREGATED LEAD — TRACE ORIGINAL SOURCE':proposed?'PROPOSAL — FUNDING NOT CONFIRMED':hugeClaim(payout)?'LARGE CLAIM — INDEPENDENT VERIFICATION NEEDED':payout!==null&&bountyFlag?'POTENTIAL PAYOUT — UNVERIFIED':'VERIFY REWARD AND ELIGIBILITY';
 const repo=(new URL(i.repository_url||'https://api.github.com/repos/unknown/repository')).pathname.replace('/repos/','');
 return {id:i.id,title,html_url:i.html_url,repository:repo,created_at:i.created_at,updated_at:i.updated_at,
  payoutMentionUSD:payout,labels:labels.slice(0,10),score,status,requiresHumanVerification:true,source:'Public GitHub issue',excerpt:body.replace(/\s+/g,' ').slice(0,280)};
}
export function rankIssues(items){
 const seen=new Set(),out=[];
 for(const i of items){if(!i||!i.html_url||!String(i.html_url).startsWith('https://github.com/'))continue;
  if(i.pull_request||seen.has(i.id))continue;seen.add(i.id);out.push(classify(i));}
 return out.sort((a,b)=>b.score-a.score||Date.parse(b.updated_at)-Date.parse(a.updated_at)).slice(0,60);
}
async function search(q){
 const url='https://api.github.com/search/issues?per_page=80&sort=updated&order=desc&q='+encodeURIComponent(q);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(url,{headers,signal:controller.signal});
  if(!response.ok)throw Error('GitHub issue search failed '+response.status+' '+q);
  const data=await response.json();return Array.isArray(data.items)?data.items:[];
 } finally{clearTimeout(timer);}
}
export async function main(){
 const fetched=await Promise.allSettled(queries.map(search));
 const ok=fetched.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
 const errors=fetched.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason));
 const ranked=rankIssues(ok);
 const document={updatedAt:new Date().toISOString(),state:errors.length?'PARTIAL':'RESEARCH_READY',
  sources:['GitHub issue search'],searchedQueries:queries,results:ranked.length,scanCount:ok.length,errors,opportunities:ranked,
  disclaimer:'No verified payouts or earnings; these are public issue candidates. Manually confirm funding, assignment, eligibility, security and payment terms. Never pay to join, disclose secrets or begin work without terms.'};
 const dest=join(here,'site','bounties.json');await mkdir(dirname(dest),{recursive:true});
 await writeFile(dest,JSON.stringify(document,null,2)+'\n');console.log(JSON.stringify({state:document.state,opportunities:ranked.length,errors}).slice(0,2500));
 if(fetched.every(x=>x.status==='rejected'))process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await main();
