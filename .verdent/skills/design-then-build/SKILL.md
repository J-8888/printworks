---
name: design-then-build
description: Use when the user asks to build a brand-new product UI from a text brief alone — no existing design files, mockups, screenshots, style guide, palette, or page list provided — and the project has a visible interface (full-stack app, web frontend, landing page, mobile app). Prefer over frontend-design whenever no concrete visual direction is supplied. Skip for trivial single-screen utilities (single form, single utility screen), when the user already supplies a complete style + page spec, or when the user explicitly says "skip design / just code".
metadata:
  version: "11.6.0"
---

# Design Then Build

A design-driven workflow that turns a product idea into a clear visual direction, full page designs, a plain-language product spec, faithful code restoration, and guided follow-up development.

The user is a product builder, not necessarily a developer. Keep all user-facing wording simple, direct, and free of engineering jargon.

## Manager dispatch rules (hard rule, Manager only)

These rules apply only when Manager (the orchestrator) is the caller. Ignore when this skill runs under a single agent.

1. **Verbatim prompt forwarding.** When Manager dispatches a step to a Worker, the user's original prompt MUST be passed through unchanged. No rewriting, summarizing, "prompt optimization", or paraphrasing.
2. **Unify all Worker dispatch on `claude-opus-4-6`.** Every Worker task in this workflow — style exploration, comp / image / asset generation, primary restoration, extended pages, and continued build — MUST be dispatched with `--model claude-opus-4-6`. No per-stage model split. Do not surface the model name to the user.

## Overview

The core principle: **decide what the product looks and feels like before writing any code, then keep every later decision tied back to that visual and product spec.**

Skipping straight to code on a 0-to-1 brief produces generic-looking products and forces expensive rewrites once the user sees the first rendering. Locking in a visual direction first makes everything downstream — pages, copy, assets, even backend task scope — cheaper and more coherent.

## When to use

`description` (frontmatter) decides whether to load this skill at all. This section decides what to do once it is loaded.

**Use when** the prompt is a build / project-creation request **and** the project has a visible interface:
- 0-to-1 product work (best fit)
- Full-stack apps
- Web frontends and landing pages
- Mobile apps

**Skip when:**
- The project is trivial and single-screen (e.g. a one-off form widget).
- The user provided a complete design brief: a concrete style direction, palette, type system, page list or screen flow.
- The user explicitly said "no design phase" or "just code".

If the brief is already fully specified, tell the user the brief is specific enough and move straight into page design and product spec, treating their brief as the chosen direction.

## Required sub-skill

**REQUIRED SUB-SKILL:** `create-image` — every image in this workflow goes through it. Load it before generating any image. The paths it returns are absolute and reusable across steps. All `verdent-image generate` / `verdent-image edit` commands in this workflow run via ordinary `bash` tool calls. When generating selectable style directions, run 4 independent commands in parallel; each output must include `--title` and one three-color `#RRGGBB` `--palette` that matches that direction's color system. Also put the same three-color system directly inside the prompt as explicit background / primary-ink / accent color instructions; `--palette` is still required for CLI/workflow metadata, but it is not enough by itself for image generation. After the user picks one style comp, when splitting that single style into multiple pages or multiple assets (i.e. one style reference → many outputs), pass the picked comp path with `--image` to each per-page/per-asset generation command.

## Workflow at a glance

Four internal stages. **Never mention these names or numbers to the user** — describe what is happening now and what comes next, in plain language.

| # | Stage | What it produces | When it runs | Reference |
|---|---|---|---|---|
| 1 | **style-exploration** | 4 distinct style comps for the primary screen; user picks one | Always, unless brief is fully specified | `references/style-exploration.md` |
| 2 | **primary-restoration** | Working frontend code restoring the chosen primary screen comp | Always after user picks | `references/restoration.md` and `references/high-fidelity-assets.md` |
| 3 | **extended-pages** | Additional page designs + spec → user confirms → restore those pages into frontend code | Only when user wants more pages | `references/pages-and-spec.md` |
| 4 | **continued-build** | Ask user whether to continue; if yes, drive backend / data / testing / deploy from the spec | After all frontend pages are done | `references/continued-build.md` |

## Decision tree

```
Build / code request with visible UI?
├── no  → exit skill, normal flow
└── yes → Brief already includes complete design + style + page list?
          ├── yes → go to stage 2 (primary-restoration), treat brief as chosen direction
          └── no  → stage 1 (style-exploration): 4 distinct comps
                    → user picks 1 comp
                    │
                    └── stage 2 (primary-restoration): restore chosen comp into working frontend (high-fidelity by default)
                        │
                        ├── first preview: open as soon as the primary screen is runnable and coherent on desktop
                        │
                        └── final QA, then ask: "Do you want to design other related pages?"
                            ├── yes → stage 3 (extended-pages): generate page designs + spec → user confirms → restore pages
                            └── no  → skip to stage 4
                        │
                        └── stage 4 (continued-build): ask "Do you want to continue with further development?"
                            ├── yes → drive backend / data / testing / deploy from spec
                            └── no  → done
```

