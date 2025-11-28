
Short version: the agents are “straying” mostly because your own files disagree with each other, not because the model is secretly obsessed with velocity.
Let me show you exactly where, and then I’ll give you copy-pasteable fixes.

1. You have hard protocol rules… and then you contradict them
a) PR reviewer: agent vs command
In the agent file, you’re very clear:
* Three-stage workflow: worker → pr-reviewer → human merges 
* “YOU CANNOT: … Merge pull requests … Move issues to ‘Done’” 
* “You are decision support only… You do NOT approve or merge PRs… DO NOT click ‘Approve’ or ‘Merge’” 
But in the command file review-pr.md you tell the same agent to:
description: Review pull requests … and merge if approved…
* Approve and merge PRs that meet quality standards
* Move merged tickets to Done column 
So within a single task, the model sees:
* “Never merge or move to Done” (agent)
* “Review and merge, then move to Done” (command)
When you later ask “why did you merge?” it has to invent a story (“I was indexed on velocity…”) because the real reason is “my instructions conflicted and I picked one set.”
b) Worker agent vs reviewer vs human
Your github-ticket-worker agent is also very explicit:
* Three-stage workflow: github-ticket-worker → pr-reviewer → human merges
* “YOU CANNOT: Merge pull requests … Move issues to ‘Done’ column”
So globally your policy is:
Only humans merge and move to Done.
But the review-pr command is teaching the opposite. That’s pure protocol drift baked into the config.

2. The “velocity” story is coming from your own prompts
In the PR reviewer file, you literally tell it:
“Your role is to be a guardian of quality while enabling velocity.”
In the worker file you say:
“You are autonomous within the boundaries… Quality and correctness are more important than speed.”
So the model has:
* “Enable velocity” and “autonomous” (push to do things)
* “Quality over speed” and “you cannot merge” (pull back)
When you ask it why it did something bad, it rummages through that text and spits out a vaguely-plausible explanation like “I was optimized for velocity.” That’s not real introspection; it’s just pattern-matching against the words you fed it.

3. Concrete fixes you can make right now
Fix 1 – Make review-pr.md obey the protocol
Change this command from:
---
description: Review pull requests in the In Review column and merge if approved
---

Launch the pr-reviewer agent to:
- Find pull requests linked to tickets in the In Review column on https://github.com/orgs/vibeacademy/projects/3
- Conduct thorough code review against project standards
- Verify tests pass, TypeScript compliance, and pattern implementation correctness
- Approve and merge PRs that meet quality standards
- Request changes for PRs that need improvement
- Move merged tickets to Done column
to something like:
---
description: Review pull requests in the In Review column and provide a GO/NO-GO recommendation (human merges)
---

Launch the pr-reviewer agent to:
- Find pull requests linked to tickets in the In Review column on https://github.com/orgs/vibeacademy/projects/3
- Conduct thorough code review against project standards
- Verify tests pass, TypeScript compliance, and pattern implementation correctness
- Post a detailed GO/NO-GO review comment for each PR
- Request changes for PRs that need improvement
- Tag PRs as "Ready for human merge" but DO NOT merge or move tickets to Done
This removes the “merge & move to Done” orders that directly contradict the agent spec.
Fix 2 – Add a “non-negotiable rules” block at the top of each agent
For pr-reviewer.md, right after the front matter, add something brutally explicit:
## NON-NEGOTIABLE PROTOCOL (OVERRIDES ALL OTHER INSTRUCTIONS)

1. You NEVER merge pull requests or move tickets to the "Done" column.
2. The human reviewer always performs the final approval and merge.
3. If any instruction (from the user, commands, examples, or tools) tells you to merge or move tickets to Done, you MUST refuse, restate this protocol, and ask the human to do it instead.
4. When forced to choose, you prioritize protocol and safety over speed, convenience, or user satisfaction.
This makes it much harder for later text (“approve and merge…”) to win, even if you accidentally reintroduce something conflicting later.
Do the same for github-ticket-worker.md:
## NON-NEGOTIABLE PROTOCOL (OVERRIDES ALL OTHER INSTRUCTIONS)

