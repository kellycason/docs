# Document Intake Transaction Case Study

This case study records verified observations from a sanitized public-sector demonstration. The source project, tenant, environment, identities, records, and synthetic document values are not bundled. These observations are evidence for reusable engineering rules, not a solution template or a source of customer facts.

## Verified Architecture

The completed path used:

```text
Published custom Web Chat
  -> Copilot Studio file question
  -> Power Automate extraction flow
  -> AI Builder text recognition
  -> structured AI extraction
  -> topic review and date rule
  -> optional replacement document
  -> explicit user confirmation
  -> separate Power Automate commit flow
  -> Dataverse record
  -> generated identifier returned to the user
```

Only synthetic PDFs were used. The transaction flow ran after explicit confirmation, created one record, and returned the same generated identifier stored on that record.

## File Contract Failure and Resolution

The extraction flow initially exposed document content as a string. The topic captured a `FilePrebuiltEntity`, so binding its `Content` produced a file value. Copilot Studio correctly rejected the mismatch: refreshing the topic could not make a file satisfy a string contract.

The working trigger contract was a file-shaped object with:

- `type: object`;
- `x-ms-content-hint: FILE`;
- a string `name` property;
- a byte-formatted string `contentBytes` property.

The topic bound:

```yaml
documentContent: ={ contentBytes: Topic.Document.Content, name: Topic.Document.Name }
```

The OCR action read the nested `contentBytes` value. After the flow contract actually persisted and the tool binding was refreshed in Copilot Studio, the portal accepted the topic and the published flow ran.

## Designer State Was Not Persisted State

An earlier flow-editor attempt appeared to save a file input, but the serialized workflow definition still contained the old string schema. Inspecting the persisted trigger definition disproved the stale-cache theory.

Reusable rule: after a flow trigger or response contract changes, verify the persisted schema itself. A refreshed Copilot Studio action cannot discover a contract that the flow never saved.

A low-level workflow-definition update was used only as a recovery step. The successful recovery required treating `workflow.clientdata` as an escaped JSON string, reactivating the flow, retrieving it again, and proving that both the file schema and OCR expression persisted. This is not a default authoring path.

## Tool Registration and Local Validation Boundary

The flow existed and was active before it became a usable Copilot Studio tool. Registration through the portal created the action identity and binding contract.

In the tested sovereign environment, the supported cloud content pull and push endpoint returned HTTP 403 even after valid authentication and a portal tool refresh. Other environment and Dataverse operations still succeeded. Repeated sign-in attempts did not change the endpoint-specific authorization result.

Consequences:

- local action wrappers could validate independently while a raw `InvokeFlowAction` topic reported missing bindings;
- hand-authoring generated metadata would not have repaired the missing cloud contract;
- the portal topic code editor became the authoritative recovery surface;
- full LSP success could not be claimed for that cloud-backed topic;
- portal validation plus runtime proof were recorded as different evidence, not mislabeled as LSP validation.

The portal topic editor accepted the dialog body beginning with `kind: AdaptiveDialog`; the local file also carried `mcs.metadata`. Automation had to verify that the editor registered a dirty state before Save became enabled. After the portal save and explicit publication approval, the published path was tested rather than inferred from the save notification.

## Deterministic Transaction Inputs

Every flow input was bound with explicit Power Fx. Transaction values were not left to automatic AI filling. The topic:

- displayed extracted fields for review;
- parsed a returned date string for a real date-boundary rule;
- requested a replacement document when the tested rule matched;
- retained the reviewed replacement value;
- invoked the commit flow only after a Boolean confirmation;
- sent a no-write response on decline.

The date expression used `DateValue`, `DateDiff`, `TimeUnit.Days`, and `IfError`. The synthetic test date was chosen so the rule could be observed at runtime. This proves the branch executed; it does not make that threshold a reusable business policy.

## AI Builder Capability Boundary

An active custom document model was rejected because its configured document domain did not match the intake document. The working pattern used general text recognition followed by structured extraction with an explicit entity list.

The demonstration did not invent a confidence score. It returned only fields present in the actual model output, showed them to the user, and kept record creation after review.

## Authentication and Sovereign Endpoints

Environment API, Dataverse, maker, agent-management, portal, and Direct Line hosts were treated as separate endpoints. The regional Direct Line URL came from channel settings rather than suffix substitution.

The published no-authentication channel also exposed a remote configuration mismatch: local authoring settings alone did not prove the live bot's authentication mode and trigger. The runtime error disappeared only after the remote bot configuration was corrected and republished. The observed PAC CLI version did not detect that authentication-only change reliably, so the remote state and live channel were verified directly.

Reusable rule: cloud name, local YAML, successful sign-in, and a successful publish command are each incomplete auth evidence. Verify the tenant/account context, remote bot configuration, publication result, and target channel behavior.

## Custom Web Chat Upload Boundary

The file worked in a local frontend but initially failed in the deployed portal. Network evidence showed that Web Chat attempted to read its staged `blob:` object URL before sending `/upload`. The site's `connect-src` blocked that read, so the upload request never fired.

After `blob:` was allowed for the required connection path:

- the object-URL read returned HTTP 200;
- the regional Direct Line `/upload` request returned HTTP 200;
- the bot processed the document and replied;
- the attachment filename and size were visually verified for readable contrast.

This was distinct from an earlier failure where `/upload` succeeded but the bot later returned `SystemError`. In that case, transport was healthy and no extraction-flow run existed, locating the fault between topic execution and flow invocation.

Fresh response headers and bundle requests were used during verification because a previously open portal tab still held older assets and policy. Cached channel behavior was not treated as current deployment evidence.

## Failed Paths and Reusable Rules

| Failed path | Observed boundary | Reusable rule |
|---|---|---|
| Synthesizing a sovereign Direct Line host | Tool produced a malformed endpoint | Discover each service endpoint from authoritative environment or channel metadata. |
| Repeated authentication after endpoint-specific HTTP 403 | Dataverse access worked while bot-content sync remained forbidden | Classify the blocked operation; do not loop on sign-in or bypass generated metadata. |
| Binding a file value to a string flow input | Copilot Studio reported an incorrect `File` type | Use the native file object with `name` and `contentBytes`. |
| Refreshing a flow whose schema had not persisted | Old bindings remained correct for the stored flow | Verify persisted trigger and response schemas before blaming cache. |
| Keeping duplicate action wrappers | Full validation reported duplicate properties | Keep one platform-authoritative action identity per tool. |
| Accepting editor diagnostics or process exit code alone | Complete validation later exposed cross-file binding errors | Require healthy initialization, complete diagnostics, and explicit `valid` status. |
| Treating attachment UI failure as one generic upload error | One failure occurred before `/upload`; another occurred after upload | Inspect object-URL read, upload, activity, topic, and flow boundaries separately. |
| Testing only in the Copilot Studio pane or localhost | Deployed CSP and attachment styling defects were missed | Test each real published channel with network and visual evidence. |

## Reusable Conclusion

The decisive unit of correctness was not the YAML file, cloud flow, portal save, or upload response by itself. It was the complete evidence chain from file selection through persisted action contract, topic routing, extraction, review, confirmation, exactly one data write, returned identifier, and published-channel rendering.
