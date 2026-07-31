# Lifecycle and Tests

## Safe Local and Remote Lifecycle

1. Discover the agent and inspect local version-control state.
2. Use the management `changes` operation to understand local versus remote differences.
3. Protect user changes before pulling. Do not overwrite a dirty workspace blindly.
4. Pull fresh row versions.
5. Inspect the pull before editing; portal changes may have rewritten generated content.
6. Make the smallest scoped edit through the Author agent.
7. Run schema validation on edited files.
8. Run full-project LSP validation.
9. Review the diff for unrelated formatting, identity, or metadata churn.
10. Push to draft.
11. Run draft evaluation or draft-capable tests.
12. Ask before publish, explaining the affected audience.
13. Publish and wait for API-confirmed completion, not an arbitrary delay.
14. Test every target channel whose auth, rendering, or behavior differs.

Push can fail with stale row versions even when YAML is correct. Pull-before-push prevents that only if local edits are first understood and protected.

## When Cloud Content Sync Is Blocked

Treat an endpoint-specific HTTP 403 differently from an expired credential:

1. Confirm the tenant, account, environment, and requested resource.
2. Refresh authentication once and retry the exact operation once.
3. Check whether environment discovery, Dataverse, and other operations still work.
4. If only the bot-content endpoint remains forbidden, record it as an authorization or consent boundary.
5. Do not loop on browser sign-in, use `--force`, or hand-author generated metadata.

If the portal designer remains available, it can be used as a controlled fallback with owner approval:

1. preserve the local component and intended diff;
2. open the exact portal component and its code editor;
3. use the body shape the portal expects - topic editors can omit local `mcs.metadata` and begin at `kind: AdaptiveDialog`;
4. after automated insertion, verify that the editor registered a dirty state and Save is enabled;
5. save and review portal diagnostics;
6. publish only after explicit confirmation;
7. test the draft or published behavior at runtime;
8. pull and reconcile as soon as supported sync is restored.

Portal save validation is not full LSP validation. Name the unavailable layer and the substitute evidence precisely.

## Validator Health Gate

A validation run counts only when:

- the language server initializes normally;
- the intended complete workspace is open;
- every expected component is included;
- diagnostics finish without timeout or crash;
- the returned status is successful and `valid` is true;
- the error summary is zero.

Process exit code zero, editor-only diagnostics, partial output, and a timed-out validator are not passing evidence.

## Validation Layers

| Layer | Proves | Does not prove |
|---|---|---|
| YAML parse/schema | Syntax, known kinds, property shape | Cross-file identity, Power Fx semantics, runtime behavior |
| Full LSP | Schema, Power Fx, references, environment diagnostics | Trigger multiplicity/order, retrieval quality, auth success, channel rendering |
| Draft evaluation | Agent behavior on test prompts | Published channels or production credentials |
| Published point/batch test | Live behavior for tested path | Untested roles, channels, source updates, or edge cases |

Never summarize `valid: true` as "the agent works." Report the exact validation boundary.

## Minimum Grounded-Agent Test Matrix

| Category | Required cases | What success means |
|---|---|---|
| Known facts | One direct and one paraphrased question per source domain | Correct answer with no unsupported additions |
| Tables/comparisons | Row lookup, column comparison, and multi-part question | Values stay attached to the correct plan/category |
| Effective dates | Current, past, and unspecified date phrasing | Agent uses the documented period and does not imply currency beyond it |
| Multi-turn retrieval | Follow-up such as "what about the other plan?" | Query rewrite preserves prior subject |
| No-answer | Plausible but absent fact | Clear abstention and approved next step |
| Out of scope | Neighboring domain and unrelated domain | Correct redirect without invented process detail |
| Unsupported capability | Ask agent to perform an unimplemented transaction | Agent does not claim success or fabricate a ticket/action |
| Source conflict | Summary versus governing disclaimer | Agent follows authority hierarchy or escalates uncertainty |
| Routing | Exact, near-match, collision, ambiguous, and none-of-these prompts | Intended topic/capability is selected |
| Dialog flow | Every condition, decline, cancel, and return path | No accidental continuation |
| Authentication | Anonymous, authenticated, unauthorized, and sign-in-needed paths | Access and prompts match configuration |
| Channels | Test chat plus every deployed channel | Formatting, cards, auth, and links work per channel |
| Source freshness | Query a recently updated fact | Remote index reflects intended version |
| Conversational files | Valid file, wrong type, oversize, missing field, and replacement file | Native file contract reaches the intended extraction action with clear errors |
| Transactions | Confirm, decline, retry, duplicate send, and downstream failure | Decline writes nothing; confirm writes exactly once; ambiguous failures do not duplicate |
| Generated identifiers | Commit plus record retrieval | Identifier shown to the user matches the stored record |
| Channel transport | Object-URL read, attachment upload, activity, and bot response | Each network and runtime boundary succeeds independently |

## Evaluation Design

Use behavioral rubrics for generated answers rather than exact prose. A useful rubric names:

- facts that must be present;
- unsupported claims that must not appear;
- expected abstention or redirect;
- expected citation/source;
- expected topic/action capability when routing matters.

Use graders deliberately:

- General quality or a custom grader for groundedness and abstention;
- Compare meaning for stable semantic answers;
- Keyword match for required identifiers, contacts, or values;
- Exact match only for genuinely deterministic output;
- Capability use for topic/action/tool selection.

Do not use expected answer text copied from the source as the only test. Add paraphrases, adversarial assumptions, and follow-ups.

## Recommended Draft Loop

For each behavior slice:

1. edit one owning component;
2. validate the full agent;
3. push draft;
4. run the smallest discriminating test;
5. repair the same slice if it fails;
6. run the broader matrix after the narrow check passes.

This keeps routing and grounding defects local and avoids stacking several unverified changes.

## Authentication and Channel Boundaries

Treat these as separate layers:

- `accessControlPolicy` controls who may access the agent;
- `authenticationMode` controls identity mode;
- `authenticationTrigger` controls when sign-in is requested;
- `OnSignIn` controls conversational behavior around sign-in;
- connector connection mode controls whose credentials invoke an action;
- each channel can impose additional identity and rendering behavior.

Never copy an auth combination from another agent without channel-specific tests.

Local auth YAML is not proof of remote or published auth state. If runtime reports an error such as `AuthenticationNotConfigured`, compare the portal settings, remote bot record, publication state, and channel behavior. Record the PAC CLI version when change detection or publication appears to ignore an authentication-only update.

For sovereign environments, discover environment API, Dataverse, maker, agent-management, portal, and channel endpoints independently. A successful Azure sign-in or cloud label does not prove that a constructed service hostname is correct. Use the regional Direct Line URL returned by channel settings.

## Evidence Ledger

Keep four explicit states during a complex build:

- verified platform state;
- locally authored but not pushed state;
- draft-tested state;
- published and channel-tested state.

For every failed path, record the attempted operation, exact observed boundary, whether remote state changed, and the reusable rule. This prevents repeated retries and makes completion claims auditable.

## Publication Report

At completion, state:

- local files changed;
- schema and LSP results;
- draft push status;
- evaluations run and failures remaining;
- published or draft-only state;
- channels tested;
- remote knowledge/version checks still required.
- registered action contracts and flow runs verified;
- transaction write count and returned identifier verified;
- blocked validation or management layers, if any, without implying they passed.