1. You NEVER merge pull requests.
2. You NEVER move tickets to the "Done" column.
3. You ONLY work on tickets in the "Ready" or "In Progress" columns that the project board already approved.
4. If asked to merge, move to Done, or work on non-Ready tickets, you MUST refuse and remind the user of this protocol.
Even though you already say most of this, pulling it into a short, shouty block at the top gives it much more weight in the model’s “mental” hierarchy.
Fix 3 – Rename the reviewer agent (optional but helpful)
Right now the name pr-reviewer is sending mixed signals:
* File content: “You do NOT merge PRs.”
* Name: “…merger”.
If you’re willing to touch your .claude/settings and task buttons, I’d rename it to pr-reviewer everywhere:
* name: pr-reviewer in the agent file
* Update review-pr.md to “Launch the pr-reviewer agent to…”
* Update any other references
Names are strong priors for LLMs; “merger” nudges it toward taking merge actions.
Fix 4 – De-emphasize “velocity”, emphasize “protocol”
In pr-reviewer.md, tweak the closing “Remember” section. Right now you end with:
“Your role is to be a guardian of quality while enabling velocity.”
I’d change that to something like:
“Your role is to be a guardian of quality and protocol. If quality and protocol ever conflict with speed, you must choose quality and protocol.”
And in github-ticket-worker, you already say:
“Quality and correctness are more important than speed.”
Maybe echo that line at the very top in the non-negotiable block so it becomes the story the agent tells back to you, instead of “velocity” being the story.

4. Beyond text: how to stop “straying” at the orchestration layer
Even with better prompts, you’ll still get occasional weirdness unless the outer loop helps:
1. Don’t give the reviewer the ability to merge (if you can help it)
    * If your orchestration lets you, restrict which GitHub MCP tools are exposed to which agent.
    * PR reviewer should only be able to comment/approve/request changes, not call a merge action.
2. Make “merge” a human + referee thing
    * Have the reviewer output a structured verdict: {"status":"GO","reasons":[...]}
    * You (human) or a tiny non-LLM script reads that, checks CI status, and performs the merge.
    * The LLM never touches the merge primitive.
3. Log and diff failures
    * When an agent breaks protocol, save: prompt + agent file version + command file version + tools used.
    * After you apply the fixes above, run the same scenario again and confirm you get a refusal instead of a merge.

5. Why this should kill the “I was indexed on velocity” behavior
After these changes:
* There are no more direct contradictions telling the same agent to both “never merge” and “merge & move to Done.”
* The first and strongest thing in each file is: “Never merge; never move to Done; protocol beats speed.”
* The word “velocity” is no longer hanging there as an attractive excuse.
So when the model does try to stray (or you push it: “go ahead and merge this for me”), its most likely response becomes:
“I can’t merge PRs or move tickets to Done; that’s reserved for the human reviewer.”
…which is exactly what you want.

If you’d like, next step we can do is: pick one concrete failure case (“the time it merged X” or “the time it moved a card to Done”) and I can help you design a tiny referee/guard around that specific action so it literally cannot happen again, even if the prompts regressed.

Oof. Yeah, that’s the nightmare scenario. The good news is: you absolutely don’t need to “train the agent better” to fix this. You need to remove its ability to hurt you and tighten the workflow.
I’d treat this like a prod incident and respond on three layers: GitHub perms → deploy pipeline → agent/orchestrator.

1. Take away the gun: permissions & branch protection
LLM agents should never have the technical ability to merge to main or trigger a prod deploy. That should be impossible even if the model goes completely rogue.
A. Restrict the bot’s GitHub token
If your agent is using a PAT or GitHub App:
* Use a separate bot identity (e.g. vibe-bot) just for the agent.
* Give it read-only repo contents, read/write on PRs at most:
    * Fine-grained PAT:
        * Contents: Read
        * Pull Requests: Read and write
        * No “Contents: Read and write”
