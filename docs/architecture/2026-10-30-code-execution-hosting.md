# Where candidate code runs: hosting the code execution engine
**Date:** 2026-10-30  
**Status:** Proposed. Vinay to choose before AIIN-105 is built.  
**Deciders:** Vinay

## Context

Candidates write code in two places: coding questions in live interviews, and company prep's problem solver.

- **Company prep** runs tests in the candidate's browser, so only JavaScript and TypeScript can be checked (AIIN-149). Hidden tests have to be sent to the browser to run there.
- **Live interviews** call `runCode` in `actions/code-execution.ts`, which sends the code to the public Piston service at emkc.org.
  - The action has no login check, rate limit or size limit, so anyone can use our server as a free proxy to it.
  - As far as we know, the public service has required an access token since 2025. If so, the Run button in interviews already fails in production. Check this first: it's a bug whichever option we choose.

AIIN-105 needs JavaScript, Python, Java and C++. Each run must be isolated (time, memory and output limits, no network), and hidden tests must stay on the server. Code from strangers is untrusted, so we should not run it on Vercel functions or the database host.

## Options

| | A. Hosted Judge0 (Judge0 Cloud or its RapidAPI listing) | B. Self-hosted Judge0 CE on one VM | C. Self-hosted Piston on one VM | D. A microVM sandbox service (e.g. Vercel Sandbox, Cloudflare Sandbox) |
|---|---|---|---|---|
| Set-up | An API key | A VM with Docker, Judge0's compose file, a firewall rule and a token | A VM with Docker, Piston, the language packages and a token | An API key, plus a runner image per language |
| Isolation | Theirs (`isolate`, cgroups) | `isolate`, cgroups; the container must run privileged | `isolate` | A Firecracker microVM per run: the strongest |
| Languages | 40+ | 40+ | 40+ (installed per language) | Whatever we install; Java and C++ images are slow to start cold |
| Cost | Per submission, a monthly tier | One small VM (2 vCPU, 4 GB) a month, whatever the volume | Same as B | Per second of compute; cheap at low volume, unpredictable at high |
| Upkeep | None | OS and Judge0 updates, monitoring, restarts | Same as B, slightly lighter | Little; runner images to maintain |
| Data | Candidate code goes to a third party | Stays with us | Stays with us | Goes to the provider (our account) |
| Latency from India | Depends on their region | We pick the region (e.g. Mumbai) | We pick the region | Depends on the provider's regions |

Prices change: check each provider's current pricing before deciding. Volume today is small: interviews plus company prep practice.

## Recommendation

**Start with A, behind an adapter shaped like Judge0's API, then move to B when volume or cost justifies it.**

- A is working in a day, with no servers to run. The team is small, and keeping a privileged Docker host secure is real work.
- B uses the **same API** as A. Moving later is a config change (URL and token), not a rewrite, and keeps code and tests on our own server.
- C is close to B, but its language set and isolation settings are less battle-tested for judging hidden tests.
- D gives the best isolation, but needs us to build the judging layer (compile, run per test, compare output) that Judge0 already has.

Whichever is chosen:
- One server action (`runSubmission`) is the only way in. It needs a signed-in user with access to that problem or interview, and is rate-limited (30 runs a minute per user).
- Limits on every run: 5 s CPU, 256 MB, no network, 64 KB of output.
- Hidden tests live only in the database and the judge, never in a response.
- We log language, duration and status, but not the code.
- `runCode` and the emkc.org call are removed.

## Consequences

**With A:** a monthly bill that grows with use. Candidate code leaves our systems, which the privacy policy must say. An outage at the provider stops Run in interviews, so the interview keeps the answer and shows "Couldn't run your code right now".

**With B later:** a server to patch and watch, but a fixed cost and code that stays with us.

## Alternatives considered

- **Keep running tests in the browser:** only JavaScript, and hidden tests can't stay hidden there. Kept only as an offline fallback for JavaScript.
- **Run code inside Vercel functions:** no real isolation for untrusted code, and no Java or C++ runtime. Rejected.