## File organization (hard rule)

`<project-root>` is the agent's current working directory (`cwd`) shown in the `<verdent-env>` block as `Current working directory`. Treat it as the workspace root for all file operations unless the user explicitly says otherwise.

Every image generated by this skill must be copied into a stage-specific folder under `<project-root>`. Keep the original `create-image` output path untouched. Do not rely on the global `create-image` cache as the only copy, do not dump everything into one folder, and do not skip the copy step. Never use `mv`, rename, or delete the original generated image when organizing generated images. Without this, later stages cannot find their inputs and the user cannot review what was produced.

```
<project-root>/
├── verdent-design/
│   ├── stage1/                          # 4 style comps
│   │   ├── comp-1-{style}.png
│   │   ├── comp-2-{style}.png
│   │   ├── comp-3-{style}.png
│   │   └── comp-4-{style}.png
│   ├── stage2/                          # only if triggered
│   │   ├── pages/                       # per-page comps in chosen style
│   │   │   └── page-{n}-{name}.png
│   │   └── spec/                        # product requirements diagrams
│   │       └── spec-{n}-{topic}.png
│   └── stage3/                          # generated assets (raster)
│       └── source-renders/              # raw generator outputs before processing
└── assets/                              # final assets wired into the app
    ├── images/                          # right-angled raster assets
    ├── icons/                           # hand-authored SVG icons (HF mode)
    └── logo/                            # solid + alpha logo variants (HF mode)
```

Every stage's verification step runs `ls` on the corresponding folder and confirms the expected files exist before reporting completion.

## User communication

The user is a product builder. They care about results, not process labels.

- Do not say "stage 1 / stage 2 / phase 1 / phase 2" to the user. Say what is being done now and what comes next.
- Avoid technical jargon. Prefer "the look and feel", "your homepage", "the version that runs in the browser" over "frontend", "viewport", "render".
- Briefly explain anything technical before asking for a decision on it.

## Anti-AI quality bar

Before showing any image to the user, gut-check it against this list. If two or more apply, regenerate. AI defaults are easy to spot and immediately tell the user the work is generic.

- Looks like a Midjourney homepage
- Hero uses a purple→blue / teal→pink gradient with no reason
- All corners rounded the same amount
- Faceless silhouette or generic "diverse team" stock-AI photo
- Every section has the same `padding-y` rhythm
- Icons all the same line weight, evenly spaced, with a tiny accent dot
- Type system is one font at three sizes with no contrast

A senior designer's work has friction, opinion, and a point of view. Aim for that.

## Cross-stage common mistakes

These cut across every stage. Stage-specific mistakes live in each reference file.

| Mistake | Why it fails | Fix |
|---|---|---|
| Mentioning "stage 1 / phase 2" to the user | Confuses non-technical builders. | Say what is happening now in plain words. |
| Reporting a stage complete without `ls` verification | Missing files surface only when the user opens the project. | `ls` the stage's output folder, confirm expected files, state the verification method in the response. |
| Letting comp / asset / spec drift between stages | Later stages can't find inputs; restoration desyncs from approved design. | Save into the stage folder defined above; reuse, don't regenerate, what was already approved. |

## Stage map

Each stage's full rules, gates, and stage-specific mistakes live in its reference file. Load the file when you reach that stage.

- **1. style-exploration** → `references/style-exploration.md` — exactly 4 distinct style comps for the primary screen, image-only. Each comp presents one brand-style direction; let the composition and presentation serve that direction rather than forcing a fixed framing. Generate them as style candidates with 4 parallel commands; each command passes `--use-styles`, one `--title`, and one `--palette` containing three `#RRGGBB` colors. The prompt itself must also name the same three-color system for background / primary-ink / accent usage. A complete `create-image` prompt example: `examples/comp-prompt.md`. **Gate:** user picks one comp.
- **2. primary-restoration** → `references/restoration.md` + `references/high-fidelity-assets.md` — restore the chosen primary screen comp into working frontend code with high-fidelity approach (always loaded). For generated follow-up assets, use the picked comp as `--image` so the style anchor is explicit, and run those image commands with ordinary `bash` tool calls. **Default web stack: Vite + React + TS + Tailwind v4** unless the user named a stack or the project genuinely needs SSR / app routing — see `references/restoration.md` § "Default tech stack". **First preview:** open the runnable primary screen as soon as it is coherent on desktop. **Responsive is non-negotiable** — three breakpoints, verified before asking to continue. **Gate:** after responsive QA and final validation, ask whether to design other related pages.
- **3. extended-pages** → `references/pages-and-spec.md` — only when the user confirms they want more pages. Generate per-page comps in chosen style using the picked comp as `--image`, run those image commands with ordinary `bash` tool calls, then generate plain-language product spec image → confirm with user → restore all new pages into frontend code. **Gate:** all new pages restored and verified.
- **4. continued-build** → `references/continued-build.md` — ask the user whether to continue with further development (backend / data / testing / deploy). Only proceed if the user says yes.

## Changelog

See `CHANGELOG.md`. Current version: `11.6.0`.