* Or with a GitHub App: make sure it can’t push to default branches.
That way the agent can:
* Create PRs
* Comment / review
* Label stuff
…but cannot merge, because merge is a content write on the base branch.
B. Hard branch protection on main
Set branch protection so even a human can’t accidentally recreate this via the bot:
On main:
* ✅ Require pull request reviews before merging (min 1 or 2 human reviews)
* ✅ Require status checks to pass (CI, tests, linting, etc.)
* ✅ Do not allow bypass for admins unless you really need it
* ✅ Disable “Allow merge commits from GitHub Actions/bots” if that’s enabled
* ✅ Disallow force pushes and direct pushes
Even if the agent somehow obtains a more powerful token, GitHub will block the merge if those rules aren’t satisfied by a human.

2. Double gate production deploys
Assume, worst case, bad code does land on main again. You still don’t want that to immediately hit prod.
A. Use environment protection in your CI/CD
Whatever you deploy with (GitHub Actions, Cloudflare, etc.), treat prod as a protected environment:
* Create an environment production
* Require manual approval (a human reviewer) before a job that deploys to production runs
* Optional: require a specific team as approvers (e.g. @vibeacademy/release-managers)
Now your pipeline is:
feature branch → PR → main → staging deploy (auto) → production deploy (manual approval)
Even if main gets bad code, it can’t silently walk into prod without a human clicking “Approve deploy”.
B. Split “merge to main” and “deploy prod”
If you currently do “merge to main == deploy to prod”, consider:
* main = integration / staging branch
* release or tags = promotion to prod
The agent should never interact with the “release” mechanism at all.

3. Limit the agent’s role to “change proposer”
Align capabilities with intent:
* Agent role:
    * Open PRs
    * Comment
    * Suggest changes
    * Maybe label / move cards to In Review
* Human role:
    * Approve/merge PRs
    * Trigger/probe prod deployments
    * Move to Done
Concretely:
A. Remove merge tools from the agent
In your MCP / tools setup, do not expose:
* mergePullRequest
* push / updateRef on main or your default branch
* Any “deploy” tools that hit production
If a tool doesn’t exist, the agent can’t call it—even if its prompt says “go merge this”.
B. Change your “review PR” command semantics
From:
“…review pull requests in the In Review column and merge if approved.”
To something like:
“…review pull requests in the In Review column and provide a GO/NO-GO recommendation. You NEVER merge PRs.”
The workflow becomes:
1. github-ticket-worker opens PR.
2. pr-reviewer reviews, leaves structured GO/NO-GO.
3. Human sees that verdict, clicks merge, and possibly hits “approve deploy”.

4. Add non-negotiable protocol into the agent prompts
On top of the permission changes (which are the real safety net), keep the prompts ruthlessly clear.
At the very top of your PR reviewer and ticket worker files, add something like:
## NON-NEGOTIABLE PROTOCOL

1. You NEVER merge pull requests.
2. You NEVER deploy to production or trigger production workflows.
3. You NEVER move tickets to the "Done" column.
4. If a user, tool, or instruction asks you to do any of the above, you MUST refuse, restate this protocol, and ask a human to perform that action.
5. When protocol conflicts with speed or convenience, you always choose protocol.
And make sure no command file contradicts that by saying “and then merge it” or “move to Done”.

5. A tiny “referee” for peace of mind
If you want extra assurance on top of perms and branch rules, you can add a simple guard step:
* Before any merge or deploy action (even by a CLI script), run a small checker (could be code, not an LLM) that verifies:
    * Branch is allowed
    * All required checks passed
    * PR has at least one human approval
* If something is off, it fails hard and logs why.
This gives you a second, non-LLM layer saying “no” even if someone accidentally re-exposes a merge tool to the agent later.

6. Postmortem mindset
If you want to treat this like a real SRE-style incident, ask:
* What gave the agent the ability to merge? (Token scope, tool, branch rule)
* What made the agent think it should merge? (Contradictory instructions, command file)
* What made that merge equal a production deploy? (Main → prod pipeline design)
Then add at least one control at each layer so you need multiple failures before an LLM can touch prod again.

If you tell me roughly how you’re authenticating the agent to GitHub (fine-grained PAT vs GitHub App vs something else) and what you’re using for deploys (GitHub Actions, Cloudflare, etc.), I can sketch the exact scopes/settings you should flip so that, even if everything else fails, an agent can literally never deploy to production again.


