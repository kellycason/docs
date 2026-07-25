# Power Platform Code Apps Field Guide

This guide helps a coding agent build and operate Microsoft Power Apps code
apps with React, Vite, TypeScript, Dataverse, Power Platform connectors, and
Copilot Studio. It combines current first-party documentation with patterns
reproduced in a substantial hosted code app.

Product behavior is evolving. Verify commands against the installed package,
CLI help, current Microsoft Learn documentation, and the target environment.

## 1. Scope And Product Boundaries

A Power Apps code app is a code-first single-page application that:

- is authored in an IDE with a normal JavaScript/TypeScript framework;
- uses the `@microsoft/power-apps` client library;
- receives generated TypeScript models and services for data sources;
- is described by `power.config.json`; and
- runs inside the Power Apps host, which handles app loading and end-user
  authentication.

Do not apply this guide unchanged to:

- canvas apps (`.pa.yaml` authoring);
- Power Pages websites or SPA code sites;
- PCF controls;
- model-driven app custom pages; or
- standalone web apps hosted in Azure, static hosting, or another platform.

Those products have different authentication, packaging, data-access, and
deployment models.

## 2. Architecture Mental Model

Use four layers when reasoning about a code app:

1. **Application code**: React/Vue/etc., routing, state, validation, domain
   logic, and UI.
2. **Power Apps client library**: runtime bridge and typed data operations.
3. **Generated artifacts**: connector schemas, models, services, and
   `dataSourcesInfo` derived from configured data sources.
4. **Power Apps host**: end-user authentication, app loading, sharing, policy
   enforcement, and hosted execution.

This separation prevents common mistakes:

- adding a second login flow when the host already authenticates users;
- calling Dataverse directly with hand-built bearer tokens;
- editing generated files to implement domain behavior;
- assuming a successful local Vite page proves hosted connector behavior; or
- treating a connector call as a server-side trust boundary.

## 3. When A Code App Is A Good Fit

Choose a code app when the solution needs:

- a custom, code-first SPA user experience;
- Power Platform hosting, sharing, governance, and Entra-backed access;
- Dataverse or supported connector access through generated JavaScript APIs;
- full control over component libraries and frontend architecture; and
- Power Platform ALM rather than separate web-hosting infrastructure.

Reconsider the choice when the dominant need is:

- anonymous or external website access (consider Power Pages);
- low-code form/process customization (consider model-driven or canvas apps);
- server-side secrets, long-running jobs, or privileged cross-tenant APIs
  (add an approved backend/flow/connector rather than placing them in the SPA);
- a control embedded on a form (consider PCF); or
- an unsupported connector that is central to the application.

## 4. Preflight Checklist

Before scaffolding or changing a project, collect:

- target tenant and environment;
- whether code apps are enabled in that environment;
- app display name and source folder;
- framework and package manager;
- Node.js LTS version;
- installed `@microsoft/power-apps` and CLI versions;
- intended Dataverse tables and other connectors;
- solution/publisher strategy;
- runtime users and required security roles;
- cloud/region requirements, including sovereign environments; and
- local browser profile used for the target tenant.

Run the applicable checks:

```powershell
node --version
npm --version
power-apps --help
pac --version
pac auth list
pac env who
```

Not every project needs both CLIs. The checks establish what is available and
which command lineage the existing project uses.

## 5. Scaffolding And CLI Strategy

### 5.1 New projects: prefer the npm CLI

Current Microsoft guidance uses the npm-based Power Apps CLI for initialization,
local run, and push:

```bash
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-code-app
cd my-code-app
npm install -g @microsoft/power-apps-cli
npm install
power-apps init --display-name "My Code App" --environment-id <environment-id>
npm run dev
```

Build and publish the smallest baseline before substantial implementation:

```bash
npm run build
power-apps push
```

Open the local play URL in the same browser profile used for the target Power
Platform tenant.

### 5.2 Existing projects: preserve command lineage

