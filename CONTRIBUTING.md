# Contributing

Contributions are welcome when they improve accuracy, portability, or verified
coverage.

## Evidence Standard

Every technical claim must be grounded in at least one of these sources:

1. Current first-party Microsoft documentation.
2. Target metadata that was retrieved and inspected.
3. Runtime behavior reproduced in a deployed site.

Label unverified ideas as assumptions or proposals. An HTTP success response by
itself is not proof that the portal runtime honored a change.

## Privacy And Security

Never commit:

- Tenant, environment, organization, subscription, website, app, record, role,
  or component IDs from a real deployment.
- Customer, employer, user, contact, account, or organization names.
- Environment, Dataverse, SharePoint, or portal URLs from a real tenant.
- Email addresses, usernames, passwords, tokens, secrets, upload URLs, or keys.
- Screenshots or logs that expose any of the above.

Use explicit placeholders such as `<environment-url>`, `<website-id>`,
`<relationship-schema-name>`, and `<portal-graph-client-id>`.

## Updating The Skill

1. Edit the canonical files under `skills/power-pages-code-site/`.
2. Keep `SKILL.md` compact. Put detailed knowledge in `references/`.
3. Run `node scripts/validate-skill.mjs`.
4. Update `CHANGELOG.md`.
5. Bump `VERSION` using semantic versioning:
   - Patch: corrections or clearer guidance.
   - Minor: a new validated workflow or integration.
   - Major: a breaking package or workflow change.
6. Open a pull request describing documentation evidence and runtime evidence
   separately.

## Release

After merging, create and push the matching tag:

```text
power-pages-code-site-v<version>
```

The release workflow validates the package and publishes
`power-pages-code-site.zip`.
