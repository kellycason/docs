# Files, Flows, and Transactions

## Separate the Two File Features

Copilot Studio has two different file scenarios that must not be conflated:

- `FileGroupKnowledgeSource` is portal-managed knowledge used for retrieval.
- `FilePrebuiltEntity` captures a file uploaded during a conversation.

A local file beside the YAML does not upload either resource. A knowledge file does not become a conversational attachment, and a conversational attachment does not become indexed knowledge.

## Use a Review-Before-Commit Architecture

For document intake that ends in a transaction, prefer this boundary:

```text
FilePrebuiltEntity question
  -> extraction flow
  -> OCR or document processing
  -> structured outputs
  -> user review and business-rule checks
  -> explicit confirmation
  -> separate commit flow
  -> retrieve generated identifier
  -> confirmation response
```

Keep extraction and record creation separate when a person must review AI-derived values. The reviewed or user-supplied values are authoritative. Store the raw extraction result for traceability only when approved by the data owner.

Do not:

- create the record before confirmation;
- report a confidence value unless the model actually returns one;
- claim that a transaction completed without evidence from the commit flow;
- retry a commit blindly after an ambiguous response, because that can create duplicates.

## Treat the Flow Contract as Authoritative

A cloud-flow row, workflow GUID, or active state does not prove that the agent owns a usable action. The reliable sequence is:

1. Build the flow with a Copilot-compatible trigger and response action.
2. Save it and verify that the trigger inputs and response outputs actually persisted.
3. Add the existing flow through the Copilot Studio tool picker.
4. Let the platform register the tool identity and action contract.
5. Pull the generated component and bind against its exact names and types.
6. After any trigger-input or response-output change, refresh the tool and pull again.
7. Keep one platform-authoritative local action wrapper per tool.

Distinguish these identities:

- workflow GUID;
- Copilot tool component ID;
- schema or logical name;
- display name;
- pulled filename;
- topic `flowId` and generated binding metadata.

Do not derive one from another. Do not hand-edit `.mcs/botdefinition.json` or invent an action wrapper to compensate for missing cloud metadata.

## Use the Native File Record Contract

A conversational upload is a file record, not a base64 text value. A topic can capture it with:

```yaml
- kind: Question
  id: question_document
  alwaysPrompt: true
  variable: init:Topic.Document
  prompt: Please upload the document.
  entity:
    kind: FilePrebuiltEntity
    includeFileMetadata: true
```

The corresponding flow input should be a file-shaped object. Its persisted trigger schema should be equivalent to:

```json
{
  "documentContent": {
    "type": "object",
    "x-ms-content-hint": "FILE",
    "properties": {
      "name": { "type": "string" },
      "contentBytes": { "type": "string", "format": "byte" }
    }
  }
}
```

Bind the topic file to that record explicitly:

```yaml
- kind: InvokeFlowAction
  id: invoke_extract
  flowId: <resolved-workflow-id>
  input:
    binding:
      documentName: =Topic.Document.Name
      documentContent: ={ name: Topic.Document.Name, contentBytes: Topic.Document.Content }
```

Inside the flow, an OCR action that expects base64 content can read:

```text
triggerBody()?['documentContent']?['contentBytes']
```

Do not declare the trigger input as `string` and bind `Topic.Document.Content` to it. Copilot Studio treats the content as a file value and does not provide a general Power Fx conversion that makes the mismatched string contract correct.

## Bind Transaction Inputs Deterministically

For inputs that control extraction, business rules, or writes:

- use explicit `input.binding` expressions;
- map every required input and every consumed output by its exact generated name;
- choose custom Power Fx values in the portal rather than "Dynamically fill with AI";
- remove or reject `AutomaticTaskInputs` for values that must be deterministic;
- preserve types across topic, action contract, flow, and Dataverse.

Power Fx can normalize extracted text before a rule. A verified date calculation shape is:

