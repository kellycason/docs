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

## Publication Report

At completion, state:

- local files changed;
- schema and LSP results;
- draft push status;
- evaluations run and failures remaining;
- published or draft-only state;
- channels tested;
- remote knowledge/version checks still required.