Many active projects were initialized with PAC CLI:

```powershell
pac auth list
pac auth select --index <profile-index>
pac env who
pac code init --displayName "My Code App" --environment <environment-id>
npm run build
pac code push
```

Do not migrate commands during an unrelated feature change. First establish:

- the installed `@microsoft/power-apps` version;
- whether `power-apps` is installed and authenticated correctly;
- whether data-source generation behaves identically; and
- whether the resulting `power.config.json` and generated artifacts are stable.

### 5.3 Hybrid command reality

The npm CLI is the forward path, but current first-party data-source guidance
still documents `pac code add-data-source`. Until Microsoft completes the
transition:

1. use current official documentation and CLI help for the installed version;
2. never translate a PAC command into guessed npm syntax;
3. record which CLI generated each project; and
4. validate generated config and source diffs after every command.

### 5.4 Vite integration

The official template configures the Power Apps Vite plugin. A typical config
contains:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { powerApps } from "@microsoft/power-apps-vite/plugin";

export default defineConfig({
  plugins: [react(), powerApps()],
});
```

Preserve the template's plugin and entry-point behavior. Add other Vite plugins
around it only after the baseline local and hosted app works.

## 6. Authentication, Environments, And Regions

### 6.1 Keep three identities separate

**Developer CLI identity**

- Used to initialize, generate data sources, and deploy.
- Controlled by `power-apps` authentication or PAC auth profiles.
- Must have maker/deployment rights in the target environment.

**Runtime end-user identity**

- Supplied by the Power Apps host through Microsoft Entra.
- Subject to app sharing, Conditional Access, Dataverse roles, and DLP.
- Should not be replaced by an app-owned MSAL login for normal Power Platform
  data access.

**Connector identity**

- Belongs to a Power Platform connection or connection reference.
- Its permissions and sharing behavior are connector-specific.
- Must be designed explicitly for ALM and least privilege.

Do not put passwords, tokens, client secrets, or refresh tokens in browser code,
source control, `power.config.json`, local storage, or generated files.

### 6.2 Prove the target before mutations and pushes

For PAC-based projects, verify:

```powershell
pac auth list
pac env who
```

If needed, select the intended profile explicitly:

```powershell
pac auth select --index <profile-index>
```

Then inspect `power.config.json` and confirm the same environment and region.
Do this in the same terminal context used for data-source generation or deploy.

### 6.3 Sovereign and GCC environments

Do not infer the required cloud or region from an organization label. Discover
the actual environment URL, tenant, cloud, and region from authenticated tools
and the target environment.

Field-tested pattern:

- `power.config.json` can require a sovereign region value such as
  `gccmoderate` rather than the commercial `prod` value.
- Azure CLI cloud selection and Power Platform region selection are not the
  same setting. Verify each independently.
- Browser authentication can default to the wrong signed-in tenant. Use a
  dedicated browser profile or explicit CLI account selection when needed.

### 6.4 Local browser authentication

Open Local Play in the same browser profile authenticated to the target tenant.
Since late 2025, Chromium local-network-access controls can also block a public
host from reaching localhost. If local play fails while Vite is healthy, check
the browser permission prompt and enterprise browser policy before changing app
code.

## 7. `power.config.json` And Generated Configuration

`power.config.json` is generated metadata used by the CLI and client library.
Application logic should not read it directly.

A sanitized structural example:

```json
{
  "version": "1.0",
  "appId": "<app-id>",
  "appDisplayName": "My Code App",
  "region": "prod",
  "appType": "CodeApp",
  "environmentId": "<environment-id>",
  "description": "My Code App",
  "buildPath": "./dist",
  "buildEntryPoint": "index.html",
  "localAppUrl": "http://localhost:3000",
  "connectionReferences": {},
  "databaseReferences": {}
}
```

Working rules:

- Generate the file with the CLI; do not author connection/database sections by
  hand.
- Verify `buildPath`, `buildEntryPoint`, `environmentId`, and `region` after
  initialization and after CLI changes.
- Never copy another tenant's app/environment/connection IDs into a new app.
- Treat real IDs as deployment metadata. They are not passwords, but keep them
  out of public templates and screenshots.
- Commit the policy appropriate to the repository. If the project needs
  reproducible ALM, commit sanitized/generated configuration as designed. If a
  local config is intentionally ignored, include a structural template and
  setup instructions.
- Inspect `.power/schemas/` and generated `dataSourcesInfo` when troubleshooting
  connector registration. Do not hand-patch them unless current Microsoft
  guidance explicitly requires it.

## 8. Dataverse Data Modeling

### 8.1 Model before screens

Design the Dataverse model first:

- standard versus custom tables;
- primary name and required fields;
- ownership model;
- choices and status/state behavior;
- one-to-many and many-to-many relationships;
- file/image columns and size limits;
- autonumber fields;
- security roles and field security;
- solution and publisher prefix; and
- migration/seed strategy.

Prefer standard `account` and `contact` when they fit. They integrate naturally
with Dataverse relationships, activities, ownership, reporting, and other Power
Platform features. Do not create a parallel custom person/organization model
without a concrete reason.

### 8.2 Use logical names and publish metadata

UI display names are not API names. Record and verify:

- table logical name;
- entity set name;
- column logical name;
- relationship schema/navigation name;
- choice integer values; and
- lookup target entity set.

After schema changes:

1. publish the metadata;
2. verify it through maker metadata or Dataverse metadata APIs;
3. regenerate/re-add the data source;
4. inspect generated diffs; and
5. run a TypeScript build before coding against the new field.

Metadata can take time to become available to OData and code generation. A
successful schema-create response does not prove immediate generated-schema
availability.

### 8.3 Add a Dataverse table

Current documented PAC command:

```powershell
pac code add-data-source -a dataverse -t <table-logical-name>
```

Run it once per required table. Generated artifacts normally include:

```text
src/generated/models/<Table>Model.ts
src/generated/services/<Table>Service.ts
.power/schemas/...
power.config.json changes
```

If table metadata changes, follow current CLI guidance. Depending on CLI
version, re-running the command can regenerate a Dataverse source, while other
connector sources may require delete and re-add. Never assume refresh behavior;
inspect CLI output and the Git diff.

## 9. Generated Models And Services

### 9.1 Treat generated code as a boundary

Generated services typically expose:

- `create`;
- `update`;
- `delete`;
- `get`;
- `getAll`;
- `getMetadata`; and
- file/image methods when supported by the source schema and CLI version.

Use them rather than direct `fetch` or `axios` calls for configured Power
Platform data sources.

Keep these concerns in handwritten code:

- mapping generated records into domain models;
- business validation;
- loading/error state;
- retry or concurrency policy;
- orchestration across multiple tables;
- optimistic updates; and
- user confirmations.

### 9.2 Inspect, do not guess

Generated names and signatures are authoritative for that project. Search the
specific model/service rather than reading huge files or relying on memory:

```powershell
rg "static async|getAll|@odata.bind|UploadColumnName" src/generated
```

Check:

- primary key field;
- required properties;
- choice union types;
- lookup bind property names;
- virtual `_..._value` lookup fields;
- formatted/display fields;
- operation return type; and
- file/image column-name union.

### 9.3 Unwrap operation results consistently

Generated operations return an operation-result envelope. Centralize the
success check:

```typescript
function requireData<T>(label: string, result: {
  success: boolean;
  data: T;
  error?: unknown;
}): T {
  if (!result.success) throw new Error(`${label} failed`);
  return result.data;
}
```

Then load in parallel where requests are independent:

```typescript
const [accountsResult, contactsResult] = await Promise.all([
  AccountsService.getAll({ top: 200 }),
  ContactsService.getAll({ top: 500 }),
]);

