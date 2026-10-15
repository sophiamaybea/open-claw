import test from 'node:test';
import assert from 'node:assert/strict';
import {rankIssues} from './bounty-hunter.mjs';
const sample={
 id:101,title:'Bounty: fix broken UI ($125)',html_url:'https://github.com/demo/widgets/issues/7',
 repository_url:'https://api.github.com/repos/demo/widgets',
 created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-12T00:00:00Z',
 labels:[{name:'bounty'},{name:'help wanted'}],body:'Payment of $125 only when merged; confirm sponsor.'
};
test('extract and flag unverified bounty, without inventing payout',()=>{
 const out=rankIssues([sample]);assert.equal(out.length,1);assert.equal(out[0].payoutMentionUSD,125);
 assert.equal(out[0].requiresHumanVerification,true);assert.match(out[0].status,/UNVERIFIED/);
});
test('deduplicate issue and ignore PRs, non github links',()=>{
 assert.equal(rankIssues([sample,sample,{...sample,id:102,pull_request:{url:'x'}},{...sample,id:103,html_url:'https://evil.invalid/bounty'}]).length,1);
});
test('suspicious upfront payment is rejected',()=>{
 const out=rankIssues([{...sample,id:104,body:'Pay a registration fee to apply. $200 reward.'}]);
 assert.equal(out[0].status,'REJECT / HIGH-RISK');
});

test('assigned bounty is ranked below the otherwise identical unassigned lead',()=>{
 const free={...sample,id:201,html_url:'https://github.com/demo/widgets/issues/201',assignees:[],comments:1};
 const taken={...sample,id:202,html_url:'https://github.com/demo/widgets/issues/202',assignees:[{login:'claimed-developer'}],comments:45};
 const out=rankIssues([taken,free]);
 assert.equal(out[0].id,201);
 assert.equal(out[1].status,'ALREADY ASSIGNED — VERIFY AVAILABILITY');
 assert.deepEqual(out[1].assignees,['claimed-developer']);
});
