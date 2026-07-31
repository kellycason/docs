# Routing and Dialogs

## Inventory the Whole Trigger Surface

For each topic, record:

| Topic | Trigger kind | Priority | Trigger condition | Model description | Trigger queries | State/status |
|---|---|---:|---|---|---|---|

Include system topics, custom topics, tutorial topics, and hidden active components. Do not inspect only the topic being edited.

Flag:

- multiple active `OnConversationStart` topics;
- multiple active `OnUnknownIntent` topics;
- multiple error, sign-in, escalation, or generated-response interceptors;
- broad trigger queries that overlap another domain;
- generative topics with missing or weak `modelDescription`;
- classic topics with sparse or ambiguous `triggerQueries`;
- active sample topics outside the agent's scope.

LSP can accept all of these. Runtime tests decide whether the combination is correct.

## Do Not Assume Single Selection or Priority Direction

A pulled fallback may use `priority: -1` while another omits priority. Static examples may describe intended precedence, but the installed runtime, trigger kind, and orchestration mode control actual selection.

Use distinct diagnostic responses or capability-use evaluation to determine whether one handler is selected, multiple handlers execute, and in what order. Remove diagnostics after the result is known. Prefer one clear owner per system event unless intentional multi-handler behavior is tested.

## Trace the Reference Graph

Search every `dialog:` target and classify the call:

- `BeginDialog`: calls another dialog; the caller may resume if the callee and dialog stack do not cancel, replace, or end it;
- `ReplaceDialog`: replaces the current dialog;
- `EndDialog`: ends the current dialog and can return to a caller;
- `CancelAllDialogs`: clears the dialog stack.
- `EndConversation`: ends the conversation rather than merely returning from the current dialog.

Also inspect the callee's root `startBehavior`. For example, `CancelOtherTopics` can change the stack before any callee action runs. Do not infer termination or return behavior from a topic name; evaluate `startBehavior`, every reachable terminal action, and the runtime path together.

Trace special routes too:

- disambiguation "none of these" branches;
- fallback escalation after repeated attempts;
- sign-in and error redirects;
- nested confirmation/decline branches;
- child-agent and tool return paths.

A direct disambiguation redirect to the stock fallback can bypass a grounded `OnUnknownIntent` topic completely.

## Empty Branches Mean Fall-Through

A condition item can be structurally valid without `actions`. That often means:

```text
if condition is true: do nothing here, then continue after the ConditionGroup
else: run exception handling, then possibly continue
```

This can be elegant, but it is easy to misread. For every empty branch, answer:

1. What action runs next?
2. Does every `elseActions` path also reach that action?
3. Does a decline/cancel path need `ReplaceDialog`, `EndDialog`, or `CancelAllDialogs` to prevent continuation?
4. Does the callee's `startBehavior` cancel the caller?
5. Can the callee execute `EndConversation`, and what happens on paths where it does not?
6. What happens if the called dialog returns?

Test every branch, including negative and unexpected entity values.

## Entity and Condition Semantics

- Boolean entities should be compared as Boolean values, not quoted text.
- Prebuilt location/state/date entities can normalize user text; test aliases and invalid input.
- Embedded choice conditions must use their fully qualified option literal, or a `Text()`-coerced label comparison (see below).
- Power Fx `||` and `&&` logic should be tested at each boundary.
- `alwaysPrompt: false` can reuse an already recognized value; `alwaysPrompt: true` deliberately asks again. Test both direct invocation and invocation with pre-populated context.

## Closed-List Choice Comparisons (Choice vs String)

A `Question` whose `entity` is an `EmbeddedEntity` wrapping a `ClosedListEntity` produces a **Choice / EmbeddedOptionSet**-typed variable, not a String. Comparing that variable to a plain string literal in a `ConditionGroup` — `=Topic.Choice = "Option A"` — fails strict validation (observed in GCC) with:

```text
Incompatible type comparison. Type: String, expected: EmbeddedOptionSet
```

Two correct forms:

1. **Graphical editor**: it auto-generates a comparison against the fully qualified generated option literal and hides the type detail, so the mismatch never appears.
2. **Hand-authored code editor**: coerce the variable to its label with `Text()` — `=Text(Topic.Choice) = "Option A"`. Set each list item's `id` equal to its `displayName` so `Text()` returns the label you compare against.

The mismatch only surfaces when hand-authoring YAML in the code editor; the graphical designer never shows it because it writes the option comparison for you. When pulling a portal-built topic, preserve whichever form is serialized — do not rewrite a generated option literal into a plain string, and do not "simplify" a `Text()` comparison back to a bare string.

## Dialog Test Cases

For each changed flow, include:

- each positive branch;
- each negative/else branch;
- invalid or unrecognized entity input;
- pre-populated entity versus prompted entity;
- interruption and topic switch, if allowed;
- called-dialog return behavior;
- repeated fallback threshold;
- ambiguous-topic disambiguation;
- "none of these" routing;
- a user utterance that could trigger an active tutorial topic.

Use capability-use grading where available to prove which topic or action ran. Response text alone can hide incorrect routing.