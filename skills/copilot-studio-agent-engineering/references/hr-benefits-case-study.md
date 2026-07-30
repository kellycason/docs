# HR Benefits Assistant Case Study

This case study records verified observations from a separate, sanitized `HR Benefits Assistant` source project. The source files are not bundled with this skill. The observations are evidence for reusable audit questions, not a template to copy unchanged.

## Verified Architecture

- `settings.mcs.yml` defines the schema namespace, access control, authentication, template, and language.
- `agent.mcs.yml` contains role/tone/grounding/scope instructions, four conversation starters, and a specific knowledge binding.
- The knowledge component is a pulled `FileGroupKnowledgeSource` whose metadata mentions the local HTML source. The local path is descriptive provenance, not an upload binding.
- The explicit grounded fallback uses `CreateSearchQuery`, `SearchAndSummarizeContent`, a specific knowledge source, `autoSend: false`, `FullResponse`, and manual Markdown output.
- Full LSP validation accepted all 20 `.mcs.yml` files with zero diagnostics during the audit.

## Identity Lessons

- The `settings.mcs.yml` `schemaName` is the namespace used by dialog, knowledge, and embedded-choice references.
- Two components can share the display label `Greeting` while retaining distinct logical names and filenames.
- Some pulled filenames include an additional `.topic` segment. That segment must not be normalized away.
- Closed-list conditions in Lesson 2 and Lesson 3 use fully qualified generated literals tied to the question-node ID.
- IDs such as `main` can recur in different topics; repository-wide uniqueness is not required.
- `.mcs/botdefinition.json` maps logical identities and component state/status, but it is generated metadata.

## Grounding Lessons

- The source guide contains plan-year dates, eligibility, enrollment, medical, dental, vision, retirement, PTO, additional benefits, contacts, and a governing-document disclaimer.
- The agent instructions deliberately scope answers more narrowly than all subjects present in the source. Source coverage and product scope are separate decisions.
- The knowledge YAML calls the guide authoritative, while the guide says official plan documents govern in a conflict. The source's authority hierarchy must win.
- The guide says users may open a support ticket through the assistant, but the project has no action or workflow implementing ticket creation. The agent must not promise this transaction.
- IT, payroll, and HR business partner redirects appear in behavioral instructions, not in the benefits source. They must be treated as owner-approved policy, not source-grounded facts.

## Routing Lessons

- Two active `OnConversationStart` topics exist.
- Two active `OnUnknownIntent` topics exist: a grounded conversational fallback with explicit priority and a stock fallback with a repeat/escalation path.
- LSP validation does not establish whether one duplicate system handler is selected, multiple handlers run, or what order applies.
- The multiple-topics-matched flow has a "none of these" path that directly begins the stock Fallback dialog, which can bypass the grounded unknown-intent topic.
- Lesson 1, Lesson 2, and Lesson 3 are active retail tutorial topics about store hours, locations, shipping, and computers. Their YAML mechanics are useful, but their content and triggers are outside the HR assistant's declared scope.

## Dialog Lessons

- Lesson 3 uses an empty positive condition branch so allowed states fall through to item selection; the else branch handles a shipping fee.
- A declined fee begins the end-of-conversation dialog while later order actions remain after the condition group. The callee has `startBehavior: CancelOtherTopics` and one reachable `EndConversation` action, but not every response path executes `EndConversation`; runtime testing must establish cancellation, return, and continuation for each path.
- The project uses both embedded closed-list and prebuilt entities, including a prebuilt state entity and Boolean entity. Static quick-reference lists should not be treated as exhaustive.

## Authentication Lessons

- The project combines group-based access control, `authenticationMode: None`, `authenticationTrigger: AsNeeded`, and an `OnSignIn` topic.
- These are distinct layers. Their presence is not proof that every channel has the intended access or sign-in behavior.

## Tests This Project Needs

1. Each benefits domain with direct and paraphrased questions.
2. Plan comparisons and table-value attribution.
3. A multi-turn follow-up to prove query rewriting.
4. Unknown but plausible benefits facts to prove abstention.
5. Requests to open a support ticket to prove no fabricated completion.
6. Questions about additional benefits present in the source but outside the declared instruction scope.
7. Unmatched prompts to identify `OnUnknownIntent` handler count, selection, and order.
8. Conversation start to identify duplicate greeting handler count and order.
9. Ambiguous intent followed by "none of these" to test the direct fallback route.
10. Trigger phrases near the active store/order lessons to detect template interference.
11. Lesson 3 allowed, fee-accepted, and fee-declined paths to prove continuation semantics.
12. Anonymous and authenticated channel checks for the configured access/auth combination.

## Reusable Conclusion

This project demonstrates the central rule of Copilot Studio engineering: syntactically valid components can still form a behaviorally inconsistent agent. Identity preservation, source authority, capability truthfulness, trigger-graph analysis, and runtime tests are all required in addition to YAML validation.