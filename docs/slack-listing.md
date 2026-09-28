# Gauge for Slack — App Listing

## Tagline

Meeting recaps, action items, and health scores — right in Slack.

## Long description

Gauge turns every sales call into actionable intelligence and delivers it
where your team already works. Connect the Gauge Slack app to:

- **Recap any call in-channel** with `/gauge recap <callId>` — summary,
  pending action items, key decisions, and the call health score.
- **Unfurl meeting links automatically** — paste a
  `/app/calls/{id}` link and Gauge expands it into a rich preview with the
  title, summary, and health score. Only meetings from your own team's
  workspace ever unfurl.
- **Stay in flow** — no context-switching to a dashboard to answer
  "what did we agree on?".

Every response is scoped to the Slack workspace that installed the app:
a workspace can only see its own team's meetings.

## Use cases

1. **Post-call debrief** — drop the recap into the deal channel seconds
   after the call ends.
2. **Async catch-up** — teammates hover/expand a pasted meeting link and
   get the gist without opening the app.
3. **Deal review** — health scores surface at-risk deals where the
   conversation already happens.

## Review checklist (Slack app review)

### Scopes justification

| Scope | Why Gauge needs it |
|---|---|
| `chat:write` | Post recaps and link unfurls (`chat.postMessage`, `chat.unfurl`) with the bot token. |
| `chat:write.public` | Post recaps into public channels the bot hasn't been explicitly invited to. |
| `commands` | Register and receive the `/gauge` slash command. |
| `links:read`, `links:write` | Receive `link_shared` events and write rich unfurls for `/app/calls/{id}` links. |
| `users:read` | Resolve display names for action-item owners (read-only). |
| `im:write` | Open/confirm DM delivery context for ephemeral command responses. |

### Data use

- Gauge reads only the meetings belonging to the installing team's
  workspace (workspace→team match on every request; cross-team lookups
  return "not found").
- Slack tokens are encrypted at rest (`ENCRYPTION_KEY`, AES-256-GCM) and
  never logged.
- No Slack message content is stored — events are verified, acted on,
  and acked within the request.

### Test workspace steps (for the reviewer)

1. Create the app from `slack/manifest.json` (replace `<APP_URL>` with the
   deployed app URL).
2. Install to a test workspace with the scopes above; connect via
   `<APP_URL>/integrations`.
3. In any channel, run `/gauge recap <callId>` → expect an ephemeral
   recap (summary + actions + health).
4. Paste `<APP_URL>/app/calls/<callId>` → expect a rich unfurl; paste an
   unrelated URL → expect no unfurl.
5. From a second workspace (no install), run the command → expect the
   "ask your admin to connect Slack" message.

## Screenshots TODO

- [ ] `/gauge recap` ephemeral response in a deal channel (desktop).
- [ ] `/app/calls/{id}` link unfurl with health score (desktop).
- [ ] Non-call link pasted → no unfurl (negative case).
- [ ] App Home / configuration view (`/integrations` connected state).
- [ ] Mobile rendering of the recap blocks (375px).
