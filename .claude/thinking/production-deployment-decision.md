# Decision: Deploy Social Scheduler to Production

> A personal social scheduling tool that has outgrown local-only development and needs proper production infrastructure.

## The Problem

You're experiencing significant friction managing dev and prod versions of the app on your local machine:
- **Data conflicts**: Real scheduled posts mixed with test data
- **Breaking changes**: Dev changes breaking actual usage
- **Migration headaches**: Schema changes risky with real data
- **Context switching**: Mental overhead of which mode you're in

You've already tried local separation (separate databases, different ports) and it didn't solve the problem.

## What You Want from Production

- **Stability**: A version you won't accidentally break
- **Always-on**: Runs even when your laptop is closed
- **Accessibility**: Access from other devices/locations
- **Confidence**: Forces treating the app more seriously

The first two literally cannot be achieved with a local setup.

## Why the Case is Clear

| Factor | Assessment |
|--------|------------|
| Current friction | Urgent, already tried local fixes |
| Architecture | Simple (single app + database) |
| Deployment experience | Comfortable |
| Expected longevity | 1+ years |
| Stakes if broken | Medium (annoying, not critical) |
| Downside if production fails | Minimal (can turn it off) |

The friction is real, the solution is achievable, and the risk is low.

## The Hesitation (and Why It's Manageable)

Your worry is diffuse complexity across:
- Initial setup (CI/CD, env vars, secrets)
- Data migration
- Ongoing deploy workflow
- Monitoring/debugging

This is understandable but manageable because:
1. Modern platforms (Railway, Render, Fly.io) have dramatically simplified this
2. You have the skills
3. "Doing it right" upfront means less ongoing friction
4. The architecture is simple—this isn't a distributed system

## Riskiest Assumptions

1. **You'll actually use it more once it's deployed** — likely true given the "always-on" and "accessibility" desires, but worth validating early
2. **The initial setup is the main hurdle** — if ongoing maintenance becomes a burden, you might need to simplify or automate more
3. **Simple architecture stays simple** — if features creep in complexity, production burden grows

## Possible Directions

### Direction 1: Railway or Render (Recommended)

Deploy to a platform-as-a-service that handles the infrastructure complexity.

**What it looks like:**
- Connect GitHub repo
- Add environment variables
- Deploy with git push
- Managed database included
- Basic monitoring built in

**Pros:**
- Minimal DevOps overhead
- "It just works" for simple apps
- Easy rollbacks
- Free or cheap tiers for personal use

**Cons:**
- Less control than a VPS
- Vendor lock-in (though easy to migrate)
- Can get expensive at scale (not relevant for personal use)

**Choose this if:** You want the fastest path to a working production setup with minimal ongoing maintenance.

### Direction 2: VPS with Docker (Fly.io, DigitalOcean, Linode)

More control, slightly more setup, but still modern and manageable.

**What it looks like:**
- Dockerfile for the app
- Docker Compose or Fly.toml for orchestration
- Managed or self-hosted Postgres
- Set up basic CI/CD (GitHub Actions)

**Pros:**
- More control over the environment
- Easier to debug production issues
- Skills transfer to other projects
- Often cheaper at small scale

**Cons:**
- More initial setup
- More to maintain (OS updates, etc.)
- Need to think about backups explicitly

**Choose this if:** You want to "do it right" and don't mind a weekend of setup for a cleaner result.

### Direction 3: Hybrid—Local Dev, Minimal Prod

Keep heavy development local, deploy a "stable" branch to production that you update less frequently.

**What it looks like:**
- `main` branch = production (stable)
- `dev` branch = active development
- Only merge to main when features are solid
- Production deploys are intentional, not continuous

**Pros:**
- Clear separation between dev and prod
- Production stays stable
- Forces you to think about "releases"

**Cons:**
- More git discipline required
- Can drift if you don't merge often
- Still need to solve the production hosting question

**Choose this if:** You want to slow down the deploy cadence and keep production very stable.

## Recommendation

**Go with Direction 1 or 2**, depending on your appetite:

- **Railway/Render** if you want to be done fast and not think about it
- **Fly.io with Docker** if you want to invest a bit more upfront for a setup you understand fully

Either way, the answer to "should I deploy to production?" is **yes**. The friction is real, the benefits are clear, and the risk is minimal.

## Next Steps

1. **Choose a platform** — Railway or Render for simplicity, Fly.io for more control
2. **Set up the basic deployment** — Connect repo, configure env vars, deploy
3. **Migrate data carefully** — Export current data, import to prod database, verify
4. **Establish the workflow** — Decide: continuous deploy or manual releases?
5. **Add basic monitoring** — Error tracking (Sentry free tier) and uptime checks (free tools exist)

## Open Questions

- [ ] Which platform feels right? (Try Railway first—easiest to test)
- [ ] What's your current database? (SQLite might need migration to Postgres for production)
- [ ] Do you need scheduled jobs? (Cron on the platform or separate worker?)
- [ ] What's the auth situation? (Any secrets that need secure handling?)

---

*Decision made: 2026-01-09*
*Status: Ready to execute*
