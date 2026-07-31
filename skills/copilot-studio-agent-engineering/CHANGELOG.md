# Changelog

All notable changes to the Copilot Studio Agent Engineering Skill are documented here.

This project uses [Semantic Versioning](https://semver.org/).

## 1.1.1 - 2026-07-31

### Added

- Closed-list Choice vs String comparison guidance: an `EmbeddedEntity`/`ClosedListEntity` `Question` variable is a Choice/EmbeddedOptionSet, so hand-authored `ConditionGroup` conditions must coerce with `Text(Topic.Var) = "Label"` (with each item `id` equal to its `displayName`). A bare string comparison fails strict (GCC) validation with `Incompatible type comparison. Type: String, expected: EmbeddedOptionSet`.

## 1.1.0 - 2026-07-31

### Added

- Conversational `FilePrebuiltEntity` and native Power Automate file-object contract guidance.
- Registered flow-tool identity, persisted-schema verification, deterministic binding, and review-before-commit workflow.
- Transaction test matrix covering decline, confirmation, duplicate send, exactly-once writes, and generated identifiers.
- Sovereign endpoint discovery, validator health gate, endpoint-specific 403 handling, and portal code-editor fallback.
- Direct Line attachment evidence chain from browser `blob:` read through upload, activity, topic, and flow execution.
- Sanitized document-intake transaction case study based on a fully verified synthetic end-to-end build.

### Changed

- Completion criteria now distinguish blocked full-LSP validation from portal and runtime evidence.
- Authentication checks now require remote, published, and channel-state verification rather than local YAML alone.

## 1.0.0 - 2026-07-30

### Added

- Installable Agent Skill package with progressive reference loading.
- Source-fact, behavioral-policy, implemented-capability, and platform-state separation.
- Copilot Studio YAML identity, grounding, routing, dialog-stack, lifecycle, and verification guidance.
- Uploaded-file knowledge provenance and schema/LSP/runtime validation boundaries.
- Field-tested HR benefits agent case study and grounded-agent test matrix.
- Workspace and global installation guidance for PowerShell and Bash.