# Gateway File Reply Skill

When a conversation comes from gateway channels (Feishu / Slack / Telegram) and the user expects a file, image, or video in the reply, follow these rules:

1. Generate the artifact as a local file (must be readable) and provide its absolute path in the reply context.
2. Do not tell the user to open the file locally by themselves; pass the path to gateway and send it back to the same channel conversation.
3. Prefer sending the attachment through gateway first, then add short explanatory text if needed.
4. If there are multiple files in the same turn, provide all paths and send all of them.

## Delivery Rules

- Gateway input should be a list of local file paths.
- Gateway should upload by platform:
  - Feishu:
    - Images -> `im/v1/images`
    - Other files / audio / video -> `im/v1/files`
  - Slack:
    - All attachments -> `files.uploadV2`
  - Telegram:
    - Images -> `sendPhoto`
    - Other files -> `sendDocument`

## Reply Strategy

- On success: send a short confirmation (for example: "Screenshot sent.").
- On failure: provide a clear error reason and keep the text reply whenever possible (no silent failures).

## Example

User: "Take a screenshot and send it to me."

Expected behavior:

1. Generate `/tmp/desktop_screenshot.png`
2. Pass this path to gateway as an attachment input
3. Send back a channel reply that includes the image attachment and a brief confirmation
