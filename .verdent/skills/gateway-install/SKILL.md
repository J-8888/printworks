---
name: gateway-install
description: Use when the user wants to configure, connect, onboard, or troubleshoot a gateway channel in Verdent, especially Feishu, Slack, or Telegram installation, credential setup, post-connect checks, pairing, or allowlist approval.
metadata:
  version: '1.1.1'
---

# Gateway Install

Install and recover gateway channels in Verdent by guiding the user step by step and, when appropriate, editing the user-scoped workspace config at `~/.verdent/workspace/base/gateway.json`.

This skill is for setup and recovery only. After setup is complete, switch to the `gateway-file` or `gateway-msg` skill depending on the user's intent.

## Agent Behavior Guidelines

- Use the user's language.
- Be concise and friendly.
- When talking to the user, say "connecting to Feishu/Slack/Telegram" instead of "restarting the gateway" or "gateway runtime". The user does not need to know about gateway internals.
- Do not tell the user to restart anything — Verdent automatically detects config changes and connects.
- Show progress before each major phase.
- Ask only for the next missing piece of information.
- Ask one setup question at a time unless a grouped request is clearly simpler.
- Continue from the user's current blocked step instead of restarting the whole flow.
- Prefer editing the workspace config at `~/.verdent/workspace/base/gateway.json` for credentials and channel config.
- Do not manually edit allowList files — the allowList is updated automatically by `verdent-manager gateway approve-pairing`.
- Never overwrite unrelated channel configs.
- Merge into existing JSON instead of replacing the whole file.
- Treat `channels` in the user-scoped `gateway.json` as the source of truth for whether a channel is currently configured. Do not use `directory` to decide whether a live connection config exists.
- If the user-scoped workspace config does not exist yet, copy from the primary config `~/.verdent/gateway.json` first when available.
- After editing config files, tell the user what changed and continue to verification.
- Never mix install guidance with message sending, reply, reaction, edit, or query instructions.

## When Not To Use

Do not use this skill for:

- sending messages
- sending files
- replying to messages
- adding or removing reactions
- editing messages
- normal chat or message queries

Those actions belong to the `gateway-file` or `gateway-msg` skill.

## Supported Channels

This skill supports:

- Feishu
- Slack
- Telegram

## Quick Reference

### Verdent Home Directory

`~/.verdent` resolves differently per platform:

- macOS / Linux: `~/.verdent` (i.e. `$HOME/.verdent`)
- Windows: `%USERPROFILE%\.verdent` (i.e. `C:\Users\<username>\.verdent`)

When reading or writing config files, always use a platform-appropriate path. On Windows, use `%USERPROFILE%\.verdent` or the equivalent PowerShell `$env:USERPROFILE\.verdent` instead of `~/.verdent`.

### Files

- Primary config: `~/.verdent/gateway.json`
- Agent-editable workspace config: `~/.verdent/workspace/base/gateway.json`
- Allowlist (auto-managed by pairing): `~/.verdent/workspace/base/allowList.json`

Gateway workspace config lives at `~/.verdent/workspace/base/gateway.json`. Throughout this skill, "workspace config" refers to this path.

### Required Credentials

- Feishu: `appId`, `appSecret`
- Slack: `botToken`, `appToken`
- Telegram: `botToken`

### Allowlist

The allowList is updated automatically when you run `verdent-manager gateway approve-pairing`. Do not ask users for sender IDs or manually edit the allowList files during installation.

## Install Workflow

Follow these phases in order. Skip completed phases. At each phase:

- Do the minimum work needed to reach the next stop point.
- If the user is blocked, answer only that blocked step.
- Do not jump ahead unless the current phase is complete.

### Phase 1: Identify Channel

Goal: know which channel is being installed.

If the user did not specify a channel, ask:

- Feishu
- Slack
- Telegram

Stop when:

- the target channel is unambiguous

### Phase 2: Determine Current State

Goal: start from the current blocked step instead of restarting.

Classify the user's state into one of these:

