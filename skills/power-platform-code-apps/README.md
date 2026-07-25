# Power Platform Code Apps Agent Skill

Reusable guidance for building, connecting, authenticating, deploying,
debugging, and reviewing Microsoft Power Apps code apps hosted on Power
Platform.

Current version: **1.0.0**

## What It Covers

- React/Vite scaffolding with the Power Apps template
- npm-based `power-apps` CLI and existing `pac code` projects
- developer, runtime-user, and connector authentication boundaries
- tenant, environment, region, GCC, and sovereign-cloud targeting
- `power.config.json` and generated configuration
- Dataverse data modeling and metadata publication
- generated TypeScript models/services and CRUD patterns
- lookups, choices, DateOnly values, and autonumber behavior
- Dataverse file/image columns and browser preview limits
- Power Platform connectors and connection references
- Copilot Studio integration
- responsive hosted frontend architecture
- build, deployment, solutions, pipelines, and ALM
- field-tested troubleshooting and completion gates

## Package Contents

- `SKILL.md` - compact discovery and task-routing instructions.
- `references/power-platform-code-apps-field-guide.md` - detailed documented and
  field-tested guidance, loaded only when relevant.
- `VERSION` - current semantic version.
- `CHANGELOG.md` - release history.

## Install In One Workspace

Download the latest
[`power-platform-code-apps.zip`](https://github.com/kellycason/docs/releases/latest/download/power-platform-code-apps.zip),
extract it, and place the complete folder here:

```text
<workspace>/.github/skills/power-platform-code-apps/
```

The resulting path must be:

```text
<workspace>/.github/skills/power-platform-code-apps/SKILL.md
```

## Install Globally

Place the complete folder at:

```text
~/.copilot/skills/power-platform-code-apps/
```

## Install Or Update With A Script

On Windows:

```powershell
Invoke-WebRequest `
  https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.ps1 `
  -OutFile install-power-platform-skill.ps1

.\install-power-platform-skill.ps1 `
  -Skill power-platform-code-apps `
  -Scope Workspace

Remove-Item .\install-power-platform-skill.ps1
```

For a global installation, use `-Scope Global`. Add `-Force` to update an
existing installation. Pin a release with:

```powershell
-Version power-platform-code-apps-v1.0.0
```

On macOS or Linux:

```bash
curl -fsSLO https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.sh
chmod +x install-skill.sh
./install-skill.sh --skill power-platform-code-apps --scope workspace
rm install-skill.sh
```

Use `--scope global`, `--force`, or
`--version power-platform-code-apps-v1.0.0` as needed.

## Use

Ensure **Chat: Use Agent Skills** (`chat.agent.skills`) is enabled in VS Code,
then ask naturally, for example:

- "Scaffold a React Power Apps code app in this environment."
- "Connect this code app to these Dataverse tables."
- "Why is `pac code push` deploying to the wrong tenant?"
- "Add Dataverse file upload and browser preview."
- "Review this code app's authentication and connector architecture."
- "Prepare this code app for Dev, Test, and Prod deployment."

Copilot can discover the skill automatically, or invoke
`/power-platform-code-apps` explicitly.

## Other Agent Locations

The same package can be copied to:

- `.agents/skills/power-platform-code-apps/`
- `.claude/skills/power-platform-code-apps/`
- `~/.agents/skills/power-platform-code-apps/`
- `~/.claude/skills/power-platform-code-apps/`

## Evidence And Privacy

The guide distinguishes current first-party documentation, field-tested
behavior, target-environment verification, and pending assumptions. It contains
no tenant, customer, user, app, environment, connection, or record identifiers.

The copy in this repository is canonical. Improve it here, run the validator,
record the change in `CHANGELOG.md`, and publish a matching semantic-version tag.