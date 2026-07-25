---
name: power-platform-code-apps
description: "Build, extend, connect, authenticate, deploy, debug, or review Microsoft Power Apps code apps hosted on Power Platform. Use when scaffolding React/Vite code apps, configuring power.config.json, choosing the power-apps npm CLI or pac code commands, connecting Dataverse or Power Platform connectors, using generated TypeScript models and services, implementing lookups or file columns, integrating Copilot Studio, handling GCC or sovereign environments, planning ALM, or troubleshooting local and hosted runtime failures."
argument-hint: "Describe the Power Apps code app task, architecture question, or failure"
user-invocable: true
disable-model-invocation: false
---

# Power Platform Code Apps

Use this skill for Microsoft **Power Apps code apps**: code-first SPAs built in
an IDE, connected through the Power Apps client library, and hosted by Power
Platform. Do not confuse them with canvas apps, Power Pages code sites, PCF
controls, or standalone Azure-hosted SPAs.

## Required Reference

Read only the relevant sections of
[`references/power-platform-code-apps-field-guide.md`](./references/power-platform-code-apps-field-guide.md)
before making architecture, authentication, data, deployment, or support
claims. Product commands are evolving during preview, so verify current CLI
help and Microsoft documentation before applying a command.

## Route By Task

| Task | Guide sections |
| --- | --- |
| Decide whether a code app fits | §§1-3 |
| New React/Vite code app | §§4-5 |
| Authentication, tenant, environment, or region | §6 |
| `power.config.json` or generated configuration | §7 |
| Dataverse schema and tables | §8 |
| Generated TypeScript services and CRUD | §9 |
| Lookups, choices, dates, or auto-number fields | §§10-11 |
| Dataverse file/image columns | §12 |
| SharePoint, SQL, Outlook, Teams, or other connectors | §13 |
| Copilot Studio integration | §14 |
| Frontend architecture and host constraints | §§15-16 |
| Build, deploy, solution, or ALM | §17 |
| Failure diagnosis | §18 |
| Completion review | §19 |

## Standard Workflow

1. **Classify the project.** Determine whether this is a new npm-CLI project,
   an existing `pac code` project, or a migration. Do not mix command families
   blindly.
2. **Verify prerequisites and target.** Confirm Node LTS, code apps enabled in
   the environment, CLI versions, signed-in identity, active environment,
   region, and `power.config.json` alignment.
3. **Design data and security first.** Prefer standard Dataverse tables when
   they fit. Define tables, relationships, choices, ownership, security roles,
   and connection strategy before building screens.
4. **Prove the hosting pipeline.** Scaffold, initialize, run locally, build, and
   push the smallest baseline before adding substantial application logic.
5. **Add data sources deliberately.** Use current documented CLI commands,
   inspect generated models/services, and commit generated artifacts with the
   corresponding config/schema changes.
6. **Implement through generated APIs.** Use generated services for connector
   calls. Keep mapping, validation, orchestration, and UI state in handwritten
   modules outside `src/generated/`.
7. **Validate narrowly and in layers.** Run TypeScript/build checks after each
   slice, then test with a real user in the hosted Power Apps runtime.
8. **Deploy to an explicit target.** Reconfirm identity/environment, build,
   push, capture the returned app URL, and test the intended release. Use a
   non-default solution and connection references for ALM when applicable.

## Non-Negotiable Rules

1. Prefer the npm-based `power-apps` CLI for new projects. Treat `pac code` as
   the existing-project and currently documented data-source path until the
   npm CLI fully replaces it. Run `power-apps --help`, `pac code --help`, and
   consult current Microsoft Learn pages instead of inventing preview syntax.
2. Keep three authentication layers separate: developer CLI authentication,
   end-user authentication supplied by the Power Apps host, and downstream
   connector/connection identity. Never put tokens, client secrets, or browser
   cookie automation in frontend code.
3. Before any metadata mutation or deployment, prove the target with all three
   signals: active CLI profile, environment output, and `power.config.json`.
4. Do not infer a cloud, tenant, or region from a label such as GCC. Discover
   the actual target. Sovereign Power Platform endpoints and Azure CLI cloud
   selection are related operational concerns, not interchangeable facts.
5. Do not hand-edit generated models or services for ordinary application
   logic. Regenerate them from the data source and inspect the diff. Wrap a
   generated limitation in a handwritten adapter only when necessary.
6. Generated services provide transport, not authorization or business rules.
   Dataverse security roles, connector permissions, DLP policies, Conditional
   Access, and server-side validation remain authoritative.
7. Use logical/schema names and generated types. Never guess entity-set names,
   lookup navigation property names, choice integers, or action signatures.
8. Treat metadata publication and code generation as separate steps. After a
   schema change, publish/verify metadata, regenerate the data source, and then
   rebuild before writing UI code against the new field.
9. A successful push is not runtime validation. Open the returned app URL in
   the intended tenant profile and exercise loading, reads, writes, errors, and
   responsive layout.
10. Keep reusable artifacts free of tenant IDs, environment URLs, app IDs,
    connection IDs, emails, customer names, tokens, and screenshots containing
    deployment data.

## Evidence Discipline

Label important conclusions explicitly:

- **Documented**: supported by current first-party Microsoft documentation.
- **Field-tested**: reproduced in a real code app, but still verify against the
  target package/CLI version.
- **Target-verified**: confirmed in the current environment, generated files,
  and hosted runtime.
- **Pending**: blocked by permissions, admin settings, propagation, connection
  setup, or an unavailable test identity.

Do not promote a lower evidence state to a higher one without the corresponding
check.