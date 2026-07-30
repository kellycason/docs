# Identity and Authoring

## Project Anatomy Is Discovered, Not Assumed

Start from `**/agent.mcs.yml`. A project can contain:

- `agent.mcs.yml`
- `settings.mcs.yml`
- `topics/`
- `knowledge/`
- `actions/`
- `variables/`
- `agents/`
- `workflows/`
- `.mcs/` synchronization metadata

Folders are optional. Inventory actual components rather than creating missing folders to satisfy a canonical diagram.

## Identity Layers

| Value | Meaning | Rule |
|---|---|---|
| `settings.mcs.yml` `schemaName` | Agent namespace | Read first; never change or invent it. |
| `mcs.metadata.componentName` | Human display label | Not a unique identifier. Duplicate labels can exist. |
| Filename | Pulled local representation | Preserve it. A `.topic` segment may be meaningful. |
| Logical/schema name | Cross-component identity | Copy exactly from pulled metadata or an existing reference. |
| Node `id` | Identity within an action tree | Preserve existing IDs. Generate only for new nodes. |

Never derive a logical name from a display name. Never rename a pulled file merely to make naming consistent.

## Cross-Component References

Dialog and knowledge references omit `.mcs.yml` and use the exact logical name:

```yaml
dialog: <schemaName>.topic.EndofConversation
```

```yaml
knowledgeSources:
  kind: SearchSpecificKnowledgeSources
  knowledgeSources:
    - <schemaName>.topic.BenefitsGuide
```

Resolve the value from an existing reference, clone metadata, or LSP output. A specialist may also define a pulled filename without `.mcs.yml` as the serialized logical identity; use that convention only when explicit, without normalization. A passing YAML parser cannot detect every wrong-but-well-formed identifier; full LSP validation is required.

## Embedded Closed-List Choices

The runtime value of an embedded closed-list entity is not necessarily its display string. Pulled topics compare it to a generated option-set literal qualified by topic, trigger, and question-node identity:

```yaml
condition: =Topic.Location = '<schemaName>.topic.StoreLocator.main.questionNode'.'Redmond'
```

Preserve the entire literal. Do not simplify it to:

```yaml
condition: =Topic.Location = "Redmond"
```

If the question node or option is recreated, regenerate or re-resolve all dependent conditions and validate the full project.

## Variables and Node Contracts

- `Topic.*` values are local to the topic.
- `Global.*` values require global variable components and last for the conversation.
- `System.*` values are platform-provided and often trigger-specific.
- `init:Topic.*` appears on many first assignments, but output-bound variables and some node contracts omit it. Inspect the schema and nearby pulled examples rather than applying `init:` mechanically.
- Preserve value types. Prebuilt entities may yield Boolean, option, date, or record values rather than text.

Static reference tables and the extension's bundled schema are aids, not exhaustive platform contracts. For example, a pulled and LSP-valid project can use an entity not listed in a static quick-reference table. Use schema lookup while drafting, then run full LSP validation against the connected environment.

## Node IDs

IDs must be valid and unique in the scope required by the component/action tree. They do not need repository-wide uniqueness: `main` and generated question IDs can legitimately recur in separate topics.

Rules:

1. Preserve every existing ID during an edit.
2. Generate a fresh ID for each new node and condition item.
3. Do not rename IDs for readability; choice literals and hidden references may depend on them.
4. Let full LSP validation identify actual collisions.

## Generated Metadata

`.mcs/botdefinition.json` can help map display names to logical names and show component state/status. Use it to answer ambiguity, not as the authoring surface. It is generated synchronization metadata.

Do not hand-edit:

- `.mcs/botdefinition.json`;
- row/version metadata;
- platform-managed timestamps;
- pulled schema names;
- template or language identifiers merely to make a local edit work.

## Minimal Edit Discipline

- Read the target component and its direct dependents.
- Preserve platform-generated headers, encoding, byte-order marks, and line endings where possible.
- Do not reformat unrelated YAML.
- Do not copy a whole tutorial topic when one verified node pattern is enough.
- After a portal edit, pull again. UI round-tripping can rewrite generated identities or remove YAML-only fields.