```yaml
value: =IfError(DateDiff(Today(), DateValue(Topic.ReviewedDate), TimeUnit.Days), 999)
```

If a sentinel such as `999` is used, handle parse failure explicitly. Do not let invalid or missing text silently pass a safety, eligibility, or expiration rule.

## Diagnose Binding Failures by Boundary

| Diagnostic or symptom | Likely boundary | Check |
|---|---|---|
| `Binding '<name>' is not found` | Stale or unavailable generated action contract | Refresh the registered flow, pull again, and compare exact input/output names. |
| Required binding is missing | Topic and flow schemas differ | Inspect the persisted trigger schema, not only the designer control. |
| Input is the incorrect type `File` | Flow still expects text | Change the trigger to the native file object and re-register or refresh it. |
| Duplicate properties in an action | More than one local wrapper represents one tool | Retain only the platform-authoritative component. |
| Flow has no run after attachment upload | Failure occurred before invocation | Check channel transport, topic routing, and action binding first. |
| Flow ran but no record exists | Failure occurred inside extraction, review, or commit | Inspect the run action-by-action and verify the confirmation branch. |

When a designer save appears successful but bindings still reflect the old contract, inspect the authoritative persisted definition or connector schema. UI state is not proof that a schema change persisted.

## Treat Low-Level Flow Mutation as Recovery Work

Prefer the supported Power Automate and Copilot Studio designers. Direct mutation of a serialized workflow definition is an advanced recovery path, not the normal authoring workflow.

If an owner explicitly approves that path:

1. export or back up the current definition;
2. deactivate the flow when required;
3. remember that Dataverse `workflow.clientdata` is a JSON string, not a nested JSON object;
4. validate every expression and connector operation before writing;
5. reactivate the flow;
6. retrieve and parse the stored definition to prove the schema and expression persisted;
7. refresh the Copilot Studio tool contract;
8. run a synthetic end-to-end test.

Never use a low-level patch to guess connector operation IDs, managed AI metadata, or generated Copilot tool identities.

## Prove the Entire Runtime Evidence Chain

For a file-backed transaction, verify each boundary separately:

1. The intended topic is selected.
2. The file question accepts the supported type and size.
3. The channel stages and uploads the attachment.
4. The activity post succeeds.
5. The extraction flow creates a run.
6. OCR or document processing executes.
7. Structured outputs return to the topic.
8. The user can review or replace uncertain values.
9. A decline or cancel creates no record.
10. Confirmation invokes the commit flow exactly once.
11. Exactly one record exists with the reviewed values.
12. The generated identifier returned to the user matches the stored record.
13. The same path succeeds in every published target channel.

Use synthetic, non-customer documents for repeatable tests. Include malformed, missing-field, wrong-file-type, duplicate-send, decline, replacement-document, and downstream-failure cases.

## Debug Direct Line and Custom Web Chat in Stages

An attachment send is not one network operation. In custom Web Chat it can include:

1. reading a browser object URL such as `blob:`;
2. posting the attachment to the regional Direct Line `/upload` endpoint;
3. posting or receiving activities;
4. executing the selected topic and flow.

Therefore:

- `/upload` returning HTTP 200 proves transport, not topic or flow success;
- no flow run after a successful upload points to routing, topic execution, or action binding;
- a failed `blob:` read means the upload request may never be sent;
- a bot `SystemError` after transport success must be correlated with topic and flow evidence.

For a Content Security Policy, allow only the required hosts, but include the actual regional Direct Line HTTPS and WSS endpoints and `blob:` in `connect-src` when Web Chat fetches its staged object URL. Query environment or channel settings for the regional endpoint; do not construct sovereign-cloud hostnames by replacing commercial suffixes.

Test the real published channel with browser network evidence. Also check attachment filename and size contrast, progress, retry, error text, focus, and keyboard behavior. A working test pane does not prove custom Web Chat rendering or CSP behavior.
