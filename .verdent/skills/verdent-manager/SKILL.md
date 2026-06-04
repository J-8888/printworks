---
name: verdent-manager
description: |
  Manage tasks, messages, workspaces, projects, models, slash commands, SSH,
  UI actions, and remote operations through the verdent-manager CLI —
  orchestration, message-driven execution, worktree/workspace setup, command
  catalog management, and remote project creation via SSH.
metadata:
  version: '1.2.0'
---

# Verdent Manager

Unified skill for Verdent's IPC-backed `verdent-manager` CLI.

## When to Use

- Create/query/stop/delete tasks, fetch recent tasks, and track child task progress
- Create tasks with a required initial prompt, send follow-up messages, send control messages (plan approval, clarification answers, confirmations), and inspect message history (with server-side filtering)
- Create worktrees/workspaces and check workspace stats
- List/add/remove projects
- List available models
- Manage slash commands (list/create/update/delete)
- SSH remote operations: list configured hosts, test connections, browse remote directories, create remote projects
- UI actions: show manager cards and update personalization

## Scope

- If a skill mention includes `[scope=worker]`, delegate the skill to a worker task.
- Do NOT expose the `[scope=worker]` tag itself to the worker or to the user in any manner.

## Core Concepts

### Task Modes

- **Normal mode** (default): the worker starts executing immediately after task creation or after receiving a follow-up message.
- In normal mode, the worker does the work directly and reports back through task notifications when it finishes or reaches another terminal state.
- **Plan mode**: the worker first prepares a plan instead of executing immediately.
- After the worker submits the plan, the task enters `pending` and waits for manager approval.
- The manager approves the plan with `verdent-manager message control --action-type submit_plan`.
- Use `--data '{}'` to approve the plan as-is.
- Use `--data '{"content":"..."}'` to approve with an edited plan.
- After approval, the worker begins execution and later reports completion through task notifications.
- Plan mode is useful for complex tasks where you want to review direction first, or for multi-step work that should be approved before execution starts.

### Pending-State Control Actions

- `submit_plan`: approve a plan-mode proposal and let the worker proceed, optionally with edited plan content.
- `submit_clarify`: answer a clarification request raised by the worker, such as a selection or form response.
- `skip_clarify`: skip a clarification request and let the worker make its own best judgment.
- `submit_code_review`: respond to a worker's code review request so it can continue with the requested feedback.

## CLI Shape

```bash
verdent-manager <resource> <action> [flags]
```

```text
verdent-manager — Manage tasks, messages, workspaces, projects, models, slash commands, SSH, and UI actions

Usage:
  verdent-manager <resource> <action> [flags]

Resources:
  task       Task lifecycle management
  message    Task messaging and pending-state control
  workspace  Worktree/workspace management
  project    Project management
  model      Model discovery
  command    Slash command management
  ssh        SSH remote operations
  ui         Manager UI actions
```

### task

```text
verdent-manager task — Task lifecycle management

Subcommands:
  create    --name <name> --prompt <text> [--pending-id <id>] (--project-id <id> | --project-path <path>)
            [--workspace-id <id>] [--worktree-path <path>]
            [--parent-task-id <id> | --parent-session-id <id>]
            [--mode normal|plan] [--model <model>]
            [--think-level <n>]
            --mode: normal (default) executes immediately; plan makes the worker propose a plan first,
            which enters pending until approved via `message control --action-type submit_plan`.
            See Core Concepts above for the full lifecycle.
            Create a task and queue the first prompt. Optionally link to a pending tracker item via --pending-id.

  get       --task-id <id>
            Get task details

  stop      --task-id <id>
            Request a running task to stop

  delete    --task-id <id>
            Delete a task

  recent    [--since-ms <epoch_ms>] [--limit <n>] [--min-count <n>]
            List recent tasks

  children  --task-id <parent-task-id>
            List child tasks under a parent task
```

### message

```text
verdent-manager message — Task messaging and pending-state control

Subcommands:
  send     --task-id <id> --message <text>
           [--mode normal|plan] [--model <model>]
           [--think-level <n>]
           --mode: normal (default) executes the message immediately; plan switches to plan mode
           where the worker proposes a plan before acting. See Core Concepts above.
           Send a follow-up message to a task

  control  --task-id <id> --action-type <type> [--data <json>] [--think-level <n>]

           <type> and --data:
             submit_plan        {"content":"<edited plan>"} or {}
             submit_clarify     {"result":[{"type":"select","text":"option A"},{"type":"mult","text":["option B","option C"]},{"type":"form","text":"extra details"}]}
             skip_clarify       {}
             submit_code_review {"content":"<review response>"}

           Notes:
             The latest pending interactive tool for the task is selected automatically.
             --data is the action input JSON only, not the full control body.
           Send a control message to resume the latest pending interactive task state

  list     --task-id <id>
           [--limit <n>] [--before <iso>] [--after <iso>]
           [--source user|agent|status|control]
           [--order asc|desc]
           [--body-type <type>] [--content-type <type>] [--min-length <n>]
           List task messages with server-side filtering
```

