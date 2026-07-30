# Baseline Gap Analysis

This comparison was verified against the current repository and installed extension on 2026-07-30. Recheck upstream content before assuming the inventory is permanent.

## Microsoft Power Platform Skills Marketplace

Repository: `microsoft/power-platform-skills`

The marketplace manifest currently lists:

- `power-pages`
- `model-apps`
- `mcp-apps`
- `canvas-apps`
- `code-apps-preview`
- `mobile-app`
- `power-automate`

There is no Copilot Studio YAML authoring plugin on the repository's `main` branch. Repository searches return no `.mcs.yml`, `AdaptiveDialog`, `SearchAndSummarizeContent`, or `lookup-schema` authoring content.

The similarly named `plugins/code-apps/skills/add-mcscopilot/SKILL.md` has a different purpose: it adds the Microsoft Copilot Studio connector to a Power Apps code app so that app can invoke an already-built and published agent. It covers connector setup, `ExecuteCopilotAsyncV2`, response parsing, and code-app build steps. It does not create, edit, ground, route, validate, push, publish, or evaluate Copilot Studio YAML agents.

Do not route an authoring request to `add-mcscopilot`.

## Installed Copilot Studio Authoring Extension

The installed `coatsy.copilot-studio-skills` workflow extension is published by `coatsy` from the separate `coatsy/skills-for-copilot-studio` repository; its package metadata lists Microsoft as author. Its README describes it as an experimental research project, not an officially supported Microsoft product. It depends on the separate official `ms-copilotstudio.vscode-copilotstudio` extension for `LanguageServerHost`-backed push, pull, clone, and validation operations.

The workflow extension provides substantial baseline coverage:

- project discovery and schema lookup;
- topic, node, connector action, adaptive card, knowledge, variable, and child-agent authoring;
- agent instructions and settings edits;
- templates and general design patterns;
- `SearchAndSummarizeContent` recipes;
- LSP validation;
- pull, diff, push, clone, and publish operations;
- draft evaluations, published tests, and chat clients.

Use those capabilities rather than reproducing their templates.

## Gaps This Skill Adds

| Gap | Why it matters |
|---|---|
| Claim/source/policy/capability separation | Prevents instructions and generated answers from promising facts or actions the source and implementation do not support. |
| Source authority hierarchy | A summary may call itself authoritative while its disclaimer says official documents govern. The stricter source must control. |
| Uploaded-file provenance | A pulled `FileGroupKnowledgeSource` and a local source file are not proof that the remote file is uploaded, current, or refreshed. |
| Opaque identity preservation | Display names, filenames, schema names, and component names are not interchangeable; normalization can silently break references. |
| Hidden metadata as evidence | `.mcs/botdefinition.json` can disambiguate logical name, state, and status, but it is generated metadata and should not be hand-edited. |
| Full trigger collision audit | Multiple valid system triggers can coexist; static validation does not prove handler count, selection, or execution order at runtime. |
| Reference-graph routing | Disambiguation and dialog redirects can bypass the intended fallback even when each component is valid. |
| Empty-branch and dialog-stack semantics | Structurally valid empty conditions interact with `BeginDialog`, callee `startBehavior`, and `EndConversation`; names alone do not prove continuation or termination. |
| Active template residue review | Tutorial topics may remain active and route real user messages outside the declared domain. |
| Schema/LSP/runtime boundary | Static reference tables and the bundled schema can be incomplete or stale. Use schema lookup to draft, LSP to validate the connected authoring model, and runtime tests to prove behavior. |
| Runtime test matrix | Known-answer tests alone miss abstention, multi-turn query rewriting, collision precedence, auth, channel, and unsupported capability failures. |
| Local/remote safety before pull | Pull-before-push is correct only after uncommitted local work is identified and protected. |

## Maintenance Rule

When upstream adds equivalent guidance, remove duplication here and retain only the sharper project-derived rule or test. This skill should remain an engineering overlay, not a fork of the extension's template catalog.