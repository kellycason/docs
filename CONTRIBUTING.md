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

## Updating Content

1. Edit the applicable one-pager under `one-pagers/<name>/`.
2. Keep the web page (`index.html`) and any exported `pdf/` in sync.
3. Open a pull request describing the documentation evidence.

Installable agent skills now live in the
[Power Platform Vibe Code Library](https://github.com/kellycason/vibe-code-library).