### workspace

```text
verdent-manager workspace — Worktree/workspace management

Subcommands:
  create  --name <name> (--project-id <id> | --project-path <path>) --base-branch <branch>
          Create a workspace/worktree

  stats   --workspace-id <id>
          Get workspace stats

  list    (--project-id <id> | --project-path <path>)
          List workspaces for a project
```

### project

```text
verdent-manager project — Project management

Subcommands:
  list
          List projects

  add     --path <path> --name <name>
          [--type local|remote]
          [--ssh-host <host>] [--ssh-hostname <host>] [--ssh-user <user>]
          [--ssh-port <port>] [--ssh-identity-file <file>]
          Add a local or remote project

  remove  --project-id <id> | --project-path <path>
          Remove a project
```

### model

```text
verdent-manager model — Model discovery

Subcommands:
  list
        List available models
```

### command

```text
verdent-manager command — Slash command management

Subcommands:
  list    [--project-path <path>] [--query <text>]
          List slash commands

  create  --name <name> --content <text> [--description <text>]
          Create a slash command

  update  --original-name <name>
          [--name <name>] [--content <text>] [--description <text>]
          Update a slash command

  delete  --name <name>
          Delete a slash command
```

### ssh

```text
verdent-manager ssh — SSH remote operations

Subcommands:
  list-hosts
                       List hosts from ~/.ssh/config

  test-connection      (--host <host> | --hostname <host>)
                       [--user <user>] [--port <port>] [--identity-file <file>]
                       Test SSH connectivity

  create-client        (--host <host> | --hostname <host>)
                       [--user <user>] [--port <port>] [--identity-file <file>]
                       Create a persistent SSH client session

  list-directories     --client-id <id> [--path <path>]
                       List directories on remote host

  get-home-directory   --client-id <id>
                       Get remote home directory

  release-client       --client-id <id>
                       Release a persistent SSH client

  release-all-clients
                       Release all SSH clients
```

### ui

```text
verdent-manager ui — Manager UI actions

Subcommands:
  show-card               --type memory-onboarding|prompt-recommendation [--payload <json>]
                          Show a manager UI card

  update-personalization  [--role-name <name>]
                          [--avatar green|blue|purple|red|yellow|custom]
                          [--avatar-url <url> | --avatar-file <file>]
                          Update manager role name and/or avatar
```

## Examples

### Example 1: Plan 模式完整流程

```bash
# 1. 创建 plan 模式任务
verdent-manager task create --name "重构认证模块" \
  --prompt "将 OAuth 改为 OIDC，保持 API 兼容" \
  --mode plan --project-path /path/to/project

# 2. worker 提交方案后任务进 pending，等审批
# 3. 查看 worker 的方案
verdent-manager message list --task-id <id> --source agent --limit 1

# 4. 审批方案（原样通过）
verdent-manager message control --task-id <id> --action-type submit_plan --data '{}'

# 或修改方案后通过
verdent-manager message control --task-id <id> --action-type submit_plan \
  --data '{"content":"只改 auth 层，不动 session 管理"}'

# 5. worker 开始执行，完成后通过 task notification 回报
```

### Example 2: Normal 模式 + 后续消息

```bash
# 创建任务
verdent-manager task create --name "修复登录bug" \
  --prompt "修复 #123 登录超时问题" \
  --project-path /path/to/project

# 任务运行中发现需要补充信息，发送后续消息
verdent-manager message send --task-id <id> --message "补充：只在 Safari 上复现"
```

### Example 3: 响应 worker 澄清

```bash
# worker 提了选择题，选第一个选项
verdent-manager message control --task-id <id> --action-type submit_clarify \
  --data '{"result":[{"type":"select","text":"option A"}]}'

# 跳过澄清，让 worker 自己判断
verdent-manager message control --task-id <id> --action-type skip_clarify --data '{}'
```

### Notes

```text
Output:
  Commands return JSON on stdout.
  Help/usage/error text is emitted on stderr by the desktop app.
Plan Mode:
  --mode plan can be used with task create and message send.
  In plan mode, tasks remain pending until a plan is approved.
Thinking:
  --think-level <n> controls worker reasoning depth and is optional.
Prerequisites:
  Verdent application must be running
  verdent-manager must be available in PATH
```
