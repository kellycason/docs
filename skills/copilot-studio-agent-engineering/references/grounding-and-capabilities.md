# Grounding and Capabilities

## Build an Authority Hierarchy

Do not call a source authoritative until its own content supports that status. A benefits summary, FAQ, or handbook may state that an official plan, contract, regulation, or policy controls in a conflict.

Record the hierarchy explicitly:

1. governing or official source;
2. approved summary or operational guide;
3. agent instructions and owner-approved behavior;
4. general model knowledge, if permitted at all.

When sources conflict, follow the higher authority or abstain and direct the user to the named owner. Do not silently reconcile conflicting numbers, dates, eligibility rules, or deadlines.

## Classify Every Instruction

Organize agent instructions into distinct sections:

- role and audience;
- tone and response shape;
- factual grounding and source hierarchy;
- scope boundaries;
- no-answer behavior;
- owner-approved redirects;
- implemented transactions and required prerequisites.

Do not mix business facts into behavioral prose without a source. Do not describe a redirect team, SLA, support channel, or escalation process unless it is sourced or explicitly approved as policy.

Conversation starters must be answerable by current knowledge or implemented topics. They are interface suggestions, not `triggerQueries`, and do not prove routing coverage.

## Claim-to-Source-to-Capability Audit

Use this table before editing:

| Claim or promise | Evidence required | Failure response |
|---|---|---|
| Benefit amount, coverage, eligibility, deadline | Exact source passage and effective period | Abstain; cite governing source or contact. |
| "I can open a ticket" | Existing action/flow plus successful runtime test | Do not promise it; offer only implemented contact options. |
| Out-of-scope redirect | Owner-approved policy or source | Label as policy; do not present it as source fact. |
| Personalized answer | Authenticated user context and permission-aware data path | Ask for input or explain the limitation. |
| Current information | Verified remote source version/effective date | State the known date or abstain. |

## Uploaded File Knowledge

Uploaded files are portal-managed resources. A pulled component can look like:

```yaml
kind: KnowledgeSourceConfiguration
source:
  kind: FileGroupKnowledgeSource
  instructions: |-
    Use this guide for the covered subject matter.
```

Important distinctions:

- A comment naming `knowledge-sources/guide.html` is provenance for humans, not a machine-readable upload binding.
- Pushing this YAML does not prove that a local file was uploaded or refreshed.
- Replacing the local source file does not prove that the remote index changed.
- Verify the file, version, indexing state, and representative answers in Copilot Studio after upload/update.
- Track effective dates and source versions outside generated claims.

For a new uploaded file, use the portal first, then pull the resulting component and reference its exact logical name.

## Automatic Versus Explicit Retrieval

Use automatic retrieval for straightforward Q&A when orchestration and source configuration already support it.

Use an explicit search topic when at least one is true:

- only selected sources may be searched;
- a conversational follow-up must be rewritten into a complete query;
- the result must be captured, checked, formatted, or combined;
- classic routing needs a knowledge fallback;
- deterministic no-answer handling is required.

The established explicit pattern is:

1. `CreateSearchQuery` from the user's contextual input;
2. `SearchAndSummarizeContent` using `Topic.SearchQuery.SearchQuery`;
3. explicit source selection and model-knowledge policy;
4. explicit `autoSend` and `responseCaptureType`;
5. a content-aware success/no-answer branch;
6. user-facing send or topic output, depending on orchestration.

Do not pass a raw follow-up such as "tell me more" directly into search. Test at least one cross-turn follow-up.

## Retrieved Response Checks

`FullResponse` returns a structured object. A structurally nonblank object does not guarantee useful answer content. Inspect the installed schema and test the actual path used for output, such as `Text.MarkdownContent` or `Text.Content`.

For any pulled combination such as:

- explicit `FileGroupKnowledgeSource` plus `DoNotSearchFiles`;
- `applyModelKnowledgeSetting: false`;
- manual send with `autoSend: false`;

preserve it until behavior is understood. Do not infer semantics from field names alone. Test known answer, no result, citations, and unsupported-answer abstention.

## Content Quality

- Use meaningful headings and explicit Q&A language for important facts.
- Pair tables with prose that explains row and column meaning.
- Keep effective dates near time-sensitive facts.
- Avoid duplicated or contradictory versions in the same search scope.
- Include the governing-source disclaimer in the source and reinforce it in instructions when material.
- Test paraphrases, comparisons, table lookups, and multi-part questions, not just text copied from headings.

## Scope Is a Deliberate Product Decision

The source may cover more domains than the agent's declared scope. Decide whether to:

- expand the instruction scope;
- exclude or split sources;
- keep the narrower scope and test that covered-but-out-of-scope questions are redirected consistently.

Do not assume that presence in the source automatically makes a subject in scope.