const accounts = requireData("accounts", accountsResult);
const contacts = requireData("contacts", contactsResult);
```

Use server-side `select`, `filter`, `orderBy`, `top`, and paging when supported.
Do not load an unbounded table and rely on client-side filtering as the dataset
grows.

### 9.4 Keep a domain mapping layer

Generated record types expose Dataverse naming and virtual columns. Map them
once into stable UI models:

```typescript
function mapContact(record: Contacts): ContactView {
  return {
    id: record.contactid,
    name: record.fullname || [record.firstname, record.lastname]
      .filter(Boolean)
      .join(" "),
    email: record.emailaddress1,
    accountId: record._accountid_value,
  };
}
```

This limits generated-schema churn and keeps components readable.

## 10. Lookups, Relationships, And Choices

### 10.1 Lookup binds

Create/update payloads use navigation-property binds when exposed by the
generated model:

```typescript
const payload = {
  name: "Example",
  "new_Account@odata.bind": `/accounts(${accountId})`,
};
```

Rules:

- inspect the generated model for the exact bind property;
- use the target **entity set** in the path, not a guessed table plural;
- include braces only if the generated/API pattern requires them;
- do not use the `_lookup_value` virtual read field as a write field; and
- verify reassignment by reloading the record.

Some standard polymorphic relationships expose generated types imperfectly.
Keep any necessary cast at a narrow adapter boundary and document why; do not
weaken types across the application.

### 10.2 Clearing a lookup

Clearing a relationship is different from omitting it. The exact update shape
depends on generated schema/runtime support. A field-tested pattern is to send
the bind property with `null` through a narrowly typed payload, then reload and
verify the lookup is actually empty. Do not infer success from an HTTP status
alone.

### 10.3 Choices

Dataverse stores integer choice values. Generated models often expose numeric
literal unions and formatted-name fields. Use the generated numeric values for
writes and map them to app-level string enums if that improves readability.
Never write display labels where an integer choice value is required.

### 10.4 Many-to-many and intersect tables

Use an explicit intersect table when the relationship itself carries data or
must be included in assistant/search context. Load and validate both lookup
sides. Deleting the join record should not delete either primary record.

## 11. Dates, Times, And Autonumber

### 11.1 DateOnly versus DateTime

Choose the Dataverse behavior intentionally:

- DateOnly for calendar dates with no time semantics;
- UserLocal DateTime for user-facing meeting/time values; and
- TimeZoneIndependent only when that behavior is truly required.

JavaScript parsing can turn a DateOnly value or midnight UTC into the previous
evening in a negative UTC offset. A field-tested local-date parser:

```typescript
function parseDateValue(value: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/;
  return dateOnly.test(value)
    ? new Date(`${value.slice(0, 10)}T00:00:00`)
    : new Date(value);
}
```

Use one shared date parser/formatter across cards, detail pages, sorting, and
forms. Test in at least two time zones when date correctness matters.

Dataverse does not allow every DateOnly/DateTime behavior change in place. A
safe migration can require a new column, data copy, app update, and old-column
retirement.

### 11.2 Autonumber

When Dataverse should generate an autonumber, omit the field from create
payloads. Sending a client value can override generation behavior. Retrieve the
created record afterward to display the generated value.

## 12. File And Image Columns

### 12.1 Store metadata and bytes deliberately

A robust document design often has:

- a Dataverse row for name, type, context, ownership, and timestamps; and
- a file column for the original bytes.

Create the metadata row first, then upload the file using the generated service:

```typescript
const createdResult = await DocumentsService.create({
  new_name: file.name,
});
const created = requireData("document create", createdResult);