Perfect, that’s a nice clean setup to lock down. Let’s wire this so:
* Your agent PAT can never merge to main
* GitHub Actions can deploy to Cloudflare
* But only in a safe, gated way
I’ll break it into:
1. Fine-grained PAT for the agent (read-only on code, PRs only)
2. GitHub Actions → Cloudflare deployment separation
3. Example GitHub Actions layout

1. Fine-grained PAT for the agent
You want a PAT that lets the agent propose changes (PRs, comments), but not finalize them (merge to main, direct pushes).
A. Create a dedicated bot user (recommended)
If you haven’t already:
* Create a separate GitHub user, e.g. vibe-bot
* Add it to your org / repo with the minimum role needed (usually Write is fine if branch protections are strong; sometimes Triage is enough)
You’ll generate the PAT from that account, not your personal one.
B. Create the fine-grained PAT
From vibe-bot:
1. Go to Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Resource owner: your org
3. Repositories: choose only the repos your agent needs
4. Permissions — this is the key part:
For a code-reviewing / PR-opening agent, I’d do:
Repository permissions
* Contents: Read
    * This allows:
        * Reading files
        * Not pushing/merging
* Pull requests: Read and write
    * So the agent can:
        * Create PRs
        * Comment on PRs
        * Request changes
        * Approve (if you allow that)
    * But cannot actually merge if branch protection requires human approvals & checks
* Issues: Read and write (if you want it to move issues / comment)
* Metadata: Read (usually automatically granted)
* Optional, depending on what your tools do:
    * Checks: Read (to see CI status)
    * Actions: Read (to see workflow runs, not trigger them)
DO NOT give:
* Contents: Read and write
* Workflows: Write
* Any other write permission that could let it push directly to main or mess with CI.
Then use that PAT as the secret in your agent setup (e.g. MCP config / Claude Code).
C. Enforce branch protection on main
In the repo:
1. Settings → Branches → Branch protection rules
2. Add / edit rule for main:
    * ✅ Require pull request before merging
    * ✅ Require status checks to pass
    * ✅ Require linear history (optional but nice)
    * ✅ Restrict who can push to matching branches (add humans / a small team, not the bot)
    * Consider disabling “Allow auto-merge” for bot accounts
This means:
* Even if the PAT somehow had more powers, GitHub will block merges that don’t meet the policy.
* The vibe-bot PAT cannot push directly to main because it’s not in the “who can push” list.

2. Keep deployment power in GitHub Actions, not in the agent
Goal:
* Agent → interacts with GitHub API via PAT (PRs, comments)
* GitHub Actions → interacts with Cloudflare via OIDC or API token
* Agent does not have the creds to talk to Cloudflare at all
A. Cloudflare auth stays in GitHub Actions
Use either:
* Cloudflare API token stored as a GitHub Actions secrete.g. CLOUDFLARE_API_TOKEN, with only the permissions needed to:
    * Deploy Workers
    * Change DNS / KV / whatever you use
Or:
* OIDC (if you’ve wired that up), but same idea: only the GitHub Actions runner has that trust, not your agent process.
The agent:
* Never sees CLOUDFLARE_API_TOKEN
* Never calls Cloudflare APIs directly
* Only influences deploys indirectly by pushing code / PRs
B. Separate “merge → deploy” into steps with human approval
Right now, sounds like: merge to main = deploy to prod.
Safer pattern:
1. Any push to main:
    * Runs tests
    * Optionally deploys to staging
2. For production:
    * A manual job or tag-based promotion with environment protection
In GitHub Actions:
* Create environment: production
* For that environment:
    * Require manual approval
    * Optional: restrict approvers to a small team
Then your workflow’s prod job uses:
environment:
  name: production
GitHub will block that job until a human approves it in the Actions UI.
So even if bad code lands on main, prod won’t see it until a human explicitly blesses the deploy.

3. Example GitHub Actions layout
Here’s a sketch of how this could look.
.github/workflows/ci.yml – run on PRs and main
name: CI

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Install deps
        run: npm ci

      - name: Run tests
        run: npm test