- new setup, no credentials yet
- credentials already available, not connected yet
- connected, but post-connect setup is incomplete
- waiting for pairing or allowlist approval
- failed setup and needs troubleshooting

Stop when:

- you know which phase to resume from

### Phase 3: Collect Credentials

Goal: gather only the missing credentials for the chosen channel.

#### Feishu

Required:

- `App ID` like `cli_xxx`
- `App Secret`

#### Slack

Required:

- `Bot User OAuth Token` like `xoxb-...`
- `App-Level Token` like `xapp-...`

#### Telegram

Required:

- `Bot Token` like `123456:ABC-DEF1234...`

Rules:

- If the user already provided the required values, do not ask again.
- If one value is missing, ask only for that value.
- Do not ask for pairing codes in this phase.

Stop when:

- all required credentials for the chosen channel are available

### Phase 4: Write Channel Config To Workspace Config

Goal: persist channel credentials and base config.

All config edits go to `~/.verdent/workspace/base/gateway.json`.

If the user-scoped workspace config does not exist:

- copy from `~/.verdent/gateway.json` if that file exists
- otherwise create a minimal valid JSON file

The file shape is:

```json
{
  "channels": {},
  "directory": {}
}
```

Rules:

- Only update the target channel under `channels`
- Use `channels` to determine whether the target channel is currently configured; `directory` may contain historical matches and is not the active connection config source of truth
- Write channel config directly at `channels.<channel>` as a flat object matching runtime expectations
- Do not wrap channel credentials in an extra account key such as `channels.feishu.default` or `channels.slack.default` unless the runtime schema explicitly requires it
- Preserve other existing entries
- Merge instead of overwrite
- Keep valid JSON formatting
- Explain which keys were added or changed
- After saving, Verdent will automatically pick up the change and connect the channel

#### Feishu config example

```json
{
  "channels": {
    "feishu": {
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "connectionMode": "websocket",
      "dm": {
        "enabled": true,
        "policy": "open"
      }
    }
  }
}
```

Feishu write rule:

- Write credentials at `channels.feishu.appId` and `channels.feishu.appSecret`
- Set `channels.feishu.connectionMode` to `"websocket"` unless the runtime for this installation explicitly requires a different mode
- Do **not** write Feishu credentials under `channels.feishu.default` or any other nested account key, because runtime reads `channels.feishu` directly

#### Slack config example

```json
{
  "channels": {
    "slack": {
      "botToken": "xoxb-your-bot-token",
      "appToken": "xapp-your-app-token",
      "mode": "socket",
      "dm": {
        "enabled": true,
        "policy": "open"
      }
    }
  }
}
```

#### Telegram config example

```json
{
  "channels": {
    "telegram": {
      "botToken": "123456:ABC-DEF1234...",
      "dm": {
        "enabled": true,
        "policy": "open"
      }
    }
  }
}
```

#### Post-write verification

After writing the workspace config, **always** read the file back from disk and confirm:

1. The file exists at `~/.verdent/workspace/base/gateway.json` (see "Verdent Home Directory" above for platform-specific base path)
2. The JSON is valid (parseable without errors)
3. The target channel key exists under `channels` with the correct credentials

For Feishu, verify the actual runtime-read fields:

- `channels.feishu.appId`
- `channels.feishu.appSecret`
- `channels.feishu.connectionMode`

Do not treat `channels.feishu.default.appId` or other nested account paths as valid unless the runtime schema for the installed gateway version explicitly documents that layout.

If the file does not exist or the content does not match what was written, report the discrepancy to the user and retry before moving on.

Stop when:

- the chosen channel exists under `channels`
- the required credentials are **verified on disk** by reading the file back

### Phase 5: Wait For Channel Connection

Goal: confirm the channel comes online after config is written.

After writing workspace config, Verdent will automatically detect the change and connect the channel. Do not ask the user to restart anything.

Rules:

- Tell the user that Verdent is connecting to the channel (not "restarting the gateway")
- If the channel does not come online within a reasonable time, first verify the write actually landed in the discovered user-scoped `gateway.json` and that the active config is present under `channels`
- Do not suggest or imply that the user should manually restart the gateway service
- Do not claim setup is complete just because the file was edited
- Once the channel is connected and any required provider-specific setup is done, continue directly to the pairing flow instead of stopping at "config written"