const uploadResult = await DocumentsService.upload(
  created.new_documentid,
  "new_file",
  file,
);
if (!uploadResult.success) throw new Error("document upload failed");
```

Inspect the generated model's upload-column union rather than hardcoding a
column name from memory.

### 12.2 Download fallback

Current documentation describes generated file download support, but generated
output can differ by package/CLI version. First inspect the service. If the
needed method is absent, a handwritten adapter can use the configured client:

```typescript
import { getClient } from "@microsoft/power-apps/data";
import { dataSourcesInfo } from "../.power/schemas/appschemas/dataSourcesInfo";

const client = getClient(dataSourcesInfo);
const result = await client.downloadFileFromRecord(
  "new_documents",
  documentId,
  "new_file",
);
```

Keep this fallback outside generated files and verify it against the installed
client-library version.

### 12.3 Browser preview limits

Blob URLs preview formats that the browser can render, such as PDFs, images,
and text. Browsers do not natively render Office Open XML formats such as
`.docx`, `.xlsx`, `.pptx`, or Visio `.vsdx` from an in-memory blob.

For unsupported formats:

- disable/gray the preview control and preserve download; or
- store files in SharePoint/OneDrive and use an approved Office web viewer; or
- generate a separate PDF/image preview server-side without replacing the
  original.

Revoke object URLs when a preview closes. For multiple uploads, sequential
uploads are simpler and reduce connector pressure; controlled concurrency can
be added after measuring limits.

## 13. Other Power Platform Connectors

### 13.1 Connection setup

For non-Dataverse connectors, identify or create the connection in the target
environment, then add the data source with its exact API name and connection
metadata.

Nontabular example:

```powershell
pac code add-data-source -a <api-name> -c <connection-id>
```

Tabular example:

```powershell
pac code add-data-source `
  -a <api-name> `
  -c <connection-id> `
  -d <dataset-name> `
  -t <table-name>
