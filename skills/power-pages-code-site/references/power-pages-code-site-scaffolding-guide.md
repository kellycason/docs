# Power Pages Code Site — AI Scaffolding Guide

> **Audience:** An AI agent (or human developer) standing up a Power Pages code site
> backed by a Dataverse schema from scratch.  
> **Based on:** The Contoso DMV Digital Services Portal — a React 19 SPA hosted on
> Power Pages with 14 custom Dataverse tables, Power Automate flows, and a
> Copilot Studio chat agent.  
> **What this guide does NOT contain:** environment-specific GUIDs. Every ID that
> matters must be captured at creation time and stored in your own reference doc.
>
> **Evidence rule:** This guide records behavior confirmed in our own Power Pages
> builds and exported site artifacts. It does not treat product documentation,
> forum advice, or an HTTP success response as proof of runtime behavior. Where
> two confirmed builds required different approaches, both are named explicitly.

---

## Table of Contents

1. [Prerequisites & Environment](#1-prerequisites--environment)
2. [Solution & Publisher Setup](#2-solution--publisher-setup)
3. [Dataverse Schema](#3-dataverse-schema)
4. [Power Pages Site Creation](#4-power-pages-site-creation)
5. [Web Roles & Authentication](#5-web-roles--authentication)
6. [Table Permissions](#6-table-permissions)
7. [Web API Site Settings](#7-web-api-site-settings)
8. [Liquid Runtime Context Bridge](#8-liquid-runtime-context-bridge)
9. [React SPA Architecture](#9-react-spa-architecture)
10. [Build & Deploy](#10-build--deploy)
11. [Model-Driven App for Back-Office](#11-model-driven-app-for-back-office)
12. [Power Automate Flows](#12-power-automate-flows)
13. [Copilot Studio Agent Integration](#13-copilot-studio-agent-integration)
14. [Demo Data Seeding](#14-demo-data-seeding)
15. [Known Gotchas & Hard-Won Lessons](#15-known-gotchas--hard-won-lessons)
16. [Validation & Definition of Done](#16-validation--definition-of-done)

---

## 1. Prerequisites & Environment

### 1.1 What you need before touching any table or site

- A **Power Platform environment** with a Dataverse database provisioned.
- Our schema and portal-configuration builds were run with **System
  Administrator** or **System Customizer** privileges. Verify the deploying
  identity can create the same component types before starting.
- **Power Pages** enabled on the environment (Admin Center → Environments → [Env] → Add Resources → Power Pages).
- **PAC CLI** installed locally: `npm install -g @microsoft/powerplatform-cli`
- **Azure CLI** installed for Dataverse REST token acquisition:
  `az login` → `az account set --subscription <your-subscription>`
- **Node.js ≥ 18** and **npm** for the React SPA build.
- If deploying to a **GCC / sovereign cloud**, note the different portal URL suffix
  (`powerappsportals.us` vs `powerappsportals.com`) and the correct Dataverse
  resource URI for `az account get-access-token --resource`.

### 1.2 Naming conventions (must be consistent)

Everything downstream — Liquid templates, Power Automate flows, Copilot Studio
topics, and the SPA's `/_api/` calls — binds by schema name. Change the prefix
but never break the pattern.

| Convention | Pattern | Example |
|---|---|---|
| Publisher prefix | `<prefix>_` | `dmv_` |
| Table schema name | `<prefix>_<lowercase>` | `dmv_vehicle` |
| Column schema name | `<prefix>_<camelCase>` | `dmv_licensenumber` |
| Choice name | `<prefix>_<descriptor>` | `dmv_licensestatus` |
| Entity set name | `<prefix>_<plural>s` | `dmv_vehicles` |
| AutoNumber format | `PREFIX-{YYYY}-{####}` | `REG-2026-00001` |

> **Rule:** Set the publisher prefix before creating any table. You cannot
> rename it later without breaking all schema references.

---

## 2. Solution & Publisher Setup

**Do this first, before any table.**

### 2.1 Create the Publisher

```
make.powerapps.com → Solutions → Publishers → New Publisher
  Display Name:  <YourApp>
  Name:          <yourapp>
  Prefix:        <yourprefix>   ← must be 2-8 characters, lowercase
```

Save the publisher ID — you will need it for API scripts.

### 2.2 Create the Solution

```
Solutions → New Solution
  Name:        <YourApp> Digital Services Portal
  Publisher:   <select yours>
  Version:     1.0.0.0
```

**Project rule: create or add all tables, columns, choices, and flows inside this
solution.**
Do not create tables at the environment level without adding them to the solution —
they will be impossible to export cleanly.

### 2.3 Script template for publisher + solution via REST API

```powershell
$envUrl  = "https://<your-org>.crm<N>.dynamics.com"   # or .crm9 for GCC
$token   = az account get-access-token --resource $envUrl --query accessToken -o tsv
$headers = @{
    Authorization    = "Bearer $token"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    "Content-Type"     = "application/json"
    Accept             = "application/json"
}

# Create publisher
$pub = @{
    uniquename        = "<yourprefix>"
    friendlyname      = "<YourApp>"
    customizationprefix = "<yourprefix>"
} | ConvertTo-Json
Invoke-RestMethod "$envUrl/api/data/v9.2/publishers" -Method POST -Headers $headers -Body $pub

# Create solution (use the publisherid returned above)
$sol = @{
    uniquename   = "<YourApp>DigitalServicesPortal"
    friendlyname = "<YourApp> Digital Services Portal"
    version      = "1.0.0.0"
    "publisherid@odata.bind" = "/publishers(<publisherid>)"
} | ConvertTo-Json
Invoke-RestMethod "$envUrl/api/data/v9.2/solutions" -Method POST -Headers $headers -Body $sol
```

---

## 3. Dataverse Schema

### 3.1 Design principles

- **Use the standard `contact` table for authenticated citizens.** Power Pages
  authentication maps Azure AD B2C / Entra External ID logins directly to
  `contact` records. Do not create a parallel citizen table — extend `contact`
  or relate custom tables back to it via a lookup.
- **Use the standard `account` table for B2B partners** (dealers, fleets, etc.)
  for the same reason.
- **One "parent" record per long-lived entity.** A vehicle registration is one
  parent record with child "term" records per period. Do not overwrite the
  parent on renewal — stack child records and point a lookup at the current one.
- **Denormalize critical read-paths.** If a child table has unreliable portal
  permissions (see §15 gotcha #2), copy the value onto the parent record and
  keep it updated via a Power Automate flow.
- **AutoNumber every primary ID column** that is user-visible. Dataverse
  AutoNumber with format `PREFIX-{SEQNUM:6}` worked across these builds. Omit
  the field from create payloads and retrieve the generated value afterward.

### 3.2 Core tables (minimum viable set)

#### `<prefix>_driverlicense` — Driver License

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| License Number | `<p>_licensenumber` | String (AutoNum) | Yes | Primary column |
| Contact | `<p>_contactid` | Lookup → contact | Yes | Owner |
| License Class | `<p>_licenseclass` | Choice | Yes | A/B/C/M/ID |
| License Status | `<p>_licensestatus` | Choice | Yes | Active/Expired/Suspended/Revoked |
| Issue Date | `<p>_issuedate` | DateTime | Yes | |
| Expiration Date | `<p>_expirationdate` | DateTime | Yes | Drives renewal reminders |
| Days Until Expiration | `<p>_daystoexpiration` | Integer | No | Calculated |
| REAL ID Compliant | `<p>_realidcompliant` | Boolean | Yes | Default: false |
| REAL ID Status | `<p>_realidstatus` | Choice | No | Not Started/In Progress/Approved |
| Online Renewal Eligible | `<p>_onlineeligible` | Boolean | Yes | |
| Renewal Count | `<p>_renewalcount` | Integer | No | Default 0 |
| Renewal Method | `<p>_renewalmethod` | Choice | No | Online/In-Person/Mail |
| Photo URL | `<p>_photourl` | String | No | |
| Notes | `<p>_notes` | Memo | No | |

#### `<prefix>_vehicle` — Vehicle

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| VIN | `<p>_vin` | String | Yes | Primary column, 17 chars |
| Year | `<p>_year` | **String** | Yes | ⚠ Use String not Integer — Dataverse locale formats integers with commas (e.g. "2,024") |
| Make | `<p>_make` | String | Yes | |
| Model | `<p>_model` | String | Yes | |
| Color | `<p>_color` | String | No | |
| Plate Number | `<p>_platenumber` | String | No | |
| Plate State | `<p>_platestate` | String | No | |
| Owner (Contact) | `<p>_ownercontactid` | Lookup → contact | No | Citizen owner |
| Owner (Account) | `<p>_owneraccountid` | Lookup → account | No | Dealer owner |
| Insurance Status | `<p>_insurancestatus` | Choice | No | Verified/Unverified/Lapsed |
| Insurance Carrier | `<p>_insurancecarrier` | String | No | |
| Insurance Policy | `<p>_insurancepolicy` | String | No | |
| Insurance Expiry | `<p>_insuranceexp` | DateTime | No | |
| Odometer | `<p>_odometer` | Integer | No | |
| Salvage Title | `<p>_salvagetitle` | Boolean | Yes | Default: false |
| Out of State | `<p>_outofstate` | Boolean | Yes | Default: false |

#### `<prefix>_vehicleregistration` — Vehicle Registration (parent)

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Registration ID | `<p>_registrationid` | String (AutoNum) | Yes | `REG-{YYYY}-{####}` |
| Vehicle | `<p>_vehicleid` | Lookup → `<p>_vehicle` | Yes | |
| Registrant (Contact) | `<p>_regcontactid` | Lookup → contact | No | |
| Registrant (Account) | `<p>_dealeracctid` | Lookup → account | No | |
| Registration Status | `<p>_regstatus` | Choice | Yes | See picklist below |
| Current Term | `<p>_currenttermid` | Lookup → `<p>_registrationterm` | No | Points to active term |
| **Expiration Date** | `<p>_expirationdate` | DateTime | No | **Denormalized** from current term — portal reads here |
| County | `<p>_county` | String | No | |
| Notes | `<p>_notes` | Memo | No | |

**Registration Status choices:**

| Value | Label |
|---|---|
| 100000000 | Active |
| 100000001 | Expired |
| 100000002 | Pending Payment |
| 100000003 | Pending Inspection |
| 100000004 | Suspended |
| 100000005 | Cancelled |

#### `<prefix>_registrationterm` — Registration Term (child)

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Term Number | `<p>_termnumber` | String (AutoNum) | Yes | `TERM-{YYYY}-{####}` |
| Vehicle Registration | `<p>_vehicleregistrationid` | Lookup → `<p>_vehicleregistration` | Yes | |
| Term Type | `<p>_termtype` | Choice | Yes | New=100000000 / Renewal=100000001 / Transfer=100000002 |
| Term Status | `<p>_termstatus` | Choice | Yes | Pending=100000001 / Active=100000000 / Expired=100000002 |
| Start Date | `<p>_startdate` | DateTime | Yes | |
| End Date | `<p>_enddate` | DateTime | Yes | |
| Issue Date | `<p>_issuedate` | DateTime | No | |
| Sticker Number | `<p>_stickernumber` | String | No | |

#### `<prefix>_registrationpayment` — Registration Payment (child of term)

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Payment Reference | `<p>_paymentref` | String (AutoNum) | Yes | `PAY-{YYYY}-{####}` |
| Registration Term | `<p>_registrationtermid` | Lookup → `<p>_registrationterm` | Yes | |
| Amount | `<p>_amount` | Money | No | |
| Late Fee | `<p>_latefee` | Money | No | |
| Total | `<p>_total` | Money | No | |
| Payment Status | `<p>_paymentstatus` | Choice | Yes | Unpaid=100000000 / Paid=100000001 / Refunded=100000002 |
| Payment Method | `<p>_paymentmethod` | Choice | No | Credit Card=100000000 / eCheck=100000001 |
| Payment Date | `<p>_paymentdate` | DateTime | No | |
| Transaction ID | `<p>_transactionid` | String | No | External payment ref |

#### `<prefix>_appointment` — DMV Appointment

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Appointment Number | `<p>_appointmentnumber` | String (AutoNum) | Yes | `APT-{YYYY}-{####}` |
| Contact | `<p>_contactid` | Lookup → contact | Yes | |
| Office | `<p>_officeid` | Lookup → `<p>_dmvoffice` | Yes | |
| Service Type | `<p>_servicetype` | Choice | Yes | |
| Appointment Date | `<p>_appointmentdate` | DateTime | Yes | |
| Appointment Time | `<p>_appointmenttime` | String | Yes | e.g. "10:00 AM" |
| Duration (mins) | `<p>_duration` | Integer | No | Default: 30 |
| Status | `<p>_status` | Choice | Yes | Scheduled/Confirmed/Checked-In/Completed/Cancelled/No-Show |
| Check-In Time | `<p>_checkintime` | DateTime | No | |
| Completion Time | `<p>_completiontime` | DateTime | No | |
| Cancel Reason | `<p>_cancelreason` | String | No | |
| Notes | `<p>_notes` | Memo | No | |

#### `<prefix>_dmvoffice` — Office Location Master

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Office Name | `<p>_officename` | String | Yes | Primary column |
| Office Code | `<p>_officecode` | String | Yes | |
| Address | `<p>_address1` … `<p>_zipcode` | String | Yes | |
| Phone | `<p>_phone` | Phone | No | |
| Hours | `<p>_hours` | Memo | No | |
| Latitude / Longitude | `<p>_latitude`, `<p>_longitude` | Decimal | No | |
| Max Appointments / Day | `<p>_maxappointments` | Integer | No | |
| Scheduling Enabled | `<p>_schedulingenabled` | Boolean | Yes | Default: true |
| Active | `<p>_active` | Boolean | Yes | Default: true |
| Services | `<p>_services` | Multi-Select Choice | No | |

#### `<prefix>_documentupload` — Document Upload

Enable **Notes** (attachments) on this table.

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Document Name | `<p>_documentname` | String | Yes | Primary column |
| Document Type | `<p>_documenttype` | Choice | Yes | |
| Submitted By (Contact) | `<p>_contactid` | Lookup → contact | No | |
| File URL | `<p>_fileurl` | String | No | Azure Blob / SP |
| File Type | `<p>_filetype` | String | No | |
| File Size (KB) | `<p>_filesize` | Integer | No | |
| Upload Date | `<p>_uploaddate` | DateTime | Yes | |
| Verification Status | `<p>_verificationstatus` | Choice | Yes | Pending/Accepted/Rejected |
| Verified Date | `<p>_verifieddate` | DateTime | No | |
| Rejection Reason | `<p>_rejectionreason` | Memo | No | |
| AI Extracted Data | `<p>_aiextracteddata` | Memo | No | JSON blob |
| AI Confidence Score | `<p>_aiconfidence` | Decimal | No | 0.0 – 1.0 |

#### `<prefix>_transactionlog` — Transaction Log

Cross-cutting audit table. Create one row per user-initiated action.

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Transaction ID | `<p>_transactionid` | String (AutoNum) | Yes | `TXN-{YYYY}-{####}` |
| Transaction Type | `<p>_transactiontype` | Choice | Yes | e.g. License Renewal / Registration / Payment |
| Transaction Date | `<p>_transactiondate` | DateTime | Yes | |
| Status | `<p>_status` | Choice | Yes | Completed / Pending / Failed |
| Amount | `<p>_amount` | Money | No | |
| Payment Reference | `<p>_paymentref` | String | No | |
| Channel | `<p>_channel` | Choice | No | Portal / Phone / In-Person |
| Initiated By | `<p>_initiatedby` | Lookup → SystemUser | No | |
| Contact | `<p>_contactid` | Lookup → contact | No | |
| Related Entity | `<p>_relatedrecordtype` | String | No | For polymorphic lookup |

#### `<prefix>_notification` — Outbound Notification Log

| Column | Schema Name | Type | Req | Notes |
|---|---|---|---|---|
| Notification Ref | `<p>_notificationref` | String (AutoNum) | Yes | |
| Notification Type | `<p>_notificationtype` | Choice | Yes | |
| Channel | `<p>_channel` | Choice | Yes | Email / SMS / Push |
| Subject | `<p>_subject` | String | No | |
| Preview Text | `<p>_previewtext` | Memo | No | |
| Template Name | `<p>_templatename` | String | No | |
| Delivery Status | `<p>_deliverystatus` | Choice | Yes | Queued / Sent / Failed |
| Sent Date | `<p>_sentdate` | DateTime | No | |
| Retry Count | `<p>_retrycount` | Integer | No | Default: 0 |
| Contact | `<p>_contactid` | Lookup → contact | No | |

### 3.3 Registration lifecycle — how renewal works

```
<prefix>_vehicleregistration  (permanent — one per vehicle/registrant)
  │
  ├──► <prefix>_registrationterm  (one per period: New, Renewal, Transfer)
  │         └──► <prefix>_registrationpayment  (one per term)
  │
  └── <prefix>_currenttermid ──► active term
```

**New registration (4 API calls):**

```
POST  <prefix>_vehicleregistrations   → get regId
POST  <prefix>_registrationterms      → get termId  (type=New, status=Pending)
POST  <prefix>_registrationpayments                 (status=Unpaid)
PATCH <prefix>_vehicleregistrations(regId)
      <prefix>_currenttermid@odata.bind = "/<prefix>_registrationterms(termId)"
```

**Renewal (5 API calls):**

```
POST  <prefix>_registrationterms      → newTermId  (type=Renewal, status=Pending)
POST  <prefix>_registrationpayments                (status=Unpaid, linked to newTermId)
PATCH <prefix>_registrationterms(oldTermId)   { <prefix>_termstatus: 100000002 }   ← Expired
PATCH <prefix>_vehicleregistrations(regId)
      { <prefix>_currenttermid@odata.bind: "/<prefix>_registrationterms(newTermId)",
        <prefix>_regstatus: 100000000,                                              ← Active
        <prefix>_expirationdate: "<newEndDate>T00:00:00Z" }                         ← denorm copy
```

**Key rule:** old terms and payments are **never deleted or overwritten**.
The full history is always queryable.

### 3.4 Creation order (avoid foreign-key failures)

```
1.  <prefix>_dmvoffice         (no upstream dependencies)
2.  <prefix>_vehicle           (no upstream)
3.  <prefix>_driverlicense     (→ contact)
4.  <prefix>_vehicleregistration  (→ vehicle, contact/account)  — skip <prefix>_currenttermid lookup for now
5.  <prefix>_registrationterm    (→ vehicleregistration)
6.  <prefix>_registrationpayment (→ registrationterm)
7.  Add <prefix>_currenttermid lookup on vehicleregistration now (→ registrationterm)
8.  <prefix>_appointment       (→ contact, dmvoffice)
9.  <prefix>_documentupload    (→ contact)
10. <prefix>_transactionlog    (→ contact)
11. <prefix>_notification      (→ contact)
```

---

## 4. Power Pages Site Creation

### 4.1 Create the site

```
make.powerapps.com → Apps → New App → Power Pages
  Template:     Blank (for a code/React site)
  Site name:    <YourApp>
  Domain:       <yourdomain>   ← becomes <yourdomain>.powerappsportals.com
  Environment:  <your env>
```

> ⚠ **GCC environments:** the domain becomes `<yourdomain>.powerappsportals.us`.
> All absolute URLs in Liquid, flows, and the SPA must use the `.us` suffix.

After creation, note:
- **Website ID** (`adx_websiteid`) — needed for scoping site settings
- **Portal URL** — used in flows and the Copilot Studio knowledge source

### 4.2 For a React code site (pac pages)

Initialize the project locally:

```bash
pac pages create-code-site --siteName "<YourApp>" --environment "<env-id>"
# This scaffolds package.json, vite.config.ts, src/, index.html
```

The working partner portal uses this `powerpages.config.json` shape:

```json
{
  "$schema": "https://www.schemastore.org/powerpages.config.json",
  "siteName": "<your-site-name>",
  "compiledPath": "dist",
  "defaultLandingPage": "index.html"
}
```

### 4.3 Enhanced-model ownership for code sites

Do not assume classic Power Pages column names or bindings own the runtime:

- The deployed SPA document is stored on the Home content page in
  `mspp_webpages.mspp_copy`, not `adx_copy`.
- `pac pages upload-code-site` maps `dist/index.html` into that Home page copy.
- Enhanced-model site settings are represented by `powerpagecomponent` records
  with type `9`; web templates use type `8`.
- Query the target site's records before PATCHing. A successful write to a
  classic-model table or column does not prove the code-site runtime reads it.

---

## 5. Web Roles & Authentication

### 5.1 Default web roles created by Power Pages

The sites we provisioned contained these two default web roles:

| Role | Purpose |
|---|---|
| **Anonymous Users** | Unauthenticated visitors |
| **Authenticated Users** | Any logged-in contact |

**Capture the Authenticated Users web role GUID immediately.** You will use it in
every table permission record.

The exported code-site role that this portal uses is:

```yaml
# .powerpages-site/web-roles/Authenticated-Users.webrole.yml
anonymoususersrole: false
authenticatedusersrole: true
id: <authenticated-users-web-role-id>
name: Authenticated Users
```

```powershell
# Retrieve web roles for your website
$websiteId = "<your-website-id>"
Invoke-RestMethod "$envUrl/api/data/v9.2/mspp_webroles?`$filter=_mspp_websiteid_value eq $websiteId&`$select=mspp_name,mspp_webroleid" `
  -Headers $headers
```

### 5.2 Additional web roles (if needed)

Create additional roles (e.g. **Dealer Users**, **DMV Staff**) via:

```
Power Pages Studio → Security → Web Roles → New
  Name:    Dealer Users
  Website: <your site>
```

Or via REST API:

```powershell
$wr = @{
  mspp_name = "Dealer Users"
  "mspp_websiteid@odata.bind" = "/mspp_websites(<websiteId>)"
} | ConvertTo-Json
Invoke-RestMethod "$envUrl/api/data/v9.2/mspp_webroles" -Method POST -Headers $headers -Body $wr
```

### 5.3 Assigning contacts to a web role

The exported **Authenticated Users** role has `authenticatedusersrole: true` and
was applied to signed-in users without a per-contact assignment. Custom roles
require explicit contact membership. An earlier build used the M:N relationship
`contact_mspp_webrole` for that membership:

```powershell
$assoc = @{ "@odata.id" = "$envUrl/api/data/v9.2/contacts(<contactId>)" } | ConvertTo-Json
Invoke-RestMethod "$envUrl/api/data/v9.2/mspp_webroles(<webRoleId>)/mspp_webrole_contact/`$ref" `
  -Method POST -Headers $headers -Body $assoc
```

### 5.4 Site visibility and invitation-only authentication

A newly activated private Trial site can force tenant Entra authentication before
portal-local sign-in, even when local login is enabled. For an invitation-only
site, configure these exact settings:

| Setting | Value |
|---|---|
| `Authentication/Registration/LocalLoginEnabled` | `true` |
| `Authentication/Registration/InvitationEnabled` | `true` |
| `Authentication/Registration/OpenRegistrationEnabled` | `false` |
| `Authentication/Registration/RequiresInvitation` | `true` |

Each value is stored as its own scaffold file using the proven site-setting
shape from §7.2. For example:

```yaml
# .powerpages-site/site-settings/Authentication-Registration-RequiresInvitation.sitesetting.yml
description: Require an invitation code for registration
id: <new-site-setting-guid>
name: Authentication/Registration/RequiresInvitation
value: true
```

Treat invitation configuration and user onboarding as separate operations. Do
not create or send contact invitations as a side effect of scaffolding or
deployment; require explicit approval for each onboarding action.

Treat the management API response as an attempted change, not verification. In
this build, `updateSiteVisibility` returned HTTP 200 while the site remained
private. Re-read the site state after every visibility update. Tenant governance
can block public visibility for non-production environments; a tenant admin must
allow the environment/site under Power Pages Governance Controls before retrying.

---

## 6. Table Permissions

Table permissions control what data the portal `/_api/` endpoint exposes to
authenticated (and anonymous) users. Without them, every `/_api/` call returns
**403**.

### 6.1 How they work

Each permission record is a `powerpagecomponent` (type = 18) with a JSON content
blob. In enhanced-model sites, the portal reads the web-role assignment from the
`adx_entitypermission_webrole` array inside that JSON blob. Keep the M:N
relationship in place when creating records through the APIs used by the build, but do not
rely on it by itself.

The content JSON must use the portal's lowercase property names. PascalCase keys
can be accepted by Dataverse but ignored by the portal runtime.

### 6.2 Scope values

| Value | Meaning |
|---|---|
| 756150000 | **Global** — all records (use for reference tables like dmvoffice) |
| 756150001 | **Contact** — only records where a lookup column matches the authenticated contact |
| 756150002 | **Account** — records belonging to the contact's parent account |
| 756150003 | **Self** — only the contact record itself |
| 756150004 | **Parent/Child** — records with a matching parent permission |

For a citizen portal, most tables use **Contact** scope (756150001).
Reference tables like `dmv_dmvoffice` use **Global** scope.

### 6.3 Proven enhanced-model table-permission files

The working code-site scaffold stores permissions under
`.powerpages-site/table-permissions/`. This account-scoped CRUD permission is the
shape that deployed and passed live validation:

```yaml
# .powerpages-site/table-permissions/Partner-Records.tablepermission.yml
accountrelationship: <validated-account-to-table-relationship-schema-name>
adx_entitypermission_webrole:
- <authenticated-users-web-role-id>
append: true
appendto: true
create: true
delete: true
entitylogicalname: <prefix>_record
entityname: Partner - Records
id: <new-permission-guid>
read: true
scope: 756150002
write: true
```

The working self-update permission for the signed-in contact is:

```yaml
# .powerpages-site/table-permissions/Partner-Own-Profile.tablepermission.yml
adx_entitypermission_webrole:
- <authenticated-users-web-role-id>
append: false
appendto: false
create: false
delete: false
entitylogicalname: contact
entityname: Partner - Own Profile
id: <new-permission-guid>
read: true
scope: 756150004
write: true
```

Use the exact relationship **schema name from target Dataverse metadata**. Do
not infer it from display names. Keep every key lowercase, keep `scope` numeric,
and embed the web-role ID in `adx_entitypermission_webrole`. After upload, call
`PublishAllXml`, retrieve the stored permission content, and test the permitted
operation in an authenticated browser. An M:N association or HTTP 204 alone is
not proof that the runtime will honor the permission.

### 6.4 Tables that need permissions (minimum)

| Table | Scope | Read | Write | Create | Delete |
|---|---|---|---|---|---|
| `contact` | Self | ✓ | ✓ | — | — |
| `<p>_driverlicense` | Contact | ✓ | — | — | — |
| `<p>_vehicle` | Contact | ✓ | ✓ | ✓ | — |
| `<p>_vehicleregistration` | Contact | ✓ | ✓ | ✓ | — |
| `<p>_registrationterm` | Global | ✓ | ✓ | ✓ | — |
| `<p>_registrationpayment` | Global | ✓ | ✓ | ✓ | — |
| `<p>_appointment` | Contact | ✓ | ✓ | ✓ | — |
| `<p>_documentupload` | Contact | ✓ | ✓ | ✓ | — |
| `<p>_dmvoffice` | Global | ✓ | — | — | — |
| `<p>_transactionlog` | Contact | ✓ | ✓ | ✓ | — |

> ⚠ **See §15 Gotcha #2** for a known issue where permissions on *newly created*
> tables silently fail even when correctly configured.

---

## 7. Web API Site Settings

For each table you want accessible via `/_api/`, you must create two site
settings scoped to your website.

### 7.1 Required site settings per table

```
Webapi/<entity_logical_name>/enabled = true
Webapi/<entity_logical_name>/fields  = <comma-separated logical column names>
```

The deployed portal enumerates fields. Include primary IDs, fields used by the
UI, lookup bind fields, and lookup value properties used by filters. Do not add a
column because its display name looks right; use the Dataverse logical name.

### 7.2 Proven enhanced-model site-setting files

```yaml
# .powerpages-site/site-settings/Webapi-prefix-record-enabled.sitesetting.yml
description: Enable Web API access for <prefix>_record table
id: <new-site-setting-guid>
name: Webapi/<prefix>_record/enabled
value: true
```

```yaml
# .powerpages-site/site-settings/Webapi-prefix-record-fields.sitesetting.yml
description: Allowed fields for <prefix>_record Web API access
id: <new-site-setting-guid>
name: Webapi/<prefix>_record/fields
value: <prefix>_recordid,<prefix>_name,<prefix>_status,_<prefix>_account_value
```

The two files use different GUIDs. Upload them with the code-site scaffold,
publish, and verify that enhanced-model `powerpagecomponent` records of type `9`
exist for the exact names and values. Then test `/_api/` while signed in. Site
setting changes can take 5-15 minutes to reach the portal cache.

### 7.3 Enhanced-model site settings

On enhanced-model code sites, the type `9` component is the runtime-owning record
we verified. Do not substitute a classic-model REST payload merely because the
request succeeds. Validate exact setting names, website ownership, and values
from the type `9` records, then publish before testing `/_api/`.

---

## 8. Liquid Runtime Context Bridge

Liquid is the bridge between the Power Pages server and the React SPA, but a code
site must not assume the website's Header binding runs on every route. In this
build, the code site ignored that binding: `/` was Liquid-processed while direct
client-side routes such as `/employees` received raw page copy with literal
Liquid expressions. The safe pattern is to build the bridge into
`dist/index.html`, which is deployed to the Home page's `mspp_copy`.

### 8.1 Earlier DMV injection pattern

The DMV build successfully injected separate `__PORTAL_USER__` and
`__APP_DATA__` globals with Liquid and FetchXML. This pattern remains here
because it was proven in that build. For code sites whose deep routes receive
raw page copy, use the partner-portal bridge in §8.4 instead.

```html
<script>
{% if user %}
  window.__PORTAL_USER__ = {
    id:   "{{ user.id }}",
    name: "{{ user.fullname | escape }}"
  };
{% else %}
  window.__PORTAL_USER__ = null;
{% endif %}
</script>

{% assign token_response = '/_layout/tokenhtml' | request %}
{{ token_response }}

{% if user %}
<script>
  {% fetchxml contact_query %}
    <fetch top="1">
      <entity name="contact">
        <attribute name="address1_line1"/>
        <attribute name="address1_city"/>
        <attribute name="telephone1"/>
        <filter>
          <condition attribute="contactid" operator="eq" value="{{ user.id }}"/>
        </filter>
      </entity>
    </fetch>
  {% endfetchxml %}

  {% assign c = contact_query.results.entities[0] %}

  {% fetchxml vehicles_query %}
    <fetch>
      <entity name="<p>_vehicle">
        <attribute name="<p>_vin"/>
        <attribute name="<p>_year"/>
        <attribute name="<p>_make"/>
        <attribute name="<p>_model"/>
        <attribute name="<p>_platenumber"/>
        <attribute name="<p>_color"/>
        <attribute name="<p>_insurancestatus"/>
        <filter>
          <condition attribute="<p>_ownercontactid" operator="eq" value="{{ user.id }}"/>
        </filter>
      </entity>
    </fetch>
  {% endfetchxml %}

  {% fetchxml regs_query %}
    <fetch>
      <entity name="<p>_vehicleregistration">
        <attribute name="<p>_registrationid"/>
        <attribute name="<p>_regstatus"/>
        <attribute name="<p>_expirationdate"/>
        <attribute name="<p>_vehicleid"/>
        <filter>
          <condition attribute="<p>_regcontactid" operator="eq" value="{{ user.id }}"/>
        </filter>
      </entity>
    </fetch>
  {% endfetchxml %}

  window.__APP_DATA__ = {
    citizen: {
      id:       "{{ user.id }}",
      fullName: "{{ user.fullname | escape }}",
      address:  "{{ c.address1_line1 | escape }}",
      phone:    "{{ c.telephone1 | escape }}"
    },
    vehicles: [
      {% for v in vehicles_query.results.entities %}
      {
        id:              "{{ v.<p>_vehicleid }}",
        vin:             "{{ v.<p>_vin | escape }}",
        year:            "{{ v.<p>_year | escape }}",
        make:            "{{ v.<p>_make | escape }}",
        model:           "{{ v.<p>_model | escape }}",
        plateNumber:     "{{ v.<p>_platenumber | escape }}",
        color:           "{{ v.<p>_color | escape }}",
        insuranceStatus: {{ v.<p>_insurancestatus }}
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ],
    registrations: [
      {% for r in regs_query.results.entities %}
      {
        id:             "{{ r.<p>_vehicleregistrationid }}",
        regId:          "{{ r.<p>_registrationid | escape }}",
        status:         {{ r.<p>_regstatus }},
        vehicleId:      "{{ r.<p>_vehicleid }}",
        expirationDate: "{{ r.<p>_expirationdate | date: '%Y-%m-%d' }}"
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ]
  };
</script>
{% endif %}
```

### 8.2 Liquid rules — read these before touching the template

| Pattern | Correct | WRONG (will crash) |
|---|---|---|
| Option set integer value | `{{ r.<p>_regstatus }}` | `{{ r.<p>_regstatus.Value }}` — returns nil |
| Option set label | Avoid labels in script data; map integer values in React | `{{ r.<p>_regstatus.Label }}` can silently fail on some portal caches |
| Lookup GUID | `{{ r.<p>_vehicleid }}` | |
| Date format | `{{ r.<p>_date \| date: '%Y-%m-%d' }}` | |
| String escaping | `"{{ r.<p>_name \| default: '' \| escape }}"` | unquoted Liquid output |
| Boolean output | `{% if r.<p>_flag %}true{% else %}false{% endif %}` | `{{ r.<p>_flag }}` emits `True`/`False`, which is invalid JS |
| Loop comma | `{% unless forloop.last %},{% endunless %}` | trailing comma = JSON parse error |
| Link-entity field | `{{ r.alias_fieldname }}` | `{{ r['alias.field'] }}` — **bracket notation kills the entire `<script>` block silently** |

### 8.3 Prior-build Header deployment path

This path applies only after verifying that the target site consumes its Header
web-template binding. The current partner code site did not consume that binding
on client routes and uses §8.4 instead. In enhanced-model Power Pages sites,
`mspp_webtemplate` PATCH can fail with `0x80040224` or `0x80040333`; the editable
copy is often the mirror `powerpagecomponent` record with `mspp_type = 8` and the
same ID. Patch that component's JSON `content` instead of assuming
`mspp_source` is writable.

```powershell
# Get the header web template ID first
$wt = Invoke-RestMethod "$envUrl/api/data/v9.2/mspp_webtemplates?`$filter=mspp_name eq 'Header'&`$select=mspp_webtemplateid" -Headers $headers
$templateId = $wt.value[0].mspp_webtemplateid

# Read the HTML file and patch the enhanced-model mirror component.
$html = Get-Content ".\_header.html" -Raw -Encoding UTF8
$componentContent = @{
    source = $html
    websiteid = $websiteId
} | ConvertTo-Json -Compress

$body = @{ content = $componentContent } | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Invoke-WebRequest "$envUrl/api/data/v9.2/powerpagecomponents($templateId)" `
  -Method Patch -Headers $headers -Body $bytes -UseBasicParsing

Invoke-RestMethod "$envUrl/api/data/v9.2/PublishAllXml" -Method POST -Headers $headers -Body "{}"
```

> ⚠ Updating the SPA bundle can reset the Header component back to `<div/>`.
> If the site actually consumes the Header binding, deploy it separately after
> the bundle upload and publish before testing. Code sites should also bake the
> bridge into `dist/index.html`; do not rely on the binding alone.

### 8.4 Resilient code-site context bootstrap

Keep one bridge source file and inject it immediately after `<body>` during
Vite's `transformIndexHtml`. The bridge should:

1. Render a hidden context element from Liquid and initialize the SPA's global
  contact/account context.
2. On a correctly processed Home page, save that context to `sessionStorage`.
3. On a raw deep route, detect unprocessed Liquid and restore the saved context.
4. If no saved context exists, save the requested route, redirect to `/` to run
  Liquid, and restore the intended route with `history.replaceState` before
  React mounts.
5. Fetch `/_layout/tokenhtml` so Web API writes can read the antiforgery token.

The following is the deployed bridge with only business-specific image URLs and
storage-key names removed:

```html
<script>
  window.__POWER_PAGES_SITE__ = true;
  window.__PORTAL_CONTEXT__ = null;
</script>
{% if user %}
{% assign account_reference = user.parentcustomerid %}
{% assign account = entities.account[account_reference.id] %}
<div
  id="portal-runtime-context"
  hidden
  data-contact-id="{{ user.id | escape }}"
  data-contact-first-name="{{ user.firstname | escape }}"
  data-contact-last-name="{{ user.lastname | escape }}"
  data-contact-full-name="{{ user.fullname | escape }}"
  data-contact-email="{{ user.emailaddress1 | escape }}"
  data-contact-phone="{{ user.telephone1 | escape }}"
  data-contact-mobile-phone="{{ user.mobilephone | escape }}"
  data-contact-job-title="{{ user.jobtitle | escape }}"
  data-contact-address-line-1="{{ user.address1_line1 | escape }}"
  data-contact-address-line-2="{{ user.address1_line2 | escape }}"
  data-contact-city="{{ user.address1_city | escape }}"
  data-contact-state="{{ user.address1_stateorprovince | escape }}"
  data-contact-postal-code="{{ user.address1_postalcode | escape }}"
  data-username="{{ user.adx_identity_username | escape }}"
  data-account-id="{{ account_reference.id | escape }}"
  data-account-name="{{ account.name | default: account_reference.name | escape }}"
  data-account-phone="{{ account.telephone1 | escape }}"
  data-account-email="{{ account.emailaddress1 | escape }}"
  data-account-website="{{ account.websiteurl | escape }}"
  data-account-address-line-1="{{ account.address1_line1 | escape }}"
  data-account-address-line-2="{{ account.address1_line2 | escape }}"
  data-account-city="{{ account.address1_city | escape }}"
  data-account-state="{{ account.address1_stateorprovince | escape }}"
  data-account-postal-code="{{ account.address1_postalcode | escape }}"
  data-currency-id="{{ account.transactioncurrencyid.id | escape }}"
></div>
<script>
  (function () {
    var STORAGE_KEY = 'portalRuntimeContext';
    var INTENDED_KEY = 'portalIntendedPath';
    var node = document.getElementById('portal-runtime-context');
    if (!node) return;

    var data = node.dataset;
    var LIQUID_OPEN = String.fromCharCode(123, 123);
    var liquidProcessed = (data.contactId || '').indexOf(LIQUID_OPEN) === -1;

    if (liquidProcessed) {
      var context = {
        contact: {
          id: data.contactId || '',
          firstName: data.contactFirstName || '',
          lastName: data.contactLastName || '',
          fullName: data.contactFullName || '',
          email: data.contactEmail || '',
          phone: data.contactPhone || '',
          mobilePhone: data.contactMobilePhone || '',
          jobTitle: data.contactJobTitle || '',
          addressLine1: data.contactAddressLine1 || '',
          addressLine2: data.contactAddressLine2 || '',
          city: data.contactCity || '',
          state: data.contactState || '',
          postalCode: data.contactPostalCode || '',
          username: data.username || ''
        },
        account: {
          id: data.accountId || '',
          name: data.accountName || '',
          phone: data.accountPhone || '',
          email: data.accountEmail || '',
          website: data.accountWebsite || '',
          addressLine1: data.accountAddressLine1 || '',
          addressLine2: data.accountAddressLine2 || '',
          city: data.accountCity || '',
          state: data.accountState || '',
          postalCode: data.accountPostalCode || '',
          currencyId: data.currencyId || ''
        }
      };

      window.__PORTAL_CONTEXT__ = context;
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context)); } catch (error) {}

      try {
        var intended = sessionStorage.getItem(INTENDED_KEY);
        if (intended && intended !== '/' && window.location.pathname === '/') {
          sessionStorage.removeItem(INTENDED_KEY);
          window.history.replaceState(null, '', intended);
        }
      } catch (error) {}

      fetch('/_layout/tokenhtml', { credentials: 'same-origin' })
        .then(function (response) { return response.text(); })
        .then(function (markup) {
          var tokenContainer = document.createElement('div');
          tokenContainer.hidden = true;
          tokenContainer.innerHTML = markup;
          document.body.appendChild(tokenContainer);
        })
        .catch(function () {});
    } else {
      var saved = null;
      try { saved = sessionStorage.getItem(STORAGE_KEY); } catch (error) {}

      if (saved) {
        try { window.__PORTAL_CONTEXT__ = JSON.parse(saved); } catch (error) {}
      } else {
        try {
          sessionStorage.setItem(
            INTENDED_KEY,
            window.location.pathname + window.location.search
          );
        } catch (error) {}
        window.location.replace('/');
      }
    }
  })();
</script>
{% endif %}
```

Keep this source in one file. The working portal stores it at
`.powerpages-site/web-templates/header/Header.webtemplate.source.html` and the
Vite plugin in §9.5 injects that same file into `dist/index.html` on every build.

Set `Header/OutputCache/Enabled = false` whenever a Header template emits
user-specific context. Otherwise cached output can cross requests or leave stale
identity data even when the Liquid and React logic are correct.

```yaml
# .powerpages-site/site-settings/Header-OutputCache-Enabled.sitesetting.yml
description: Set whether the header web template is output cached.
id: <new-site-setting-guid>
name: Header/OutputCache/Enabled
value: false
```

Never place an unmatched Liquid opening or closing delimiter intended as
JavaScript text inside the bridge's strings or comments. Valid Liquid expressions
are expected, but a delimiter used as a test string is parsed as Liquid and can
produce a site-wide HTTP 500. Construct the test marker safely at runtime:

```javascript
var LIQUID_OPEN = String.fromCharCode(123, 123);
var isRawRoute = contextValue.indexOf(LIQUID_OPEN) >= 0;
```

### 8.5 Default platform chrome around a code site

The blank code-site template can still render `.masthead`, `.header-navbar`,
`#offlineNotificationBar`, and the platform footer around the SPA. If the SPA
owns navigation and page chrome, hide those elements in the injected bridge CSS
and remove the wrapper padding/max-width from `#mainContent.wrapper-body`,
`.page-copy`, `.xrm-editable-html`, and `.xrm-attribute-value`. Test both `/` and
a directly loaded client route because they can take different rendering paths.

The following CSS is the exact selector set that removed the top gap and corner
artifacts in the partner portal:

```html
<style>
  .masthead,
  .header-navbar,
  #offlineNotificationBar,
  .wrapper-footer,
  footer.footer,
  div[role="banner"].masthead {
    display: none !important;
  }

  #mainContent.wrapper-body,
  #mainContent .page-copy,
  #mainContent .xrm-editable-html,
  #mainContent .xrm-attribute-value {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: 100% !important;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
</style>
```

---

## 9. React SPA Architecture

### 9.1 Project structure

```
src/
  main.tsx               ← React entry, Router setup
  App.tsx                ← Layout: Header + <Outlet> + Footer
  context/
    PortalDataContext.tsx ← identity, records, loading/error, CRUD orchestration
  services/
    dataverse.ts         ← token acquisition and GET/POST/PATCH/DELETE helpers
    accountDocuments.ts  ← Server Logic client + chunked SharePoint transport
  pages/
    Home.tsx
    MyDashboard.tsx      ← reads identity and records from PortalDataContext
    VehicleRegistration.tsx
    LicenseRenewal.tsx
    Appointments.tsx
    Documents.tsx
    ...
  components/
    AccountDocuments.tsx ← list/upload/download/delete document UI
    ProtectedRoute.tsx   ← redirects to /SignIn if !isAuthenticated
    ChatWidget.tsx       ← Omnichannel / Copilot Studio chat embed
.powerpages-site/
  server-logic/
    account-documents/   ← account-derived authorization + Microsoft Graph calls
```

### 9.2 Runtime context and authentication

```typescript
export interface PortalRuntimeContext {
  contact: { id: string; fullName: string; email: string }
  account: { id: string; name: string; currencyId: string }
}

declare global {
  interface Window {
    __POWER_PAGES_SITE__?: boolean
    __PORTAL_CONTEXT__?: PortalRuntimeContext | null
  }
}

// Inside the provider used by all routes:
const runtimeContext = window.__PORTAL_CONTEXT__
const isDemo = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const isAuthenticated = isDemo || Boolean(runtimeContext)
const identity = runtimeContext ?? (isDemo ? demoIdentity : emptyIdentity)
```

The working portal enables demo identity/data only on `localhost` and
`127.0.0.1`. Never fall back to a demo identity on a deployed hostname; doing so
would make an unauthenticated UI look authenticated.

### 9.3 Dataverse Web API helpers

```typescript
// src/services/dataverse.ts
const formattedValueSuffix = '@OData.Community.Display.V1.FormattedValue'

async function getAntiforgeryToken(): Promise<string> {
  const existingToken = document.querySelector<HTMLInputElement>(
    '[name="__RequestVerificationToken"]',
  )?.value

  if (existingToken) return existingToken

  const response = await fetch('/_layout/tokenhtml', { credentials: 'same-origin' })
  if (!response.ok) throw new Error('Unable to acquire the Power Pages security token.')

  const markup = await response.text()
  const tokenDocument = new DOMParser().parseFromString(markup, 'text/html')
  const token = tokenDocument.querySelector<HTMLInputElement>(
    '[name="__RequestVerificationToken"]',
  )?.value

  if (!token) throw new Error('The Power Pages security token was not returned.')
  return token
}

function dataHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
  }
}

async function writeHeaders(): Promise<HeadersInit> {
  return {
    ...dataHeaders(),
    'Content-Type': 'application/json',
    __RequestVerificationToken: await getAntiforgeryToken(),
  }
}

export async function dvQuery<T>(
  entitySet: string,
  query: URLSearchParams,
): Promise<T[]> {
  const response = await fetch(`/_api/${entitySet}?${query}`, {
    headers: dataHeaders(),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`GET ${entitySet} failed (${response.status}): ${await response.text()}`)
  }

  const body = (await response.json()) as { value: T[] }
  return body.value
}

export async function dvCreate(
  entitySet: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const response = await fetch(`/_api/${entitySet}`, {
    method: 'POST',
    headers: await writeHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`POST ${entitySet} failed: ${await response.text()}`)
  }

  const entityReference = response.headers.get('OData-EntityId') ?? ''
  return entityReference.match(/\(([^)]+)\)$/)?.[1] ?? ''
}

export async function dvUpdate(
  entitySet: string,
  recordId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`/_api/${entitySet}(${recordId})`, {
    method: 'PATCH',
    headers: await writeHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`PATCH ${entitySet} failed: ${await response.text()}`)
  }
}

export async function dvDelete(entitySet: string, recordId: string): Promise<void> {
  const response = await fetch(`/_api/${entitySet}(${recordId})`, {
    method: 'DELETE',
    headers: await writeHeaders(),
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`DELETE ${entitySet} failed: ${await response.text()}`)
  }
}

export function formattedValue(
  record: Record<string, unknown>,
  fieldName: string,
): unknown {
  return record[`${fieldName}${formattedValueSuffix}`] ?? record[fieldName]
}
```

> ⚠ **GCC environments:** the `/_layout/tokenhtml` endpoint exists but the
> `{% layout_token_html %}` Liquid tag does NOT exist in GCC. Fetch the token via
> the endpoint and inject it with JS, or use the fetch approach in the header
> bridge shown in §8.4.

### 9.4 OData bind syntax for lookups on create/update

```typescript
// Associate a vehicle registration with a contact on create:
await dvCreate("<prefix>_vehicleregistrations", {
  "<prefix>_vehicleid@odata.bind": "/<prefix>_vehicles(<vehicleId>)",
  "<prefix>_regcontactid@odata.bind": "/contacts(<contactId>)",
  "<prefix>_regstatus": 100000002,   // Pending Payment
});
```

`<prefix>_registrationid` is intentionally absent because it is AutoNumber. The
working partner portal also injects account/contact lookup binds in its service
layer rather than accepting those ownership fields from form input.

### 9.5 Vite config for Power Pages

```typescript
// vite.config.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function portalContextBridge(): Plugin {
  const bridgePath = resolve(
    __dirname,
    '.powerpages-site/web-templates/header/Header.webtemplate.source.html',
  )

  return {
    name: 'portal-context-bridge',
    transformIndexHtml(html) {
      if (html.includes('portal-runtime-context')) return html
      const bridge = readFileSync(bridgePath, 'utf8')
      return html.replace(/<body[^>]*>/, (match) => `${match}\n${bridge}\n`)
    },
  }
}

export default defineConfig({
  plugins: [react(), portalContextBridge()],
  build: {
    outDir: 'dist',
  },
})
```

This is the plugin running in the partner portal. It guarantees that the one
bridge source is copied into `dist/index.html` before `upload-code-site` writes
that file to `mspp_copy`.

Two asset strategies have been proven in our builds:

- **Full code-site upload:** default Vite hashed filenames work because the same
  upload updates `dist/index.html` and its matching assets together.
- **Direct `filecontent` overwrite:** pin the already-deployed JS/CSS filenames
  and overwrite those exact component records. This was required for rapid DMV
  updates where changing filenames would leave stale page references.

Do not combine the strategies. In particular, do not force fixed filenames for
a normal full upload merely because another site used direct component patches.

### 9.6 SharePoint documents in an SPA code site

#### Why the native form/subgrid approach is the wrong boundary

Power Pages SPA code sites do not support the traditional out-of-box forms,
lists, or Liquid page components used by native SharePoint document management.
Do not iframe a classic basic form into a code site and try to repair its legacy
jQuery dependencies. Even if the grid can be made to render, it remains an
unsupported and fragile composition.

Also do not call `/_services/sharepoint-data.json`. That is an internal endpoint
owned by the legacy document component, not a supported API contract for custom
React code.

The proven code-site architecture is:

```text
React SPA
  ├─ CSRF-protected calls to /_api/serverlogics/account-documents
  └─ direct chunk PUTs to a short-lived Graph upload URL

Power Pages Server Logic
  ├─ derives the permitted contact/account from Server.User
  ├─ reads the existing Dataverse SharePoint document location
  ├─ holds the Graph app credential
  ├─ resolves the exact SharePoint site, entity library, and record folder
  └─ lists, authorizes, verifies, and deletes drive items through Graph

Microsoft Graph
  └─ reaches the same library/folder used by the model-driven app
```

This preserves one document store: staff and portal users see the same files.
Power Automate can perform asynchronous follow-up such as notifications or
document processing, but it should not transport file bytes.

Relevant first-party references:

- [Code-site differences](https://learn.microsoft.com/power-pages/configure/create-code-sites#differences-from-existing-power-pages-sites)
- [Server Logic with Graph and SharePoint](https://learn.microsoft.com/power-pages/configure/server-logic-graph-sharepoint)
- [Graph upload sessions](https://learn.microsoft.com/graph/api/driveitem-createuploadsession)
- [SharePoint selected-site permissions](https://learn.microsoft.com/sharepoint/dev/sp-add-ins-modernize/understanding-rsc-for-msgraph-and-sharepoint-online)

#### Prerequisites and trust boundaries

Before building React controls, confirm:

1. Dataverse server-based SharePoint integration is configured.
2. Document management is enabled for the target Dataverse table.
3. A real record has one active `sharepointdocumentlocation` that already works
  in the model-driven app.
4. The code site already has Server Logic support and a deployed
  `.powerpages-site/server-logic/` folder.
5. The portal user maps to a Dataverse contact with a server-verifiable account
  or membership relationship.

The browser is never the authorization boundary. Do not trust an account GUID,
drive ID, folder path, item ID, or SharePoint URL merely because React supplied
it. Derive authorization in Server Logic for every operation.

For a single-partner-per-contact model:

1. Read a stable contact ID from `Server.User` (`contactid` was the verified
  property in one code-site runtime).
2. Retrieve that contact through `Server.Connector.Dataverse` and read
  `_parentcustomerid_value`.
3. Use that server-derived account ID to query the active document location.

Do not assume `Server.User.parentcustomerid` is present; verify the object in the
target runtime. If users can access multiple partners, create a membership table
with Contact, Account, and access level, then select and enforce membership
server-side.

`Server.Connector.Dataverse` respects Power Pages table permissions. A practical
minimum is:

- Self-scoped read permission on `contact` so the endpoint can resolve the
  signed-in contact's parent account.
- Account-scoped read permission on `sharepointdocumentlocation` through the
  validated account-to-document-location relationship.

Avoid creating an account-table permission just to discover the user's account.
The signed-in contact relationship is the safer ownership source, and account
scope on the `account` table itself may not have a valid relationship for every
employee.

#### Resolve the existing MDA location; never reconstruct it

Dataverse document locations form a chain:

```text
SharePoint site
  └─ entity document library (for example, the account table library)
     └─ record folder (sharepointdocumentlocation.relativeurl)
```

The active record location's `relativeurl` is the folder name. Its parent
location identifies the entity library. Resolve that parent during provisioning
and either read it at runtime with a narrow permission or store its verified URL
segment as non-secret configuration.

Do not construct a folder from the record name or GUID. Read the exact active
location from Dataverse. Do not assume Graph's default `/drive` is the correct
library: Dynamics document management commonly creates one library per enabled
entity. Query `/sites/{siteId}/drives`, then match the verified parent library
against the drive's final `webUrl` segment (or a separately verified drive name).

The listing call then becomes:

```text
GET /drives/{resolvedDriveId}/root:/{encodedRecordFolder}:/children
```

Select only the fields React needs: `id`, `name`, `size`,
`lastModifiedDateTime`, `file`, and `folder`.

#### Entra application and least-privilege site grant

Use a single-tenant Entra application with Microsoft Graph **application**
permission `Sites.Selected`. Do not add `Sites.ReadWrite.All` to simplify setup.

`Sites.Selected` has two independent gates:

1. A tenant administrator grants admin consent to the application's
  `Sites.Selected` permission.
2. A SharePoint/Global administrator grants the app `write` access to the one
  target site:

```http
POST https://graph.microsoft.com/v1.0/sites/{site-id}/permissions
Content-Type: application/json

{
  "roles": ["write"],
  "grantedToIdentities": [
   {
    "application": {
      "id": "<portal-graph-client-id>",
      "displayName": "<portal-graph-app-name>"
    }
   }
  ]
}
```

The portal application has access to zero sites until both gates are complete.
Use Graph Explorer, PnP PowerShell, or a controlled deployment identity to make
the site grant. Any temporary broad grantor permission must be removed
immediately afterward; the portal app itself should still request only
`Sites.Selected`.

Verification must use a fresh **app-only** token:

- Its `roles` claim contains `Sites.Selected` and no broad site role.
- It can read the selected site and its drives.
- It cannot read an unrelated site.

#### Secrets and non-secret configuration

Store only non-secret coordinates in ordinary site settings, for example:

```text
SharePoint/ClientId
SharePoint/TenantId
SharePoint/Hostname
SharePoint/SitePath
SharePoint/EntityLibraryPath
```

Store the client secret in Azure Key Vault through an environment variable when
available. If the target tenant has no Azure subscription, a Dataverse
environment variable is a workable fallback; keep it out of source control and
read it with `Server.EnvironmentVariable.get("<publisher>_SharePointClientSecret")`.
Never place a real secret in `.powerpages-site/site-settings/`, logs, chat, or a
client bundle. Record the credential expiry and rotate it before expiration.

Restrict Server Logic outbound networking:

```text
ServerLogic/AllowedDomains = login.microsoftonline.com,graph.microsoft.com
ServerLogic/AllowNetworkingToAllDomains = false
```

The preauthenticated upload/download URLs are also secrets. Do not log, persist,
or return them anywhere except the authenticated browser response that needs
them.

#### Server Logic metadata and client envelope

The deployed Server Logic metadata uses these field names:

```yaml
adx_serverlogic_adx_webrole:
- <authenticated-users-web-role-id>
description: Manages documents for the signed-in user's authorized record.
display_name: Account Documents
id: <new-server-logic-guid>
name: account-documents
```

Legacy-looking keys such as `webroles` and `displayname` can be silently ignored,
causing HTTP 403 `User does not have permissions to invoke Server Logic` even
though the endpoint record exists.

Every Server Logic call, including GET, needs the portal CSRF token. Fetch it
from `/_layout/tokenhtml` as shown in §9.3. The runtime wraps a handler's returned
string in an envelope. Client code should accept the observed casing variants:

```typescript
const success = envelope.success ?? envelope.Success
const data = envelope.data ?? envelope.Data
const error = envelope.error ?? envelope.Error
const payload = typeof data === 'string' ? JSON.parse(data) : data
```

Server Logic supports only the fixed top-level HTTP functions (`get`, `post`,
`put`, `patch`, `del`). Keep any helper functions nested inside those handlers
or otherwise validate the file against current Server Logic authoring rules.

#### Binary upload pattern

Server Logic `HttpClient` cannot send `application/octet-stream`; the official
sample therefore sends only small text files through Server Logic. For native
PDF, Office, and image uploads, use a Graph upload session:

1. React sends `{ action, fileName, size, contentType }` to Server Logic.
2. Server Logic validates authentication, membership, filename, extension,
  MIME type, requested size, site, library, and folder.
3. Server Logic calls `createUploadSession` and returns only the short-lived
  `uploadUrl`, expiry, and chunk policy.
4. React uploads sequential chunks directly to that URL.
5. React sends the completed Graph item ID and expected size back to Server
  Logic for verification.
6. Server Logic retrieves the item and requires an exact authorized parent path
  and exact size before reporting success or writing audit metadata.

Graph upload rules:

- Upload chunks sequentially.
- Each non-final chunk must be a multiple of 320 KiB.
- Each request must be smaller than 60 MiB.
- A 5 MiB chunk is valid (`16 × 320 KiB`).
- Send `Content-Range: bytes <start>-<end>/<total>`.
- Do **not** send an `Authorization` header to the preauthenticated upload URL.

Representative browser loop:

```typescript
let offset = 0
while (offset < file.size) {
  const end = Math.min(offset + 5 * 1024 * 1024, file.size)
  const response = await fetch(uploadUrl, {
   method: 'PUT',
   headers: {
    'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`,
    'Content-Type': 'application/octet-stream',
   },
   body: file.slice(offset, end),
  })

  // 202 = more chunks; 200/201 = completed driveItem
  offset = end
}
```

Validate file policy on both sides. Client validation is UX only. Server Logic
must independently reject illegal SharePoint filename characters, path
segments, `..`, mismatched MIME/extension, empty files, and files above the
application's chosen limit. An application limit such as 50 MB is a product
policy, not the Graph service maximum.

Before building the full UI, run one disposable PDF spike from the deployed
portal origin. Confirm session creation, browser PUT, HTTP 200/201 completion,
exact parent folder, and cleanup. If the upload host fails CORS or CSP in the
target tenant, keep the Server Logic authorization contract but move byte
transport to an Azure Function.

#### IDOR protection for list, download, preview, and delete

A Graph item ID is opaque, not secret. For every item-specific operation:

1. Resolve the permitted drive and record folder from the signed-in user.
2. Retrieve `/drives/{driveId}/items/{itemId}`.
3. Require `item.file` and an exact `parentReference.path` match such as:

```text
/drives/{driveId}/root:/{authorizedRecordFolder}
```

4. Only then return a download URL or call Graph DELETE.

Do not use a naive prefix test; sibling folder names can share prefixes. If the
product later supports nested folders, compare normalized path segments and
require the authorized folder as a complete ancestor.

#### Reliable download and inline preview

Graph item metadata can return a short-lived `@microsoft.graph.downloadUrl`.
After the server-side IDOR check, return that URL to the browser.

For a reliable **download with the intended filename**, fetch the URL, create a
Blob, and click an object URL:

```typescript
const response = await fetch(downloadUrl)
const blob = await response.blob()
const objectUrl = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = objectUrl
link.download = item.name
link.click()
URL.revokeObjectURL(objectUrl)
```

For **inline PDF/image preview**, do not navigate directly to SharePoint's
preauthenticated URL. Its response can carry attachment behavior and launch a
download or an external desktop viewer. Instead:

1. Open a blank tab synchronously inside the click handler (before any `await`)
  so the popup blocker allows it.
2. Get the server-authorized short-lived URL.
3. Fetch the bytes.
4. Recreate the Blob with the known inline MIME type (`application/pdf` or the
  image MIME type).
5. Navigate the blank tab to the Blob URL.

```typescript
const previewWindow = window.open('', '_blank')
if (!previewWindow) throw new Error('Allow pop-ups to preview this document.')

const response = await fetch(downloadUrl)
const sourceBlob = await response.blob()
const previewBlob = new Blob([sourceBlob], { type: item.mimeType })
const objectUrl = URL.createObjectURL(previewBlob)
previewWindow.location.replace(objectUrl)
```

Do not set `previewWindow.opener = null` before the asynchronous fetch finishes;
the opener then loses permission to navigate the blank tab. PDF and image
preview can be clickable. Keep Office files on the normal download path unless
the project deliberately implements Office web viewing and its additional
identity/SharePoint permission model.

#### Recommended implementation order

1. Build GET list only against an existing MDA document location.
2. Validate the signed-in user, same-account membership, and unrelated-user
  denial.
3. Configure `Sites.Selected`, consent, and the one-site `write` grant.
4. Run the tiny PDF upload-session CORS/CSP spike and delete it.
5. Add upload progress and post-upload parent/size verification.
6. Add IDOR-protected download, inline PDF/image preview, and delete.
7. Test retries, invalid names/types/sizes, foreign item IDs, and credential
  rotation.
8. Remove dormant classic form/jQuery workarounds only after the React path is
  proven end to end. Keep the model-driven forms and Dataverse document
  locations because they remain part of the shared document architecture.

---

## 10. Build & Deploy

### 10.1 Full deploy sequence

```powershell
# 1. Build the React SPA
npm run build

# 2. Confirm the bridge was baked into the compiled document
Select-String -Path ".\dist\index.html" -Pattern "portal-runtime-context"

# 3. Select and verify the target in this same PowerShell process
pac auth select --name <profile-name>
pac org who

# 4. Upload the compiled document, assets, and local site scaffold
pac pages upload-code-site `
  --rootPath "<workspace-root>" `
  --compiledPath "dist" `
  --siteName "<exact-site-name>"
```

Create the PAC profile once with `pac auth create --environment <environment-id>`.
Do not recreate authentication on every deploy. If `pac org who` is not the
intended environment, stop before upload. If profile selection continues to
drift, isolate the PAC auth store and authenticate only the target environment
for that upload; this was the recovery that worked in the partner build.

### 10.2 What `pac pages upload-code-site` does and does NOT do

- **Does:** uploads assets from `dist/` as `powerpagecomponent` file records and
  writes `dist/index.html` to the Home content page's `mspp_copy`.
- **Does NOT:** update existing `mspp_webtemplate` records that were created
  outside the code site scaffold. If your header template was created manually
  or predates the project, patch it via REST API (§8.3).

For the partner code site, the runtime bridge is already in `dist/index.html`.
Do not add a second Header deployment step unless browser/runtime verification
shows that the target site actually consumes the Header binding.

When PAC has multiple auth profiles, verify the selected organization in the same
PowerShell process immediately before upload. `upload-code-site` can drift to a
different profile if auth state is stale; `pac org who` must show the target
environment before any write.

Re-query the intended environment after upload. A profile drift can create a new
inactive draft site in the wrong environment rather than overwriting the target;
do not retry or delete anything until both environments and site IDs are verified.

### 10.3 Token acquisition for deploy scripts

```powershell
$envUrl = "https://<your-org>.crm<N>.dynamics.com"
$token  = az account get-access-token --resource $envUrl --query accessToken -o tsv
$headers = @{
    Authorization      = "Bearer $token"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
    "Content-Type"     = "application/json; charset=utf-8"
    Accept             = "application/json"
}
```

Tokens expire in ~60 minutes. Re-acquire if scripts run long.

### 10.4 JavaScript blocked by Dataverse attachment settings

`upload-code-site` can fail when `js` is present in the Dataverse
`blockedattachments` setting. Remove only the `js` entry and preserve every
other blocked extension; do not clear or replace the full security list. Verify
the resulting setting before uploading. After any manual `mspp_copy` PATCH, call
`PublishAllXml`, allow for CDN delay, and hard-refresh.

### 10.5 Proven direct `filecontent` overwrite path

Use this only when an existing site already references fixed JS/CSS web-file
names and you are intentionally updating those same component records. This is
the rapid-deploy path proven in the DMV portal:

```powershell
$envUrl = "https://<your-org>.crm<N>.dynamics.com"
$solutionName = "<solution-unique-name>"
$jsComponentId = "<existing-js-powerpagecomponent-id>"
$cssComponentId = "<existing-css-powerpagecomponent-id>"
$jsFileName = "<existing-fixed-name>.js"
$cssFileName = "<existing-fixed-name>.css"

$token = az account get-access-token --resource $envUrl --query accessToken -o tsv
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/octet-stream"
  "OData-MaxVersion" = "4.0"
  "OData-Version" = "4.0"
  "If-Match" = "*"
  "MSCRM.SolutionUniqueName" = $solutionName
}

$headers["x-ms-file-name"] = $jsFileName
$bytes = [System.IO.File]::ReadAllBytes("dist/assets/$jsFileName")
Invoke-WebRequest `
  -Uri "$envUrl/api/data/v9.2/powerpagecomponents($jsComponentId)/filecontent" `
  -Method Patch -Headers $headers -Body $bytes -UseBasicParsing

$headers["x-ms-file-name"] = $cssFileName
$bytes = [System.IO.File]::ReadAllBytes("dist/assets/$cssFileName")
Invoke-WebRequest `
  -Uri "$envUrl/api/data/v9.2/powerpagecomponents($cssComponentId)/filecontent" `
  -Method Patch -Headers $headers -Body $bytes -UseBasicParsing
```

Do not create replacement web files, rename the bundles, or bulk-rewrite page
references to bypass cache. The proven post-deploy action is to wait for the CDN
and hard-refresh. Verify asset behavior in an authenticated browser; an
unauthenticated request can return the login page with HTTP 200.

---

## 11. Model-Driven App for Back-Office

Create a model-driven app so staff can view and manage records without touching
the portal.

### 11.1 Minimum setup

```
make.powerapps.com → Apps → New App → Model-driven
  Name:  <YourApp> Admin
  Solution: <select yours>
```

Add a **sitemap** with groups for each domain area:
- Citizens (contact, driver license, document upload)
- Vehicles (vehicle, registration, term, payment)
- Appointments (appointment, office)
- Operations (transaction log, notification)

### 11.2 Create forms and views via script

The Dataverse API accepts `systemform` and `savedquery` records as XML strings.
That was used in the earlier DMV build, but its scripts are not part of this
guide and are not required for portal runtime. Do not invent form/view XML from
this sentence. Build the back-office app in the maker UI or transfer the tested
forms/views in the Dataverse solution supplied with the project.

---

## 12. Power Automate Flows

### 12.1 Flows to build (minimum)

| Flow | Trigger | Action |
|---|---|---|
| **Renewal Approved Email** | When `<p>_licenserenewal.status` changes to Approved | Send email with confirmation number and new expiration date |
| **Registration Renewal Approved** | When `<p>_registrationrenewal.status` changes to Approved | Create new term + payment; update parent registration; send email |
| **Appointment Confirmation** | When `<p>_appointment` is created | Send confirmation email with date/time/office details |
| **Appointment Reminder** | Scheduled — 24 hours before `<p>_appointmentdate` | Send reminder email |
| **Appointment Cancellation** | When `<p>_appointment.status` changes to Cancelled | Send cancellation email |
| **Stamp Expiration Date** | When `<p>_vehicleregistration.currenttermid` changes | Copy term end date to `<p>_expirationdate` on parent registration |

### 12.2 Denormalization flow (critical)

The portal reads `<p>_expirationdate` on the registration record (not the term)
because term table permissions can be unreliable on newly provisioned tables.
Build a **Dataverse trigger flow** that fires when `<p>_registrationterm` is
updated to Active, and stamps the end date onto the parent registration:

```
Trigger: When a row is added, modified, or deleted
  Table:    <p>_registrationterm
  Change type: Modified
  Select columns: <p>_termstatus

Condition: <p>_termstatus equals 100000000 (Active)

Action: Update a row
  Table:   <p>_vehicleregistration
  Row ID:  <p>_vehicleregistrationid from trigger
  <p>_expirationdate: <p>_enddate from trigger
```

---

## 13. Copilot Studio Agent Integration

### 13.1 Chat widget in the SPA

The following is the earlier DMV build's proven Omnichannel integration. It uses
that build's `__PORTAL_USER__` and `__APP_DATA__` globals. A portal using the
partner bridge must map the same values from `__PORTAL_CONTEXT__`; do not expose
both global contracts in one build.

```typescript
// src/components/ChatWidget.tsx
declare global { interface Window { Microsoft: any; } }

useEffect(() => {
  const user = window.__PORTAL_USER__;
  const data = window.__APP_DATA__;

  const lcwConfig = {
    // ...your bot endpoint and app ID from Omnichannel admin
    customContext: {
      ContactName:     { value: user?.name ?? "not signed in", isDisplayable: true },
      PortalContactId: { value: user?.id   ?? "not signed in", isDisplayable: false },
      Email:           { value: data?.citizen?.email ?? "not signed in", isDisplayable: true },
    },
  };

  window.Microsoft?.Omnichannel?.renderWidget?.(lcwConfig);
}, []);
```

### 13.2 Global variables in the bot

For each key in `customContext`, create a Global Variable in Copilot Studio:

```yaml
- kind: GlobalVariable
  variableName: ContactName
  variableType: String
  scope: User
  isExternalInitializationAllowed: true
  aIVisibility: UseInAIContext
  isOutputToExternalCallers: true
```

### 13.3 Identity gate pattern (every "do something" topic must start with this)

```yaml
- kind: ConditionGroup
  id: cg_signedIn
  conditions:
    - id: ci_notSignedIn
      condition: =IsBlank(Global.PortalContactId) || Lower(Global.PortalContactId) = "not signed in"
      actions:
        - kind: SendActivity
          activity: To do that I'll need you to be signed in. Please sign in at the portal and try again.
        - kind: EndDialog
```

### 13.4 Dataverse writes from the bot

Prefer **Power Automate cloud flows** called via `InvokeFlowAction` over inline
`InvokeConnectorAction` Dataverse cards. The inline Dataverse connector card
for `CreateRecord` does not reliably hydrate in the Copilot Studio designer and
produces an endless spinner. A flow triggered by Copilot renders correctly and
gives you full Power Fx control over the payload.

---

## 14. Demo Data Seeding

### 14.1 Create a demo contact

```powershell
$contact = @{
  firstname  = "<demo-first-name>"
  lastname   = "<demo-last-name>"
  emailaddress1 = "<demo-email-address>"
  telephone1 = "<demo-phone-number>"
  address1_line1 = "<demo-address-line-1>"
  address1_city  = "<demo-city>"
  address1_stateorprovince = "<demo-state-or-province>"
  address1_postalcode = "<demo-postal-code>"
} | ConvertTo-Json
$c = Invoke-RestMethod "$envUrl/api/data/v9.2/contacts" `
  -Method POST -Headers ($headers + @{ Prefer = "return=representation" }) -Body $contact
$contactId = $c.contactid
```

### 14.2 Seed vehicle + registration in correct order

```powershell
# Vehicle
$v = @{
    "<p>_vin"   = "5YJSA1E26MF123456"
    "<p>_year"  = "2024"        # String — NOT integer
    "<p>_make"  = "Tesla"
    "<p>_model" = "Model S"
    "<p>_color" = "Midnight Silver"
    "<p>_platenumber" = "XYZ-5678"
    "<p>_ownercontactid@odata.bind" = "/contacts($contactId)"
} | ConvertTo-Json
$veh = Invoke-RestMethod "$envUrl/api/data/v9.2/<p>_vehicles" `
  -Method POST -Headers ($headers + @{ Prefer = "return=representation" }) -Body $v
$vehicleId = $veh.<p>_vehicleid

# Registration (Expired, to demo renewal)
$reg = @{
    "<p>_registrationid" = "REG-2025-00001"
    "<p>_vehicleid@odata.bind" = "/<p>_vehicles($vehicleId)"
    "<p>_regcontactid@odata.bind" = "/contacts($contactId)"
    "<p>_regstatus" = 100000001        # Expired
    "<p>_expirationdate" = "2026-06-10T00:00:00Z"
} | ConvertTo-Json
$r = Invoke-RestMethod "$envUrl/api/data/v9.2/<p>_vehicleregistrations" `
  -Method POST -Headers ($headers + @{ Prefer = "return=representation" }) -Body $reg
$regId = $r.<p>_vehicleregistrationid

# Term
$term = @{
    "<p>_termnumber" = "TERM-2025-00001"
    "<p>_vehicleregistrationid@odata.bind" = "/<p>_vehicleregistrations($regId)"
    "<p>_termtype"   = 100000000   # New
    "<p>_termstatus" = 100000002   # Expired
    "<p>_startdate"  = "2025-06-10T00:00:00Z"
    "<p>_enddate"    = "2026-06-10T00:00:00Z"
} | ConvertTo-Json
$t = Invoke-RestMethod "$envUrl/api/data/v9.2/<p>_registrationterms" `
  -Method POST -Headers ($headers + @{ Prefer = "return=representation" }) -Body $term
$termId = $t.<p>_registrationtermid

# Link currentterm back to registration
$patch = @{
    "<p>_currenttermid@odata.bind" = "/<p>_registrationterms($termId)"
} | ConvertTo-Json
Invoke-RestMethod "$envUrl/api/data/v9.2/<p>_vehicleregistrations($regId)" `
  -Method PATCH -Headers $headers -Body $patch
```

---

## 15. Known Gotchas & Hard-Won Lessons

### 1. Liquid bracket notation crashes the entire `<script>` block

`{{ r['alias.field'] }}` — bracket notation in Liquid for link-entity alias
fields **silently kills the entire `<script>` tag**. Both `window.__PORTAL_USER__`
and `window.__APP_DATA__` become `undefined`. The page loads but authentication
appears broken. Use dot notation only: `{{ r.alias_fieldname }}`.

### 2. New table permissions may silently fail (403 + 0 Liquid results)

Permissions on *newly created* tables (`<5 minutes old`) sometimes do not
propagate to the portal permission cache even when the `powerpagecomponent`
record and M:N web-role association are both correct. Symptoms:
- `/_api/<prefix>_registrationterms(...)` returns **403**
- FetchXML against the same table in Liquid returns **0 results**

Workarounds:
- Wait 10-15 minutes and retry (often self-resolves).
- Call `PublishAllXml` after creating or patching table permissions and before
  runtime testing.
- Denormalize critical read-path data onto a table with confirmed working
  permissions (see §3.3 — `<p>_expirationdate` on the registration parent).
- Never architect a page that *requires* a newly-created table in the same
  session — stage table creation separately from portal testing.
- Do not create broad permissions on standard tables such as `account` unless the
  relationship is verified in the target site. In this build, an account-table
  permission using `contact_customer_accounts` caused anonymous page rendering
  to return HTTP 500 until the permission was removed and republished. Do not
  reuse a relationship name without validating it against target metadata.

### 3. DateTime columns require `T00:00:00Z` suffix

When creating Dataverse records via the Web API, date-only fields must include
the time component: `"2026-06-10T00:00:00Z"`. Sending `"2026-06-10"` alone
produces a 400 error or silently stores as `null`.

### 4. Vehicle year must be String, not Integer

Dataverse renders whole-number columns with locale-specific grouping separators.
`2024` becomes `"2,024"` in the UI and in Liquid output. Declare `<p>_year` as
`String` (Single Line of Text) from the start.

### 5. `$PID` is a reserved PowerShell variable

Do not use `$PID` as a variable name in any PowerShell script. It shadows the
built-in `$PID` (current process ID) and causes unpredictable behavior.

### 6. AutoNumber columns — do not send a value on create

If a column uses Dataverse AutoNumber, **omit the field entirely** in the POST
body. Sending any value (even `""`) overrides the sequence and may cause
duplicate-key errors. After creating the record, re-fetch by GUID to get the
generated number for display.

### 7. Option sets in Liquid return integers, not objects

`{{ r.<p>_regstatus }}` → `100000000` (integer)  
Avoid `{{ r.<p>_regstatus.Label }}` in script data; map the integer to a label
inside React instead.  
`{{ r.<p>_regstatus.Value }}` → `nil` — **this crashes silently**

### 8. Power Pages CDN cache delay after deploys

After uploading new SPA bundles via `pac pages upload-code-site`, the portal CDN
may serve stale files for 5-15 minutes. To test immediately: clear portal
cookies, open a private/incognito window, and hard-refresh.

With hashed bundles, the root page can briefly reference an old hash after PAC
has removed that asset, producing temporary 404/500 responses. Confirm that
Dataverse contains the new components and that `dist/index.html` references the
same hashes. Use normal refresh and propagation for routine changes. Restart the
site only when immediate cache invalidation is necessary or the root remains
stale beyond the expected window; restart causes a short 503 outage and should
not be the default after every edit.

For deployed SPAs, prefer overwriting the existing JS/CSS `filecontent` records
with the same filenames. Do not bulk-edit page HTML references, create throwaway
web files to bypass cache, or diagnose asset responses from unauthenticated
PowerShell; the portal may return the login page with HTTP 200 and make a broken
asset look valid.

### 9. Antiforgery token in GCC

The `{% portal_anti_forgery_token %}` Liquid tag does not exist in GCC
environments. Fetch the token by loading `/_layout/tokenhtml` and injecting it
into the DOM via a `<script>` fetch, then read it with
`document.querySelector('[name="__RequestVerificationToken"]').value`.

### 10. Login loop after rapid deploys

Deploying a new SPA bundle invalidates the portal session state. Signed-in
users may enter a redirect loop to `/SignIn`. Fix: clear portal cookies.
Avoid multiple rapid deploys during a live demo.

### 11. Inline Dataverse `CreateRecord` in Copilot Studio does not hydrate reliably

The `InvokeConnectorAction` node for Dataverse `CreateRecord` in the Copilot
Studio YAML designer shows an endless spinner and does not save correctly, even
with `dynamicInputSchema`, `dynamicOutputSchema`, and `connectionProperties.name`
all populated. Use `InvokeFlowAction` against a Power Automate cloud flow
instead. In our build, the flow path rendered and saved correctly while the
inline connector path did not.

### 12. Web role assignment must be embedded in permission content

Enhanced-model sites read `adx_entitypermission_webrole` from the permission's
content JSON. Create the M:N association for compatibility, but do not treat its
HTTP 204 response as proof that the role assignment persisted or that the portal
will use it. Write the content array in the same operation, publish, and validate
the stored content before runtime testing.

### 13. Enhanced-model web templates often update through `powerpagecomponents`

If PATCHing `mspp_webtemplates` fails with `0x80040224` or `0x80040333`, locate
the same-ID `powerpagecomponent` with `mspp_type = 8` and PATCH its `content`
JSON. Use `{ source, websiteid }` as the inner content payload, then call
`PublishAllXml`.

### 14. Keep Liquid script data boring and quoted

Liquid failures can remove an entire `<script>` block with no visible error. For
runtime data, quote string values, use `default: ''`, map option-set labels in
React instead of reading `.Label` in Liquid, and render booleans explicitly as
lowercase `true`/`false`.

### 15. PAC profile drift can deploy to the wrong environment

Before any destructive or write deployment, run `pac auth select --name <profile>`
and `pac org who` in the same terminal process. If PAC keeps selecting the wrong
tenant/environment, isolate the PAC auth store for that upload rather than
retrying blindly.

### 16. Direct code-site routes may receive raw Liquid

Do not assume every SPA route is Liquid-processed. Bootstrap context on `/`,
cache it for the browser session, and recover or redirect raw deep links before
React starts. Validate a pasted/deep-linked URL in a fresh browser session, not
only navigation that starts on Home.

### 17. Literal Liquid delimiters in JavaScript can 500 the page

Do not write an unmatched Liquid delimiter as JavaScript text or in bridge
comments, including code intended to detect unprocessed Liquid. Valid Liquid
expressions are fine; build the detection marker with
`String.fromCharCode(123, 123)` instead.

### 18. The code-site page-copy field is `mspp_copy`

For enhanced-model content pages, read and patch `mspp_copy`. Requests selecting
`adx_copy` can return HTTP 400. Publish after a manual page-copy update.

### 19. HTTP 200 does not prove site visibility changed

After a visibility API call, query the site state again. Governance policy can
leave a Trial site private even when the update call succeeds; tenant-level
Power Pages governance must be resolved before local-login testing is meaningful.

### 20. `blockedattachments` changes must be surgical

If JavaScript upload is blocked, remove only `js` from the existing Dataverse
blocked-extension list. Preserve all other entries and verify the post-change
value before running the upload.

### 21. Code-site SharePoint documents need React + Server Logic + Graph

Native form/subgrid document management is not a supported SPA code-site
component. Do not solve it with a legacy iframe or internal
`/_services/sharepoint-data.json` calls. Use the architecture in §9.6.

### 22. The default Graph drive may not be the MDA document library

Dynamics document management can create a separate SharePoint library for each
enabled Dataverse table. Read the Dataverse document-location chain, list Graph
drives, and resolve the verified entity library. Calling `/sites/{id}/drive`
can quietly target the generic Documents library instead of the MDA library.

### 23. Server Logic role YAML uses current field names

Use `adx_serverlogic_adx_webrole` and `display_name`. The keys `webroles` and
`displayname` can upload without a hard failure while leaving every invocation
at HTTP 403. After deployment, call the endpoint as a real assigned user.

### 24. Direct Server Logic component patches can disturb invocation metadata

In an enhanced-model code site, a direct `powerpagecomponent` content PATCH was
observed to return the endpoint to HTTP 403 until a full declarative
`upload-code-site` restored its role metadata. Prefer full scaffold deployment
for Server Logic changes unless the target's component/association behavior has
been independently proven.

### 25. A SharePoint download URL is not an inline-preview URL

Navigating directly to `@microsoft.graph.downloadUrl` can download the file or
launch a desktop handler because SharePoint controls the response disposition.
For browser preview, fetch the bytes, create a correctly typed Blob, and open
the Blob URL as described in §9.6.

---

## 16. Validation & Definition of Done

### 16.1 Checks proven useful in the partner build

The partner build passed these checks before handoff:

- `npm run build` completed successfully.
- The compiled `dist/index.html` contained `portal-runtime-context`.
- All 13 routes rendered in local demo mode with no horizontal overflow at the
  tested desktop and mobile viewports.
- All 13 routes passed the automated axe scan with zero reported violations.
- Representative create, edit, delete, application-review, and reload workflows
  passed locally.
- The deployed permission and site-setting records matched the local scaffold
  with zero validator findings.
- Home-page Liquid processing, raw deep-route behavior, cached-context recovery,
  and the redirect-through-Home fallback were reproduced and fixed on the site.

These checks prove the build and configuration slices they exercise. They do not
prove public sign-in or production authorization by themselves. In the partner
build, tenant governance kept the Trial site private, so public local-login and
public runtime/API testing remained pending even though build and metadata
validation passed.

### 16.2 Runtime completion gate

Do not call a portal complete until all applicable checks below pass in the
target environment:

1. Run `pac org who` immediately before upload and re-query the intended
  environment/site ID after upload.
2. Confirm `dist/index.html` and every referenced JS/CSS asset belong to the same
  build. For direct overwrite mode, confirm the existing fixed filenames and
  component IDs were retained.
3. Re-read activation and visibility state; do not rely on the update API's HTTP
  status alone.
4. Open `/` in a fresh browser session and verify that the selected runtime
  global contains real IDs, not literal Liquid expressions.
5. Paste a deep client route into a fresh tab. Verify context recovery or the
  redirect-through-Home flow before React issues Dataverse requests.
6. While signed in as a real portal contact, run a permitted GET and each enabled
  POST, PATCH, and DELETE operation. Reload after every write to prove it
  persisted in Dataverse.
7. Verify every read-only surface has no create/delete controls and that a
  disallowed API operation is rejected rather than merely hidden in React.
8. Verify each list is scoped to the signed-in contact/account expected by its
  table permission and relationship metadata.
9. Inspect browser console and network failures. A PowerShell HTTP 200 for an
  asset is not sufficient because an unauthenticated request may return HTML.
10. Run route-wide desktop/mobile overflow and accessibility checks against the
   final build, not an earlier local bundle.

For SPA SharePoint document management, also require:

11. The portal Graph app requests only `Sites.Selected`; a fresh app token can
  access the selected site and cannot access an unrelated site.
12. Server Logic derives the record owner/account without accepting a client
  account ID, drive ID, folder, or path.
13. Listing returns the same files visible in the model-driven app's record
  folder.
14. A disposable binary upload succeeds from the deployed portal origin, is
  verified in the exact authorized parent folder, and is deleted afterward.
15. Upload verification rejects a wrong size or foreign item ID.
16. Download returns the original byte count and intended filename; PDF/image
  preview opens a typed Blob URL rather than SharePoint's attachment URL.
17. Delete rejects an item outside the authorized record folder and removes a
  permitted test item from both Graph and the refreshed React list.
18. No temporary broad Graph grantor permission, test file, upload URL, or
  secret remains after validation.

If governance or visibility prevents steps 4-10, record the portal as
**configuration-validated, runtime validation pending**. Do not promote that
state to “working end to end.”

### 16.3 Evidence to retain with each build

Keep a project-specific reference file alongside the guide containing:

- Environment URL/ID, PAC profile, website ID, exact site name, portal URL, and
  solution unique name.
- Web-role, table-permission, site-setting, web-template, Home page, JS, and CSS
  component IDs used by deployment.
- Logical table/column names, entity-set names, lookup bind properties, and
  relationship schema names verified from target metadata.
- The selected deployment mode and the commands that succeeded.
- Validation date, tested identity/account, routes tested, CRUD operations
  tested, unresolved governance blockers, and any runtime tests still pending.

This reference is intentionally separate because those values cannot be made
portable without becoming misleading.

---

## Quick-Start Checklist

```
[ ] Environment selected and Dataverse provisioned
[ ] Power Pages enabled on environment
[ ] PAC CLI authenticated: pac auth create --environment <id>
[ ] Publisher created (prefix chosen and cannot be changed)
[ ] Solution created — all tables created inside it
[ ] Tables created in dependency order (§3.4)
[ ] Vehicle year column created as String (not Integer)
[ ] Power Pages code site created
[ ] Home content page confirmed to use mspp_copy
[ ] Authenticated Users web role GUID captured
[ ] Invitation sending kept separate from deployment and explicitly approved
[ ] Table permissions created with lowercase content JSON, web-role content array, and M:N association
[ ] PublishAllXml called after permission and site-setting changes
[ ] Web API site settings created for all tables
[ ] Enhanced-model type 9 site-setting components verified
[ ] Invitation-only auth values and Header/OutputCache/Enabled=false verified
[ ] Liquid context bridge injected into dist/index.html and Home mspp_copy
[ ] Bridge contains no unmatched Liquid delimiter used as JavaScript text/comment
[ ] PAC target verified with pac org who immediately before upload
[ ] Intended environment and site ID re-verified after upload
[ ] Full upload has matching dist/index.html + hashed assets, OR direct overwrite retains fixed names
[ ] blockedattachments preserved; only js removed if required for upload
[ ] One demo contact + vehicle + expired registration seeded
[ ] Chosen runtime contract verified: __PORTAL_CONTEXT__, or DMV globals in that build only
[ ] Home and a fresh direct/deep route both initialize valid runtime context
[ ] /_api/<prefix>_vehicles?$top=1 returns 200 (not 403) while signed in
[ ] Representative create, update, reload, and authorization workflows pass in-browser
[ ] If SharePoint documents are required, React + Server Logic + Graph architecture selected (no native iframe/internal endpoint)
[ ] Existing MDA SharePoint site, entity library, and record-folder mapping verified from Dataverse metadata
[ ] Server Logic derives contact/account or membership server-side; client ownership identifiers are ignored
[ ] Server Logic metadata uses adx_serverlogic_adx_webrole and display_name
[ ] Graph app requests only Sites.Selected and has explicit read/write grant only on intended site
[ ] Graph client secret stored outside source control; expiry/rotation recorded
[ ] Binary upload-session CORS/CSP spike passes from deployed portal origin and test file is removed
[ ] Upload chunks are sequential, under 60 MiB, and non-final chunks are multiples of 320 KiB
[ ] Upload completion, download, preview, and delete all re-verify exact authorized parent path
[ ] PDF/image preview uses a typed Blob URL; Office files retain download behavior unless separately designed
[ ] Site visibility re-read after activation/update; governance status confirmed
[ ] Desktop/mobile overflow and accessibility checks run across every route
[ ] Power Automate denormalization flow built and enabled
```
