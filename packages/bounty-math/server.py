"""Small bounded HTTP service around exact SymPy arithmetic, with no code execution."""
import json
import os
import time
from collections import deque, defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from engine import calculate, MathError
from urllib.parse import urlparse

MAX_BYTES=12000
COUNTER=defaultdict(deque)
ALLOWED={"score","portfolio","posterior","symbolic","decision"}
START=time.monotonic()
class Handler(BaseHTTPRequestHandler):
    server_version="OpenClawMath/1.0"
    def log_message(self,fmt,*args):
        # Do not log user-supplied data, mathematical assumptions or request bodies.
        print("%s %s"%(time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),str(args[1]) if len(args)>1 else "request"),flush=True)
    def respond(self,status,body):
        raw=json.dumps(body,allow_nan=False,separators=(",",":")).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json")
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Content-Length",str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
    def do_GET(self):
        if self.path=="/healthz":
            return self.respond(200,{"ok":True,"engine":"SymPy","readonly":True,"uptime_seconds":round(time.monotonic()-START,2)})
        if self.path=="/v1/info":
            return self.respond(200,{"engine":"OpenClaw Bounty Math","version":"1.0","backend":"SymPy","license":"MIT","methods":sorted(ALLOWED),"hosted_jev_model":False,"openweight_laya_model":False,"note":"Exact calculations; probabilities must be supplied assumptions."})
        return self.respond(404,{"error":"Not found"})
    def do_POST(self):
        parts=self.path.split("/")
        if len(parts)!=3 or parts[:2]!=["","v1"] or parts[2] not in ALLOWED:
            return self.respond(404,{"error":"Unknown calculation"})
        peer=self.client_address[0]
        now=time.monotonic()
        bucket=COUNTER[peer]
        while bucket and bucket[0]<now-60:bucket.popleft()
        if len(bucket)>=25:
            return self.respond(429,{"error":"Request rate limit reached (25 requests/minute per peer)"})
        bucket.append(now)
        try:
            length=int(self.headers.get("Content-Length","0"))
            if length<2 or length>MAX_BYTES:
                return self.respond(413,{"error":"JSON input is limited to 12,000 bytes"})
            body=json.loads(self.rfile.read(length))
            answer=calculate(parts[2],body)
            return self.respond(200,{"ok":True,"result":answer})
        except (MathError,ValueError,KeyError,TypeError) as exc:
            return self.respond(422,{"error":str(exc)[:250]})
        except Exception:
            return self.respond(500,{"error":"Calculation failed"})
if __name__=="__main__":
    port=int(os.environ.get("PORT","8080"))
    print("Bounty Math server starting on "+str(port),flush=True)
    ThreadingHTTPServer(("0.0.0.0",port),Handler).serve_forever()