```

Names can be case-sensitive and may contain encoded characters. Discover them
with current CLI list commands; do not guess.

### 13.2 Prefer connection references for ALM

Connection references are solution components and improve movement across
environments:

```powershell
pac code add-data-source `
  -a <api-name> `
  -cr <connection-reference-logical-name> `
  -s <solution-id>
```

For tabular connectors, use environment-variable references for dataset/table
values when supported:

```text
@envvar:<environment-variable-schema-name>
```

### 13.3 Inspect generated connector methods

Connector service files can be very large. Search for the exact operation and
read its signature. Do not infer parameter order from the connector's REST API.

### 13.4 Check connector support now

Connector support changes during preview. Current Microsoft documentation lists
exceptions, and those exceptions can change. For example, Excel Online
connectors have appeared in unsupported lists even though related connector
skills or older examples exist. Check the current code-app connector page before
committing to an architecture.

### 13.5 No browser-side privileged brokers

If a scenario needs cross-tenant privileged access, secrets, or APIs unavailable
through supported connectors, use an approved server-side broker, custom
connector, Power Automate flow, Azure Function, or another managed backend.
Never automate browser cookies or embed a powerful credential in the SPA.

## 14. Copilot Studio Integration

Code apps can add the Microsoft Copilot Studio connector when a compatible
published agent and connection exist in the environment.

Documented PAC pattern:

```powershell
pac connection list
pac code add-data-source `
  -a shared_microsoftcopilotstudio `
  -c <connection-id>
```

Then inspect the generated service for the exact invocation method and return
shape.

Field-tested design rules:

- keep the app's write operations in deterministic application code;
- send bounded, permission-scoped context rather than the whole database;
- validate every returned record reference before navigation;
- reject model-requested writes unless the user confirms and the app performs
  the typed operation;
- include every user-visible data surface and relationship table in assistant
  context when users expect it to be searchable; and
- keep current workspace context separate from global search/retrieval policy.

Do not assume Copilot Studio extension or sync tooling supports every sovereign
cloud route. Test the actual connector and environment.

## 15. Frontend Architecture

### 15.1 Recommended layers

Organize a substantial app into:

```text
src/
  generated/       # CLI-owned models/services
  data/            # adapters, mappers, orchestration
  domain/          # app-facing types and rules
  components/      # reusable UI
  features/        # screens/workflows
  App.tsx
```