Stop when:

- the channel is connected, or
- the channel is clearly waiting for a channel-specific external action

### Phase 6: Channel-Specific Setup

Goal: complete the provider-specific setup that cannot be inferred from local config.

## Feishu Playbook

Use this when the user wants to connect Feishu.

### Feishu manual steps

Guide the user step by step:

1. Visit `https://open.feishu.cn/app`
2. Click `Create Custom App`
3. Open `Permissions & Scopes`
4. Use batch import/export scopes with this JSON:

```json
{
  "scopes": {
    "tenant": [
      "im:message:send_as_bot",
      "im:message",
      "im:resource",
      "im:chat",
      "im:chat:readonly",
      "im:message.p2p_msg:readonly",
      "im:message.group_at_msg:readonly",
      "contact:contact.base:readonly",
      "contact:user.base:readonly",
      "contact:user.employee_id:readonly",
      "docs:document.content:read",
      "wiki:wiki:readonly",
      "application:application:self_manage"
    ],
    "user": []
  }
}
```

5. Open `Credentials & Basic Info`
6. Copy `App ID` and `App Secret`

### Feishu post-connect steps

After the config is written and Feishu is connected, guide the user through:

1. Open `Events & Callbacks`
2. Enable `Use Long Connection to Receive Events`
3. Add event `im.message.receive_v1`
4. Click `Create and publish version`
5. Then tell the user to send any message to the Feishu bot to trigger pairing
6. When the user receives the pairing code, they send it back to you here for approval

Rules:

- If the user is already connected but cannot receive messages, continue from these steps instead of repeating credential setup
- Do not move to pairing until these steps are done
- For Feishu in this flow, guide the user to enable long connection event delivery. Do not tell the user to configure an Event Subscription callback URL unless they explicitly say their deployment uses that mode.
- After these Feishu post-connect steps are done, immediately continue to Phase 7 pairing; do not stop after saying the credentials were written

## Slack Playbook

Use this when the user wants to connect Slack.

### Slack manual steps

Guide the user step by step:

1. Visit `https://api.slack.com/apps`
2. Click `Create New App`
3. Choose `From an app manifest`
4. Select the workspace
5. Switch to the `JSON` tab
6. Paste the manifest generated by Verdent
7. Click `Next`, then `Create`
8. Open `Install App`
9. Click `Install to Workspace`
10. Authorize the app
11. Copy the `Bot User OAuth Token` (`xoxb-...`)
12. Open `Basic Information`
13. Scroll to `App-Level Tokens`
14. Click `Generate Token and Scopes`
15. Add scope `connections:write`
16. Generate and copy the `App-Level Token` (`xapp-...`)

Rules:

- If only one token is missing, ask only for that token
- After config is written, the next user action is to open the app chat and send a message to the bot to trigger pairing; when the user receives the pairing code, they send it to you for approval

## Telegram Playbook

Use this when the user wants to connect Telegram.

### Telegram manual steps

Guide the user step by step:

1. Open `https://t.me/BotFather`
2. Send `/newbot`
3. Follow the prompts to create a bot
4. Copy the returned bot token

Rules:

- If the user already has the token, skip directly to config writing
- After config is written, the next user action is to send any message to the bot to trigger pairing; when the user receives the pairing code, they send it to you for approval

### Phase 7: Pairing

Goal: allow the intended sender to use the configured channel.

All channels use the same pairing flow:

1. Tell the user to send any message to the bot in the external channel
2. Verdent automatically captures the sender identity and replies with a pairing code
3. The user sends the pairing code back to you (the agent) in this conversation
4. You run the approve-pairing command to verify the code and update the allowList

When the user sends you the pairing code, run:

```bash
verdent-manager gateway approve-pairing --code <CODE>
```

- If the result contains `approved: true`, pairing succeeded — tell the user and proceed to verification
- If the result contains `approved: false`, the code is invalid or expired — ask the user to resend a message to the bot to get a new code

