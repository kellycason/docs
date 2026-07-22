# Power Pages Code Site Agent Skill

Reusable guidance for building, securing, deploying, debugging, and validating
Microsoft Power Pages SPA code sites with React, Vite, Dataverse, Server Logic,
SharePoint, and Microsoft Graph.

Current version: **1.0.0**

## Package Contents

- `SKILL.md` - compact discovery and workflow instructions loaded by an agent.
- `references/power-pages-code-site-scaffolding-guide.md` - the full field-tested
  guide, loaded only when relevant.
- `VERSION` - current semantic version.
- `CHANGELOG.md` - release history.

## Install In One Workspace

Download the latest
[`power-pages-code-site.zip`](https://github.com/kellycason/docs/releases/latest/download/power-pages-code-site.zip),
extract it, and place the complete folder here:

```text
<workspace>/.github/skills/power-pages-code-site/
```

The resulting path must be:

```text
<workspace>/.github/skills/power-pages-code-site/SKILL.md
```

## Install Globally

To make the skill available across your workspaces, place the complete folder at:

```text
~/.copilot/skills/power-pages-code-site/
```

## Install Or Update With A Script

From the target workspace on Windows:

```powershell
Invoke-WebRequest `
  https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.ps1 `
  -OutFile install-power-pages-skill.ps1

.\install-power-pages-skill.ps1 -Scope Workspace
Remove-Item .\install-power-pages-skill.ps1
```

For a global installation:

```powershell
.\install-power-pages-skill.ps1 -Scope Global
```

On macOS or Linux:

```bash
curl -fsSLO https://raw.githubusercontent.com/kellycason/docs/main/scripts/install-skill.sh
chmod +x install-skill.sh
./install-skill.sh --scope workspace
rm install-skill.sh
```

Rerun with `-Force` (PowerShell) or `--force` (Bash) to update an existing
installation. Pin a release with `-Version power-pages-code-site-v1.0.0` or
`--version power-pages-code-site-v1.0.0`.

## Use

Ensure **Chat: Use Agent Skills** (`chat.agent.skills`) is enabled in VS Code,
then ask naturally, for example:

- "Build a React Power Pages code site backed by these Dataverse tables."
- "Configure account-scoped table permissions for this portal."
- "Add SharePoint document upload to this Power Pages SPA."
- "Why does my deployed code site return 403 from the Web API?"
- "Review this Power Pages project against the completion checklist."

Copilot can discover the skill automatically, or you can invoke
`/power-pages-code-site` explicitly.

## Other Agent Locations

The same package can be copied to:

- `.agents/skills/power-pages-code-site/`
- `.claude/skills/power-pages-code-site/`
- `~/.agents/skills/power-pages-code-site/`
- `~/.claude/skills/power-pages-code-site/`

## Updating The Source

The copy in this repository is canonical. Improvements should be made here,
validated, recorded in `CHANGELOG.md`, and published as a tagged release. Local
workspace installations are snapshots and should be refreshed with the installer.