Small apps can use fewer folders, but preserve the generated/handwritten
boundary.

### 15.2 Loading and error behavior

- Surface data-source failures instead of silently returning empty arrays.
- Keep last known good UI state when a refresh fails where appropriate.
- Disable duplicate submits and show progress for long connector operations.
- Refresh or reconcile state after writes; do not assume the response includes
  every formatted/virtual field.
- Use a deterministic local/demo fallback only when explicitly intended. Label
  it clearly so it cannot be mistaken for live Dataverse data.

### 15.3 Responsive host layout

The hosted app can run in constrained widths and beside persistent panes. Test:

- wide desktop;
- laptop width;
- narrow/mobile width;
- long labels and filenames;
- modals within the viewport; and
- side panes that resize the main workspace.

Avoid relying on browser-native `prompt()` or blocking dialogs in embedded host
contexts. Use in-app dialogs and user-initiated file/popup actions.

## 16. Local And Hosted Runtime Validation

Local Vite success and hosted Power Apps success are separate checks.

### Local checks

```powershell
npm run build
npm run lint
```

Run the appropriate local host (`npm run dev` or `power-apps run`) and verify:

- Local Play opens in the target tenant profile;
- connector reads/writes work;
- browser console has no unexpected errors;
- responsive layout works; and
- file/download/popup actions are user initiated.

### Hosted checks

After push:

- open the exact returned URL;
- hard-refresh or use the new URL if cached content appears;
- confirm the visible app version/build marker when available;
- test at least one read and one permitted write;
- test a user without broad maker/admin rights;
- confirm app sharing and Dataverse roles; and
- verify connection prompts/permissions for downstream connectors.

## 17. Deployment And ALM

### 17.1 Build before push

Never deploy an unvalidated source tree:

```powershell
npm run build
```

Then use the command family appropriate to the project:

```powershell
power-apps push
```

or:

```powershell
pac code push
```

Capture the returned app URL and deployment time.

### 17.2 Use solutions

Use a non-default solution and preferably configure it as the environment's
preferred solution. Existing PAC projects can target a solution explicitly:

```powershell
pac code push --solutionName <solution-unique-name>
```

Use connection references and environment variables for environment-specific
connector configuration. Use Power Platform Pipelines for Dev -> Test -> Prod
movement when available.

Current documented limitations include no solution packager support and no
Power Platform source-code integration for code apps. Keep the frontend source
in Git and treat the Power Platform solution as deployment/ALM packaging.

### 17.3 Deployment gate

Before pushing, record:

- Git commit/status;
- build result;
- CLI identity;
- environment ID/name;
- region;
- solution target;
- app ID/display name; and
- planned smoke test.

After pushing, record:

- returned play URL;
- deployment timestamp;
- hosted smoke-test result; and
- any connection or role setup still pending.

## 18. Troubleshooting Matrix

### Wrong tenant or environment

Symptoms:

- environment-not-found errors;
- data source appears in another tenant;
- push succeeds but updates the wrong app; or
- browser opens an unexpected environment.

Checks:

1. `pac auth list` and active marker;
2. `pac env who`;
3. `power.config.json` environment/region;
4. browser profile account; and
5. target app ID after push.

### Data source generation fails

Check:

- code apps enabled;
- environment ID and region alignment;
- CLI version;
- same credentials can open the data source in a browser;
- proxy/firewall requirements;
- exact table/API/dataset names; and
- connection exists in the target environment.

### Generated model is missing a new column

1. Publish metadata.
2. Verify the logical column in the target environment.
3. Wait for metadata propagation if just created.
4. Regenerate/re-add the data source per current CLI guidance.
5. Inspect the generated model and Git diff.
6. Build before using it.

### Lookup writes compile poorly or do nothing

- inspect generated `@odata.bind` property;
- verify entity set name;
- distinguish create bind, update bind, and clear behavior;
- isolate unavoidable casts; and
- reload the record to verify persistence.

