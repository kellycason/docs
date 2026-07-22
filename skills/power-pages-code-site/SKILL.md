---
name: power-pages-code-site
description: "Build, extend, secure, deploy, debug, or review Microsoft Power Pages SPA code sites using React, Vite, Dataverse, PAC CLI, Web API, Server Logic, SharePoint, and Microsoft Graph. Use when creating a Power Pages code site, configuring table permissions or authentication, integrating Dataverse or SharePoint documents, troubleshooting 403/500/cache/deployment failures, or validating a portal end to end."
argument-hint: "Describe the Power Pages code-site task or failure"
user-invocable: true
disable-model-invocation: false
---

# Power Pages Code Site

Use this skill for Power Pages **SPA code sites**, especially React/Vite sites
backed by Dataverse. It packages field-tested scaffolding, security, deployment,
SharePoint document-management, and troubleshooting guidance.

## Required Reference

Read the relevant portions of
[`references/power-pages-code-site-scaffolding-guide.md`](./references/power-pages-code-site-scaffolding-guide.md)
before making architecture, security, metadata, deployment, or runtime claims.
Do not load the entire guide when one or two sections answer the task.

## Route By Task

| Task | Guide sections |
| --- | --- |
| New code site and data model | §§1-4, Quick-Start Checklist |
| Authentication and web roles | §5, §8.4 |
| Table permissions and Web API | §§6-7, §9.3-9.4 |
| Runtime contact/account context | §8 |
| React/Vite architecture | §9 |
| SharePoint documents | §9.6 |
| Build and PAC deployment | §10 |
| Model-driven back office | §11 |
| Power Automate or Copilot Studio | §§12-13 |
| Runtime failure or regression | §15 |
| Completion and security validation | §16 |

## Working Rules

1. Inspect the target workspace and live metadata before choosing an
   implementation. Existing relationships, entity-set names, deployment mode,
   and runtime behavior control the solution.
2. Treat the guide as a pattern library, not a source of target IDs. Discover
   every environment URL, table/column logical name, relationship schema name,
   web-role ID, site ID, and component ID in the target environment.
3. Keep customer, tenant, credential, and environment data out of reusable
   artifacts. Use placeholders in documentation and examples.
4. Enforce authorization server-side. React visibility and client validation are
   user experience only.
5. Prefer the repository's existing framework and local patterns. Make the
   smallest behavior-scoped change and validate it immediately.
6. An HTTP success response is not proof of runtime behavior. Re-read stored
   metadata and test in an authenticated browser with a real permitted user.
7. Before deployment, verify the PAC profile and target organization in the same
   terminal process. After deployment, verify the intended site and matching
   HTML/JS/CSS build.
8. Run the applicable §16 completion gates before calling the work complete.

## SharePoint Document Rule

For SPA code sites, use React + Power Pages Server Logic + Microsoft Graph.
Never substitute a classic form iframe or the internal
`/_services/sharepoint-data.json` endpoint. Derive the authorized Dataverse
record server-side, resolve its existing SharePoint document location, use
`Sites.Selected`, and re-verify every item path before download, preview, or
delete. Read §9.6 before implementation.

## Evidence Discipline

Separate these states explicitly:

- **Documented**: supported by current first-party documentation.
- **Metadata-verified**: confirmed in the target Dataverse/Power Pages records.
- **Runtime-verified**: reproduced in the deployed site with the intended user.
- **Pending**: blocked by tenant governance, admin consent, propagation, or an
  unavailable test identity.

Do not promote a lower state to a higher one without the corresponding check.