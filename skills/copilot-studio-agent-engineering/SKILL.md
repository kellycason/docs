---
name: copilot-studio-agent-engineering
description: 'Build, edit, audit, ground, validate, push, and test Copilot Studio YAML agents safely. Use when working with agent.mcs.yml, settings.mcs.yml, topics, knowledge, .mcs metadata, AdaptiveDialog, SearchAndSummarizeContent, FilePrebuiltEntity, InvokeFlowAction, Power Automate tools, routing collisions, uploaded-file knowledge, Power Fx, Direct Line, Copilot Studio ALM, or when an agent is valid but behaves incorrectly. Complements Copilot Studio authoring tools with source-integrity, identity-preservation, runtime-routing, transaction-contract, and end-to-end verification guidance.'
argument-hint: 'Describe the Copilot Studio change, audit, or behavior to investigate'
user-invocable: true
---

# Copilot Studio Agent Engineering

Use this skill as the engineering workflow around the specialized Copilot Studio authoring tools. It does not replace schema lookup, the Author agent, validation, management, or evaluation skills. It makes those tools work together without losing source integrity or mistaking valid YAML for correct runtime behavior.

## Non-Negotiable Rules

1. Ground customer-specific facts in the customer's actual source material. Do not invent facts, policies, contacts, capabilities, or process details.
2. Separate four things before authoring:
   - source facts: claims explicitly supported by source content;
   - behavioral policy: tone, scope, redirects, and escalation rules approved by the owner;
   - implemented capabilities: topics, actions, flows, connectors, and child agents that actually exist;
   - platform configuration: authentication, access, channels, orchestration, and remote knowledge state.
3. Treat logical names, filenames, node IDs, and fully qualified references as opaque identifiers. Resolve and preserve them; never reconstruct them from display labels.
4. Never infer runtime correctness from schema or LSP success alone.
5. Never publish without explicit confirmation. A push updates the draft; a publish changes the live agent.

## Tool Routing

When the Copilot Studio extension tools are available, use the owning specialist:

| Work | Owner |
|---|---|
| Design review, pattern choice, runtime troubleshooting | Copilot Studio Advisor |
| Create or edit `.mcs.yml` content | Copilot Studio Author |
| Pull, diff, push, clone, or publish | Copilot Studio Manage |
| Draft evaluations, point tests, or published tests | Copilot Studio Test |
| Exact node or property shape | Schema lookup / reference skills |

Use this skill to prepare the evidence, constrain the work, and define verification. Do not bypass a specialist with a hand-written approximation.

## Workflow

### 1. Establish the Local and Remote State

1. Discover `**/agent.mcs.yml`. If there are multiple agents, ask which agent owns the request.
2. Check for uncommitted or unpushed local work before any pull. Do not overwrite user changes.
3. If the project is cloud-backed, compare local and remote state. Pull fresh content before editing only after local work is understood and protected.
4. Treat `.mcs/conn.json` as connection metadata and potentially sensitive. Read only what the management or validation tool requires; never echo tokens or secrets.
5. For sovereign environments, discover each service and channel endpoint from authoritative metadata. Do not construct hosts by replacing commercial suffixes.

### 2. Read the Controlling Surface

Read only the smallest set that controls the requested behavior:

1. `settings.mcs.yml` for `schemaName`, language, template, authentication, access control, and orchestration settings.
2. `agent.mcs.yml` for instructions, conversation starters, model settings, and agent-level knowledge bindings.
3. The target topic/component and every component it directly references.
4. The registered action wrapper and persisted trigger/response contract for every flow the topic invokes.
5. Hidden `.mcs/botdefinition.json` only as read-only identity/state evidence when filenames or display names are ambiguous.
6. The actual source document for every factual response being added or changed.

See [Identity and Authoring](./references/identity-and-authoring.md).

### 3. Build the Claim, Source, and Capability Map

Before changing instructions or generated answers, record:

| Proposed behavior or claim | Source evidence | Implemented component | Classification |
|---|---|---|---|
| Factual answer | Exact source section | Knowledge source/search path | Supported fact |
| Redirect or escalation | Owner-approved rule | Message/topic/action | Behavioral policy |
| Transaction such as opening a ticket | Business requirement | Action/flow/connector | Implemented capability or unsupported |
| Authentication/personalization | Platform setting | Auth/channel configuration | Platform behavior |

Reject or clearly qualify anything with no source or implementation. A source document saying an assistant can perform an action does not make the action exist.

See [Grounding and Capabilities](./references/grounding-and-capabilities.md).

### 4. Audit Routing Before Adding Behavior

1. Inventory every active trigger kind, priority, condition, model description, and trigger query.
2. Flag duplicate system triggers such as multiple `OnConversationStart`, `OnUnknownIntent`, or `OnError` topics.
3. Trace direct dialog references (`BeginDialog`, `ReplaceDialog`) and disambiguation routes. A redirect can bypass the fallback you expected to run.
4. Check active tutorial, sample, and template topics against the declared agent scope.
5. Do not infer whether one handler is selected, multiple handlers run, or what order applies from priority values alone. Prove handler count, selection, and order at runtime.

See [Routing and Dialogs](./references/routing-and-dialogs.md).

### 5. Choose the Smallest Correct Change

