import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
process.env.BOUNTY_BRIDGE_TOKEN="q".repeat(44);
process.env.OPENCLAW_GATEWAY_TOKEN="g".repeat(44);
process.env.OPENCLAW_GATEWAY_URL="http://127.0.0.1:18789";
const {createHandler}=await import("../server.mjs");
const server=createServer(createHandler());
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const token="Bearer "+process.env.BOUNTY_BRIDGE_TOKEN;
test.after(async()=>{await new Promise(resolve=>server.close(resolve))});
test("health readiness contains no token",async()=>{
 const response=await fetch(base+"/healthz");const body=await response.json();
 assert.equal(response.status,200);assert.equal(body.ready,true);
 assert.ok(!JSON.stringify(body).includes(process.env.OPENCLAW_GATEWAY_TOKEN));
});
test("rejects unauthenticated dispatch",async()=>{
 const response=await fetch(base+"/bounty/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
 assert.equal(response.status,401);
});
test("requires a controlled read-only research request",async()=>{
 const response=await fetch(base+"/bounty/research",{method:"POST",headers:{"Authorization":token,"Content-Type":"application/json"},body:JSON.stringify({type:"other"})});
 assert.equal(response.status,422);
});
test("rejects SSRF-style external URLs before research",async()=>{
 const response=await fetch(base+"/bounty/research",{method:"POST",headers:{"Authorization":token,"Content-Type":"application/json"},body:JSON.stringify({type:"bounty.research_requested",scope:"read_only_research",approval_required:true,request_id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",bounty:{url:"http://169.254.169.254/latest/meta-data/"}})});
 assert.equal(response.status,422);
});
test("does not reveal unknown jobs",async()=>{
 const response=await fetch(base+"/bounty/status/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",{headers:{Authorization:token}});
 assert.equal(response.status,404);
});