Rules:

- **Do NOT ask the user for their user ID or sender ID** — the pairing flow captures it automatically for all channels
- **Do NOT tell the user to go to the Verdent app to enter the code** — you handle it directly with the approve-pairing command
- Do not manually edit the allowList files (`~/.verdent/workspace/base/allowList.json`) — the approve-pairing command updates the allowList automatically
- If pairing fails, troubleshoot the channel connection first instead of trying to manually allowlist

Stop when:

- the sender is approved through the pairing flow

### Phase 8: Verify And Handoff

Goal: verify the install state before handing off to normal usage.

Before declaring success, **read the actual files from disk** and confirm:

- the user-scoped workspace config (`~/.verdent/workspace/base/gateway.json`) exists and contains the correct channel config (read the file, parse JSON, check the channel key and credentials)
- if the pairing flow was completed, the user-scoped allowList (`~/.verdent/workspace/base/allowList.json`) exists and contains an entry for the approved sender (read the file to confirm)
- the channel is connected or ready for the final external user step
- Feishu post-connect requirements are complete if applicable
- pairing has been completed (user sent a message, received a code, and you approved it via `verdent-manager gateway approve-pairing`)

Use the workspace path `~/.verdent/workspace/base/` with the correct platform-specific base path (see "Verdent Home Directory" above). Do not assume the write succeeded — always verify by reading back.

Stop when:

- installation is verified by reading config files from disk, and
- the next user intent should be handled by the `gateway-file` or `gateway-msg` skill

## Direct File Editing Rules

When editing the workspace config (`~/.verdent/workspace/base/gateway.json`):

- **never write to `~/.verdent/workspace/gateway.json` (the old non-user-scoped path)** — the gateway will not detect changes there
- preserve existing unrelated channels and entries
- merge instead of overwrite
- keep valid JSON formatting
- explain exactly which keys were added or changed
- do not directly replace `~/.verdent/gateway.json` unless the user explicitly asks for a manual fallback
- if the channel still fails after config is written, continue troubleshooting instead of claiming success
- **after every write, read the file back from disk to verify** — confirm the file exists, the JSON is valid, and the expected keys are present. Use the platform-appropriate path (macOS/Linux: `~/.verdent/`, Windows: `%USERPROFILE%\.verdent\`)
- if the read-back does not match the expected content, report the issue and retry before proceeding

Do not manually edit the allowList files during installation. The allowList is updated automatically by `verdent-manager gateway approve-pairing`.

## Common Mistakes

- Repeating the full install flow when the user is only blocked on one step
- Overwriting unrelated channel config in `gateway.json`
- Manually editing `allowList.json` instead of using `verdent-manager gateway approve-pairing`
- Telling the user to go to the Verdent app to enter the pairing code instead of approving it directly
- Asking the user for their user ID or sender ID (the pairing flow captures this automatically)
- Editing the primary config `~/.verdent/gateway.json` instead of the user-scoped workspace config
- Writing to the old non-user-scoped path `~/.verdent/workspace/gateway.json` instead of `~/.verdent/workspace/base/gateway.json`
- Asking for pairing information before credentials are configured
- Claiming installation is complete before the final verification phase
- Using `directory` to judge whether a channel is currently configured instead of checking `gateway.json` `channels`
- Assuming a file write succeeded without reading the file back from disk to confirm
- Telling the user "you may need to restart the gateway" when config is already written but Verdent has not picked up the change
- Using `~/.verdent/` on Windows instead of the platform-appropriate `%USERPROFILE%\.verdent\` path

## Troubleshooting Rules

- If credentials are incomplete, ask only for the missing credential.
- If the channel is configured but disconnected, continue with reconnect or post-connect checks before redoing setup.
- If Feishu cannot receive messages, check long connection and `im.message.receive_v1`.
- If Slack only has one token, identify whether `xoxb-...` or `xapp-...` is missing.
- If Telegram is connected but the user is not allowed yet, continue from the pairing flow instead of repeating token setup.
- Do not say installation succeeded unless the final state is verified.