- Prefer native automatic knowledge retrieval for simple grounded Q&A.
- Add explicit `SearchAndSummarizeContent` only when source scoping, query rewriting, response capture, deterministic fallback, or post-processing is required.
- Preserve existing pulled structures and IDs when editing. Generate IDs only for new nodes and validate their required uniqueness scope.
- Resolve knowledge and dialog references from existing references or generated metadata. Use a pulled filename only when the owning specialist explicitly defines it as serialized identity, and never normalize it or derive identity from a display name.
- For embedded closed-list entities, compare against the fully qualified generated choice literal. Do not replace it with a plain display string.
- Treat `init:` as node-contract dependent, not a universal first-use rule.
- Make intentional empty branches, callee `startBehavior`, `EndConversation`, and dialog-return behavior explicit in the design and test them.
- Configure uploaded files in the portal. YAML can describe and reference a pulled `FileGroupKnowledgeSource`, but a nearby local file is not automatically uploaded or refreshed.
- For a conversational file upload, use `FilePrebuiltEntity` and bind its `Name` and `Content` to a registered flow's native file-object contract. Do not coerce a file into a string input.
- Keep AI extraction and transactional commit in separate flows when reviewed values or explicit confirmation must control the write.
- Bind transaction-critical inputs explicitly. Do not delegate required write values to `AutomaticTaskInputs` or "Dynamically fill with AI."

See [Files, Flows, and Transactions](./references/files-flows-and-transactions.md).

### 6. Author Through the Specialist

Give the Author agent:

1. the exact agent directory;
2. the controlling files and resolved logical names;
3. the approved claim/source/capability map;
4. the desired routing and dialog behavior;
5. the behavioral tests that must pass;
6. an instruction to preserve unrelated content, generated IDs, filenames, encoding, and line endings.

Require schema lookup for every new `kind` and for any uncertain property. Treat the extension's bundled schema as a structural drafting aid that can lag the platform. Full LSP validation is the current authoring check for the connected environment, and runtime tests remain authoritative for behavior.

If authenticated cloud content pull or push remains HTTP 403 while other environment operations work, stop retrying it as a credential problem. Do not hand-author generated metadata. Preserve the diff, use the portal code editor only as an explicit fallback, and reconcile through pull when access is restored.

### 7. Validate in Layers

Run these checks in order:

1. YAML/schema validation for edited files.
2. Full LSP validation for the complete agent: structure, Power Fx, references, and environment rules.
3. Reference audit: all dialog, knowledge, action, variable, and choice references resolve exactly.
4. Action-contract audit: registered flow inputs and outputs match the topic bindings and persisted flow schema.
5. Runtime behavior tests in draft after push.
6. Published-channel tests only after explicit publish approval.

Zero diagnostics proves only that the authoring model accepts the files. It does not prove trigger multiplicity or order, retrieval quality, abstention, authentication, channel behavior, or dialog continuation.

### 8. Use the Safe Lifecycle

Follow:

`protect local work -> compare/pull -> inspect -> edit -> validate -> review diff -> push draft -> run draft evals -> confirm publish -> publish -> test target channels`

Do not use `--force` to bypass validation unless the user explicitly accepts the risk. After any portal edit, pull again before local editing because YAML-only fields and generated identities can change or be removed. If pull is blocked, record the portal as temporary source of truth and name the missing validation layer rather than implying it passed.

See [Lifecycle and Tests](./references/lifecycle-and-tests.md).

## Completion Standard

Do not report the work complete until all applicable statements are true:

- every customer-specific claim has source evidence or is labeled owner-approved policy;
- every promised transaction has a real implementation path;
- no logical identifier was guessed or normalized;
- full LSP validation passes without unreviewed diagnostics, or an explicit platform/tooling block and substitute portal/runtime evidence are reported without calling that layer passed;
- known-answer, no-answer, out-of-scope, multi-turn, and routing-collision tests pass;
- conversational file contracts, review branches, confirmation, decline, and exactly-once writes pass when the agent performs document transactions;
- returned transaction identifiers match the committed records;
- draft versus published state is stated clearly;
- any remaining portal-only or channel-only check is named explicitly.

## References

- [Baseline Gap Analysis](./references/baseline-gap-analysis.md): what Microsoft's marketplace and the installed extension already cover, and what this skill adds.
- [Identity and Authoring](./references/identity-and-authoring.md): project anatomy, opaque identifiers, choices, variables, and generated metadata.
- [Grounding and Capabilities](./references/grounding-and-capabilities.md): source authority, instructions, uploaded files, and grounded answer behavior.
- [Routing and Dialogs](./references/routing-and-dialogs.md): collisions, reference graphs, empty branches, and dialog continuation.
- [Files, Flows, and Transactions](./references/files-flows-and-transactions.md): conversational uploads, native file contracts, registered flow tools, review-before-commit design, and Direct Line evidence.
- [Lifecycle and Tests](./references/lifecycle-and-tests.md): safe sync, validation layers, eval design, publication, and channel checks.
- [HR Benefits Case Study](./references/hr-benefits-case-study.md): verified lessons from a sanitized source project; examples, not universal defaults.
- [Document Intake Transaction Case Study](./references/document-intake-case-study.md): verified file-to-flow, human-review, sovereign-cloud, portal-fallback, and custom Web Chat lessons from a sanitized synthetic build.