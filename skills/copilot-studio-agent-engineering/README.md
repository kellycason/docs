# Copilot Studio Agent Engineering Skill

Reusable engineering guidance for building, editing, grounding, validating,
syncing, and testing Microsoft Copilot Studio YAML agents without confusing
valid authoring files with correct runtime behavior.

Current version: **1.1.0**

## What It Covers

- source facts, behavioral policy, implemented capability, and platform-state separation
- source authority and unsupported-capability checks
- uploaded-file knowledge provenance and remote indexing boundaries
- schema names, logical names, filenames, node IDs, and generated metadata
- embedded closed-list literals, variables, and Power Fx conditions
- duplicate system triggers, priority, routing, and reference-graph audits
- empty branches, dialog stack behavior, `startBehavior`, and `EndConversation`
- schema, LSP, draft-evaluation, publish, and channel-test boundaries
- pull-safe local/remote lifecycle and publication approval
- conversational file uploads and native Power Automate file contracts
- deterministic flow bindings, human review, explicit confirmation, and exactly-once transaction tests
- sovereign endpoint discovery, blocked-sync recovery, and validator health checks
- Direct Line attachment transport and custom Web Chat channel verification
- field-tested HR benefits and document-intake case studies

## Package Contents

- `SKILL.md` - compact workflow and task-routing instructions.
- `references/baseline-gap-analysis.md` - comparison with Microsoft's Power Platform marketplace and the separate Copilot Studio workflow extension.
- `references/identity-and-authoring.md` - identity, references, choices, variables, IDs, and generated metadata.
- `references/grounding-and-capabilities.md` - source authority, instructions, uploaded files, retrieval, and capability truthfulness.
- `references/routing-and-dialogs.md` - trigger collisions, dialog references, empty branches, and continuation semantics.
- `references/files-flows-and-transactions.md` - conversational uploads, registered flow tools, native file contracts, review-before-commit design, and Direct Line evidence.
- `references/lifecycle-and-tests.md` - safe synchronization, validation layers, evaluations, publication, and channel testing.
- `references/hr-benefits-case-study.md` - verified lessons that motivated the reusable rules.
- `references/document-intake-case-study.md` - sanitized evidence from an end-to-end document extraction, review, and transaction build.
- `VERSION` - current semantic version.
- `CHANGELOG.md` - release history.

## Install In One Workspace

Download the latest
[`copilot-studio-agent-engineering.zip`](https://github.com/kellycason/docs/releases/latest/download/copilot-studio-agent-engineering.zip),
extract it, and place the complete folder here:

```text
<workspace>/.github/skills/copilot-studio-agent-engineering/
```

The resulting path must be:

```text
<workspace>/.github/skills/copilot-studio-agent-engineering/SKILL.md
```

## Install Globally

Place the complete folder at:

```text
~/.copilot/skills/copilot-studio-agent-engineering/
```

## Install Or Update With A Script

On Windows:

```powershell
Invoke-WebRequest `
  https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.ps1 `
  -OutFile install-power-platform-skill.ps1

.\install-power-platform-skill.ps1 `
  -Skill copilot-studio-agent-engineering `
  -Scope Workspace

Remove-Item .\install-power-platform-skill.ps1
```

For a global installation, use `-Scope Global`. Add `-Force` to update an
existing installation. Pin a release with:

```powershell
-Version copilot-studio-agent-engineering-v1.1.0
```

On macOS or Linux:

```bash
curl -fsSLO https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.sh
chmod +x install-skill.sh
./install-skill.sh --skill copilot-studio-agent-engineering --scope workspace
rm install-skill.sh
```

Use `--scope global`, `--force`, or
`--version copilot-studio-agent-engineering-v1.1.0` as needed.

## Use

After installing the complete skill folder, ask naturally, for example:

- "Audit this Copilot Studio agent before I add another topic."
- "Why does this valid agent run the wrong fallback topic?"
- "Ground these agent instructions only in the uploaded policy document."
- "Review this topic's choice literals and dialog continuation behavior."
- "Fix this file upload topic and verify its Power Automate action contract."
- "Trace why Direct Line accepted an attachment but the extraction flow never ran."
- "Prepare this draft for validation, evaluation, and publication."

Copilot can discover the skill automatically, or invoke
`/copilot-studio-agent-engineering` explicitly.

## Other Agent Locations

The same package can be copied to:

- `.agents/skills/copilot-studio-agent-engineering/`
- `.claude/skills/copilot-studio-agent-engineering/`
- `~/.agents/skills/copilot-studio-agent-engineering/`
- `~/.claude/skills/copilot-studio-agent-engineering/`

## Evidence And Privacy

The skill distinguishes source evidence, owner-approved behavior, metadata,
authoring validation, and runtime verification. Its case study preserves the
technical lessons without publishing tenant, environment, identity, component,
or customer-specific deployment data.

The copy in this repository is canonical. Improve it here, run the validator,
record the change in `CHANGELOG.md`, and publish a matching semantic-version tag.