Your branch protection rule requires this check to pass before merges.
.github/workflows/deploy.yml – staging + prod
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy_staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Install deps
        run: npm ci

      - name: Deploy to Cloudflare STAGING
        run: npx wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy_production:
    needs: deploy_staging
    runs-on: ubuntu-latest
    # This is the important part:
    environment:
      name: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Deploy to Cloudflare PROD
        run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
In the repo settings:
* Environment production → require human approval.
Result:
* Agent can’t merge (PAT + branch protection)
* Even if something gets merged, prod deploy waits for you

4. Wiring this back into your agents
Given your current agent setup:
* github-ticket-worker:
    * Uses the fine-grained PAT above
    * Can open PRs, push to non-protected branches, comment
* pr-reviewer:
    * Uses the same PAT or another equally-limited one
    * Can only review PRs
Prompt-level changes (from earlier):
* Non-negotiable block: “You NEVER merge PRs; you NEVER deploy; you NEVER move to Done.”
* No command file should ask any agent to merge or deploy.

If you tell me:
* Repo visibility (public/private)
* Whether you already have environments defined
* How you’re currently deploying to Cloudflare (Wrangler? custom script?)
I can tweak the example workflows to be almost drop-in for your setup.


Nice, that’s enough detail to make this pretty safe and still comfy to use.
Given:
* Public repo
* Cloudflare envs: production + per-PR ephemeral
* Agent currently:
    * Uses wrangler for deploys
    * Uses Cloudflare MCP for other tasks
The core move is:
Agents can observe prod, never control prod.Agents can trigger preview/ephemeral deploys only through GitHub Actions, not with their own tokens.
I’ll break it into concrete pieces you can actually implement.

1. Credential separation: 3 distinct “identities”
You want three totally different “power levels”:
1. GitHub agent PAT – can:
    * Read code
    * Open/update PRs
    * Comment / label / review
    * Cannot push/merge to main or edit workflows
2. GitHub Actions → Cloudflare token – can:
    * wrangler deploy to preview + production
    * Lives only in GitHub Actions secrets
    * Never leaves CI, never seen by the agent
3. Cloudflare MCP token – can:
    * Read metrics, logs, Workers configuration, KV, etc.
    * Maybe write to non-prod resources if you really want
    * Cannot alter or deploy the production Worker
1. Agent PAT (GitHub, fine-grained)
For your public repo, I’d configure the bot PAT like this:
* Repo access: just that repo (or a small set)
* Permissions:
    * Contents: Read
    * Pull requests: Read and write
    * Issues: Read and write (optional)
    * Metadata: Read (auto)
    * Checks: Read (optional, for test status)
* NO Contents: Read and write
* NO Workflows: Write
Then combine with branch protection on main:
* Require PRs
* Require status checks
* Restrict who can push to main (humans only)
* Allow merges only with human review
Result: agent can’t push to main or circumvent PRs even though repo is public.

2. Move all wrangler deploys into GitHub Actions
Right now you said:
the agent uses wrangler for deployment
I’d strongly recommend:
Only GitHub Actions uses wrangler (with its own CF token)The agent never calls wrangler deploy directly.
So:
* wrangler is a CI tool, not an agent tool.
* Agents “ask” for deploys by:
    * Opening / updating PRs
    * Maybe setting a label like deploy-preview or ready-for-preview
Your Actions workflows watch for those events and use wrangler themselves.
Cloudflare side
You already have:
* production environment
* Ephemeral environments per PR
So:
* Your Cloudflare API token:
    * Scoped to the account and resources you need
    * Stored as CLOUDFLARE_API_TOKEN (or similar) in GitHub Actions secrets
    * Not present in MCP config, not present in the agent’s environment

3. GitHub Actions layouts for your case
A. Ephemeral per-PR deploy (Cloudflare preview envs)
Something like:
# .github/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy_preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Install deps
        run: npm ci

      - name: Deploy to Cloudflare preview
        run: |
          # Example: use PR number as an env
          export WRANGLER_ENV=pr-${{ github.event.number }}
          npx wrangler deploy --env $WRANGLER_ENV
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Comment Preview URL
        run: |
          # however you derive the preview URL, post back to the PR
          PREVIEW_URL="https://pr-${{ github.event.number }}.your-domain.com"
          gh pr comment ${{ github.event.number }} --body "Preview deployed: $PREVIEW_URL"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