### Date shows the previous day or an evening time

- inspect raw value and Dataverse behavior;
- treat DateOnly/midnight UTC as a calendar date;
- use a shared parser;
- remove time from DateOnly displays; and
- test another time zone.

### File uploads but cannot preview

- verify the file column and filename metadata;
- download bytes and compare length/type;
- remember Office/Visio formats are not browser-native blob previews;
- keep Download available; and
- revoke object URLs.

### Local play is blank or cannot reach localhost

- confirm Vite is running at the configured local URL;
- open Local Play in the same tenant browser profile;
- inspect local-network-access permission;
- inspect browser console/network failures; and
- verify the Power Apps Vite plugin is still configured.

### Push succeeds but old UI remains

- use the returned URL;
- hard-refresh;
- verify source build output changed;
- confirm the pushed app/environment ID; and
- add a visible build/version marker for diagnosis.

### Connector call returns 401/403

- distinguish app sharing from connector connection sharing;
- verify runtime user's Dataverse role or connector permission;
- inspect DLP and Conditional Access;
- confirm the connection belongs to the target environment; and
- test as the intended non-admin user.

### Production-only library behavior

Some frontend libraries have production license gates or host restrictions that
do not appear on localhost. Verify license terms and run a timed hosted smoke
test. Prefer permissively licensed, host-compatible libraries unless the
project carries the required production license.

## 19. Completion Gates

Do not call a code app complete until the applicable gates pass.

### Project and configuration

- [ ] Correct product type confirmed (code app, not Pages/canvas/PCF).
- [ ] CLI lineage and versions recorded.
- [ ] Environment, region, app ID, and config aligned.
- [ ] No tenant/customer identifiers in reusable templates.
- [ ] Generated and handwritten code boundaries preserved.

### Data and security

- [ ] Dataverse schema and relationships published.
- [ ] Generated services match target metadata.
- [ ] Security roles and app sharing defined.
- [ ] Connector identities/references documented.
- [ ] No secrets or tokens in frontend/source control.
- [ ] Writes validate input and require confirmation for consequential actions.

### Quality

- [ ] TypeScript/build passes.
- [ ] Relevant tests/lint pass.
- [ ] Loading, empty, error, and retry states work.
- [ ] Dates/time zones and lookups are verified.
- [ ] Files are verified byte-for-byte where applicable.
- [ ] Narrow and wide layouts are usable.

### Deployment

- [ ] Correct CLI profile/environment verified immediately before push.
- [ ] Intended solution/connection references used.
- [ ] Returned play URL captured.
- [ ] Hosted smoke test passes for a real intended user.
- [ ] Read and permitted write paths verified.
- [ ] Remaining propagation/admin dependencies labeled pending.

## 20. First-Party References

Use these current Microsoft sources before making version-sensitive claims:

- [Power Apps code apps overview](https://learn.microsoft.com/power-apps/developer/code-apps/overview)
- [Code apps architecture](https://learn.microsoft.com/power-apps/developer/code-apps/architecture)
- [npm CLI quickstart](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/npm-quickstart)
- [Create a code app from scratch](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/create-an-app-from-scratch)
- [Connect a code app to data](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/connect-to-data)
- [Connect a code app to Dataverse](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/connect-to-dataverse)
- [Add a Dataverse action or function](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/add-dataverse-action-function)
- [Use environment variables in data sources](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/use-environment-variables)
- [Connect to Copilot Studio](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/connect-to-copilot-studio)
- [Code apps ALM](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/alm)
- [PAC `code` command reference](https://learn.microsoft.com/power-platform/developer/cli/reference/code)
- [Troubleshoot adding a data source](https://learn.microsoft.com/power-apps/developer/code-apps/troubleshoot-add-datasource)

Where Microsoft documentation and field-tested behavior differ, report both,
include package/CLI versions, and prefer the current documented path for new
projects.