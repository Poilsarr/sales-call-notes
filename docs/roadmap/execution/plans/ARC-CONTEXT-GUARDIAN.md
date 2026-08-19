# Context Guardian Protocol

> Session-wide watchdog against context loss and hallucination.
> Established 2026-08-19 (post-audit arc). Applies to EVERY wave from now on.

## Mission

The guardian's job is to detect, inform, fix, and resume — in that order.
Any agent or orchestrator that starts hallucinating (claiming changes that
don't exist, referencing paths that don't resolve, asserting test counts
that don't reproduce, drifting from the plan) must be caught before its
claims reach a commit.

## Hard rules for every executor (prevention)

1. **No assertion without artifact.** Every claim in an executor report
   must carry evidence: `file:line` references, command output tails, or
   diff excerpts. "Tests pass" is not a claim — `npx vitest run ... | tail`
   output is.
2. **No file outside the allowed set.** Every executor gets an explicit
   allowlist. `git diff --stat` at the end must show ONLY allowlisted paths.
3. **No invented APIs or paths.** Every referenced symbol must resolve via
   grep in the tree before it is cited in a report.
4. **No secret in chat/commits.** Never paste keys; never commit env values.

## Guardian checks (run at every checkpoint)

The orchestrator dispatches a guardian agent (read-only) at each boundary:

| Checkpoint | Guardian verifies |
|---|---|
| After explore wave | Every fact in the plan doc resolves (file:line), no phantom paths |
| After execute wave | Claimed edits exist in `git diff`; only allowlisted files changed; test/row counts match output |
| Before commit | Diff review: no secrets, no out-of-scope hunks, message matches single concern |
| After gate | Plan doc still describes reality (drift flags); next-session docs updated (frontier rows) |

Guardian verdicts are one of:
- **CLEAR** — proceed.
- **DRIFT** — plan/doc vs tree mismatch, benign. Orchestrator amends doc, resumes.
- **HALLUCINATION** — claim not backed by evidence or contradicts the tree.
  Guardian informs user + orchestrator, proposes the fix, orchestrator applies
  it, execution resumes from the last verified checkpoint.

## Session continuity (context loss)

If a session loses context mid-arc (crash, handoff, fork):
1. Read this file + the arc plan + `docs/roadmap/DEVELOPMENT_FRONTIER.md`.
2. Run `git log --oneline -10` + `git status --short` to find the last
   verified checkpoint commit.
3. Run the guardian checks from that checkpoint forward; anything
   unverifiable is re-executed, never assumed.
4. Resume with a fresh plan-status section in the arc plan.

## Checklist markers

Every plan doc MUST end with a `## Plan status` section holding:
- `Last verified checkpoint: <commit or wave id + date>`
- `Guardian verdicts: <list, most recent last>`
- `Open drift items: <list>`