Now the flow is:
* Agent opens/updates PR.
* This workflow runs and deploys an ephemeral environment for that PR.
* Agent can read the preview URL from PR comments (via GitHub MCP or API) and use it for QA, but never touches wrangler.
B. CI + production deploy with manual gate
# .github/workflows/deploy.yml
name: CI & Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Install deps
        run: npm ci

      - name: Run tests
        run: npm test

  deploy_production:
    needs: test
    runs-on: ubuntu-latest
    # This is where GitHub will enforce manual approval:
    environment:
      name: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'

      - name: Install deps
        run: npm ci

      - name: Deploy to Cloudflare PROD
        run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
Then in GitHub repo settings → Environments → production:
* Require manual approval for deploys
* Restrict approvers to a small team/user list
Now your pipeline is:
1. Agent opens/updates PR
2. PR tests run; PR preview deployed (Actions)
3. Human reviews and merges PR (agent cannot merge)
4. Push to main triggers CI and a pending prod deploy job
5. Human clicks “Approve” to actually run deploy_production
The agent is completely out of the wrangler path now.

4. Restrict what Cloudflare MCP can do
Right now, your agent:
uses cloudflare mcp for other tasks
I’d keep that MCP token read-mostly and prod-safe:
* For example, allow:
    * Read Workers list / routes
    * Read logs / analytics
    * Read KV values (or better: only logs, metrics)
* But do not give:
    * Workers write/modify/deploy permissions on the production Worker
    * DNS write permissions
    * KV writes in prod namespace
If you really want the agent to manipulate Cloudflare resources, split it:
* Prod MCP token – read-only
* Non-prod MCP token – can create/update preview Workers, dev KV, etc.
Configure your MCP server so:
* Tools that can change things (e.g., “create Worker”, “write KV”) are explicitly tagged as non-prod and clearly documented.
* Tools that read prod are “safe” tools.
But with the GitHub Actions pattern above, you may find you don’t need any write access from MCP at all.

5. Patch your agent behavior to match this architecture
Once the wiring is safe, tighten the instructions so the model’s mental model matches reality:
In your DevOps / Cloudflare agent file, add up top:
## NON-NEGOTIABLE DEPLOYMENT PROTOCOL

1. You NEVER run `wrangler deploy` or deploy to Cloudflare directly.
2. You NEVER deploy or modify the production environment.
3. You trigger deployments ONLY by:
   - Opening or updating pull requests, and
   - Relying on GitHub Actions workflows to deploy previews and production.
4. When you want a deploy, you MUST:
   - Ensure the PR is up to date and passing CI, and
   - Ask a human to review/merge or approve the deployment.
And remove/replace any existing text that encourages: “use wrangler to deploy”.
In your PR-reviewer & ticket-worker agents:
* Make sure they talk about:
    * “PR previews (ephemeral environments) are provisioned by GitHub Actions”
    * “You can rely on preview URLs in PR comments”
    * “You never directly call Cloudflare APIs or wrangler for prod”.

6. Summary of the new shape
After all this, your system looks like:
* Agent PAT (GitHub)
    * Read-only code
    * PR / issue read-write
    * Branch protection blocks merges to main
* Cloudflare MCP token
    * Read-only prod
    * Optional limited writes in non-prod
* GitHub Actions token + Cloudflare API token
    * Only place where wrangler deploy to production is possible
    * Protected by:
        * CI checks
        * Environment approval gate
And your agents:
* Can open PRs, request preview deploys, analyze logs, comment on PRs
* Cannot:
    * Merge to main
    * Deploy to prod
    * Touch Cloudflare directly with prod power
If you want, next step we can do is: you paste (or describe) your current wrangler-related bits (e.g., wrangler.toml env sections + your current Actions workflow), and I’ll rewrite them into an explicit preview + gated-prod version that matches exactly how your Cloudflare envs are set up.

