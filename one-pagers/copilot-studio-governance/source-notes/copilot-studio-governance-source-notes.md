# Copilot Studio Governance Baseline for GCC - Source Notes

Working date: 2026-07-23

Audience: New owners, administrators, security reviewers, and delivery teams responsible for Microsoft 365 Copilot agents and standalone Copilot Studio agents.

Cloud scope: Microsoft Government Community Cloud (GCC) only. This page does not describe GCC High or DoD.

## Editorial guardrails

- Use first-party Microsoft documentation only.
- Treat the GCC service description and the Microsoft 365 Copilot service-description availability table as the controlling availability sources.
- Do not infer GCC availability from a worldwide release-plan or commercial administration article.
- Label a feature as conditional when Microsoft documents the control globally but does not explicitly confirm it for GCC.
- Separate recommended governance process from Microsoft product or licensing requirements.
- Do not state that Azure budgets stop PAYG consumption. Microsoft documents budgets as alerts; they do not affect resources or stop consumption.
- Do not state that environment credit allocation is an exact hard stop. The global Copilot Studio capacity documentation distinguishes allocation, overage routing, and per-agent limits.

## Page structure

The one-pager uses three phases and nine ordered actions:

1. Establish control: classify and own, isolate lifecycle environments, enforce DLP and identity.
2. Release safely: review data and connections, standardize build and test, promote with controlled ALM.
3. Publish and sustain: gate sharing/publishing, monitor and respond, fund and review.

The production gate is a governance synthesis. It is not presented as a Microsoft contractual requirement.

## GCC availability decisions

### Confirmed for GCC

- Copilot Studio GCC uses public Microsoft Entra ID for identity functions, including authentication and licensing.
- Agent Builder and declarative agents are available in GCC.
- Generative orchestration is available in Copilot Studio GCC.
- The Teams and Microsoft 365 Copilot channel is available in Copilot Studio GCC.
- GCC approval for Teams publication uses submission to an administrator.
- Power Platform data-policy enforcement applies to all tenants.
- Power Platform solutions are the supported carrier for moving Copilot Studio agents between environments.
- Power Platform CLI is available in GCC and GCC High.
- Power Platform Build Tools for Azure DevOps are available in GCC and GCC High.
- Microsoft Purview controls for Microsoft 365 Copilot and Copilot Chat are available in GCC, subject to the applicable Purview licensing.

### Explicitly unavailable or excluded

- Triggers/autonomous agents are not available in Copilot Studio GCC.
- Generative Answers Enhanced Search is not available in Copilot Studio GCC.
- Azure AI Search as a Copilot Studio knowledge source is not available in GCC.
- Preview answer-generation models are not available in GCC.
- Copilot Studio activity auditing in Microsoft Purview requires that the tenant not be a FedRAMP tenant. Copilot Studio GCC is documented as FedRAMP High, so this audit path is excluded from the baseline.
- The Copilot Studio for Teams plan is not a GCC licensing option. This does not remove the Teams channel from the standalone GCC offering.

### Verify in the target GCC tenant

The following controls have worldwide documentation but no explicit GCC availability statement in the reviewed public documentation:

- Managed Environments as a complete prerequisite. Some Managed Environment features, including weekly usage insights, are explicitly unavailable in sovereign clouds.
- Environment groups and rules.
- Power Platform Pipelines. Use GCC-confirmed PAC CLI or Azure DevOps Build Tools for the baseline.
- Copilot Studio PAYG billing plans and overage routing in Power Platform admin center.
- Copilot Studio environment consumption dashboards and downloadable PAYG detail.
- Tenant-level **Manage Agents**, monthly per-agent Copilot Credit limits, notifications, and hard stops.

These features can be used when they are present and validated in the customer's GCC tenant, but the one-pager does not promise them.

## Evidence by roadmap step

### 1. Classify and assign owners

Recommended control:

- Classify personal/read-only, departmental, and mission-critical agents.
- Assign a business owner, technical owner, backup owner, support contact, risk designation, cost center, and review date.
- Use the lower-risk personal/team lane for read-only productivity use and an IT-managed Copilot Studio lifecycle for broadly shared or action-taking agents.

Evidence:

- Zoned governance identifies personal/team productivity, partnered development, and professional development zones with increasing governance and ALM expectations.
- Microsoft security guidance recommends group-based licensing and access rather than broad individual administration.

Sources:

- Implement a zoned governance strategy: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase2
- Secure your Copilot Studio projects: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase3
- Agents admin guide for Microsoft 365: https://learn.microsoft.com/microsoft-365/copilot/agent-essentials/m365-agents-admin-guide

### 2. Create lifecycle environments

Recommended control:

- Use separate development, test, and production environments for shared agents.
- Restrict each environment with Entra security groups and assign least-privilege Dataverse roles through group teams.
- Keep production maker and administrator access limited.

Evidence:

- Every Copilot Studio agent exists in a Power Platform environment that defines its data boundary, roles, policies, and lifecycle separation.
- Solutions guidance explicitly describes test, limited-user validation, and production environments.
- Security guidance recommends Entra security groups for environment access and group teams for role assignments.

Sources:

- Implement a zoned governance strategy: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase2
- Secure your Copilot Studio projects: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase3
- Create and manage solutions in Copilot Studio: https://learn.microsoft.com/microsoft-copilot-studio/authoring-solutions-overview

### 3. Enforce DLP and identity

Recommended control:

- Require Microsoft Entra authentication for internal agents.
- Apply a tenant baseline data policy and stricter environment policies before makers build.
- Allow only approved knowledge-source types and endpoints, connectors and tools, HTTP endpoints, skills, and channels.
- Test policy enforcement and confirm a violation prevents publishing.

Evidence:

- Data-policy enforcement applies to all tenants.
- Copilot Studio data-policy connectors govern unauthenticated chat, knowledge sources, Power Platform connectors and tools, HTTP, skills, publishing channels, and event triggers. The global documentation also states that blocking Power Platform connectors blocks connected MCP tools, where that capability is available.
- Endpoint filtering can permit or deny specific SharePoint, public website, and HTTP destinations.

Sources:

- Configure data policies for agents: https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention
- Data policies in Power Platform: https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention
- Connector endpoint filtering: https://learn.microsoft.com/power-platform/admin/connector-endpoint-filtering

### 4. Review data and connections

Recommended control:

- Review and correct SharePoint permissions before connecting a site as an agent knowledge source.
- Document the source, endpoint, connection identity, authentication method, secret, third-party processor, and any data-residency exception.
- Prefer delegated user-context access and least-privilege identities.

Evidence:

- The SharePoint knowledge-source integration surfaces only content the signed-in user has permission to access; at least Read permission is required.
- SharePoint authentication scopes do not grant users new content permissions.
- Copilot Studio GCC warns that integrated third-party services can store, transmit, or process data outside Copilot Studio Government protections.

Sources:

- Add SharePoint as a knowledge source: https://learn.microsoft.com/microsoft-copilot-studio/knowledge-add-sharepoint
- Copilot Studio for US Government customers: https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Data, privacy, and security for Microsoft 365 Copilot: https://learn.microsoft.com/microsoft-365-copilot/microsoft-365-copilot-privacy

### 5. Standardize build and test

Recommended control:

- Maintain an agent record with purpose, audience, risk, owners, approved knowledge/tools/endpoints, connection ownership, tests, expected outcomes, failure behavior, support path, release version, and review date.
- Include security, privacy, functional, and abuse-case testing with a limited audience before production review.

Evidence:

- Microsoft security guidance recommends a gated development-to-test-to-production release.
- Solutions guidance describes validating agents in test and with a subset of users before production.

Sources:

- Secure your Copilot Studio projects: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase3
- Create and manage solutions in Copilot Studio: https://learn.microsoft.com/microsoft-copilot-studio/authoring-solutions-overview
- Test your agent: https://learn.microsoft.com/microsoft-copilot-studio/authoring-test-bot

### 6. Promote through controlled ALM

Recommended control:

- Put production agents and dependent components in custom solutions.
- Use connection references and environment variables for target-specific configuration.
- Promote the same approved version from development to test to production.
- Use GCC-supported PAC CLI or Power Platform Build Tools for Azure DevOps when automation is needed.
- Avoid direct production edits.

Evidence:

- Custom solutions are required to export, import, and manage agents between environments.
- Connection references and environment variables hold target-environment connection and configuration values.
- Power Platform Build Tools explicitly support GCC and GCC High and include virtual agents in solution-based ALM.
- PAC CLI explicitly supports GCC and GCC High sovereign regions.

Sources:

- Create and manage solutions in Copilot Studio: https://learn.microsoft.com/microsoft-copilot-studio/authoring-solutions-overview
- Export and import agents using solutions: https://learn.microsoft.com/microsoft-copilot-studio/authoring-solutions-import-export
- Prepopulate connection references and environment variables: https://learn.microsoft.com/power-platform/alm/conn-ref-env-variables-build-tools
- Power Platform Build Tools for Azure DevOps: https://learn.microsoft.com/power-platform/alm/devops-build-tools
- Power Platform CLI: https://learn.microsoft.com/power-platform/developer/cli/introduction
- PAC authentication reference: https://learn.microsoft.com/power-platform/developer/cli/reference/auth

### 7. Gate sharing and publishing

Recommended control:

- Separate Editor and Viewer access.
- Share with approved users or groups only.
- Require owner, security/data, test, support, and funding approval before organization-wide publication.
- Permit only approved channels through data policy.

Evidence:

- Editors can edit, configure, share, publish, and use an agent; Viewers can only use it.
- Data policies can block individual publishing channels.
- The GCC service description confirms the Teams and Microsoft 365 Copilot channel and states that GCC Teams approval currently uses submission to an administrator.

Sources:

- Control how agents are shared: https://learn.microsoft.com/microsoft-copilot-studio/admin-sharing-controls-limits
- Share agents with other users: https://learn.microsoft.com/microsoft-copilot-studio/admin-share-bots
- Configure data policies for agents: https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention
- Copilot Studio for US Government customers: https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Connect and configure an agent for Teams and Microsoft 365: https://learn.microsoft.com/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams

### 8. Monitor, retain, and respond

Recommended control:

- For standalone Copilot Studio agents, configure transcript recording, owner/editor download access, retention, and the separately assigned Bot Transcript Viewer role.
- Enable relevant Dataverse auditing.
- For Microsoft 365 Copilot agents, use GCC-supported Microsoft Purview controls.
- Maintain containment and rollback procedures: remove sharing, block affected channels/connectors/endpoints, revoke connections, preserve available evidence, rotate credentials, and redeploy the last approved solution.

Evidence:

- Standalone-agent transcripts are stored in Dataverse and can be controlled per environment.
- Microsoft 365 Copilot agents do not write conversation transcripts to the Copilot Studio Dataverse transcript table.
- Copilot Studio Purview activity logging requires a non-FedRAMP tenant and is therefore excluded from the GCC baseline.
- The Microsoft 365 Copilot service-description table marks Purview controls as available in GCC.

Sources:

- Control transcript access and retention: https://learn.microsoft.com/microsoft-copilot-studio/admin-transcript-controls
- Conversation transcripts: https://learn.microsoft.com/microsoft-copilot-studio/analytics-transcripts-powerapps
- Enable and use comprehensive auditing: https://learn.microsoft.com/power-platform/admin/enable-use-comprehensive-auditing
- Audit Copilot Studio activities in Microsoft Purview: https://learn.microsoft.com/microsoft-copilot-studio/admin-logging-copilot-studio
- Microsoft 365 Copilot service description: https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot

### 9. Fund, meter, and review

Recommended control:

- Assign a capacity owner and internal cost center for each production environment.
- Choose prepaid packs, PAYG, or prepaid plus PAYG overage based on expected demand and continuity requirements, subject to availability in the target GCC tenant.
- Allocate prepaid Copilot Credits from the tenant pool to environments.
- Decide whether an environment can draw from remaining tenant capacity, bill a linked PAYG plan, or have no overage fallback.
- Treat environment allocation as a budget assignment, not an exact hard stop.
- Configure consumption notifications and monthly per-agent hard stops where the controls are available.
- Use Azure budgets for cost notification only; they do not stop PAYG consumption.
- Review ownership, access, data, tools, connections, channels, DLP, transcript settings, consumption, and continued business need monthly or quarterly.

Evidence and boundary:

- The GCC service description states that government licensing is the same as public cloud and is sold through Volume Licensing and CSP.
- Copilot Studio licensing confirms the GCC plan and describes Copilot Credits.
- Prepaid Copilot Credits are pooled across the tenant and can be assigned to environments.
- Worldwide capacity documentation describes environment allocation, PAYG, overage routing, environment reports, notifications, and per-agent limits, but it does not explicitly state that these administration experiences are available in GCC.
- When prepaid capacity has no fallback and is exhausted, the workload enters overage and is subject to enforcement; Microsoft documents a grace threshold rather than an exact stop at the environment allocation.
- Monthly prepaid consumption resets on the first day of the month. Overage isn't documented as a balance deducted from the next month's allocation.
- PAYG continues billing consumed credits to Azure until usage or the billing configuration is stopped.
- Azure Cost Management budgets send alerts but do not stop resources or consumption.

Sources:

- Copilot Studio for US Government customers: https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Copilot Studio licensing: https://learn.microsoft.com/microsoft-copilot-studio/billing-licensing
- Manage Copilot Studio credits and capacity: https://learn.microsoft.com/power-platform/admin/manage-copilot-studio-messages-capacity
- Power Platform pay-as-you-go plan and billing-plan scope: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-overview
- Copilot Studio billing FAQ: https://learn.microsoft.com/microsoft-copilot-studio/faq-billing-licensing
- Create and manage Azure budgets: https://learn.microsoft.com/azure/cost-management-billing/costs/tutorial-acm-create-budgets

## GCC feature references

- Copilot Studio GCC service description and limitations: https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Microsoft 365 Copilot GCC feature availability: https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot
- Agent Builder regional availability: https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-regional-availability
- Declarative agent national-cloud support: https://learn.microsoft.com/microsoft-365/copilot/extensibility/overview-declarative-agent#national-cloud-support
- US government Microsoft 365 Copilot overview: https://learn.microsoft.com/microsoft-365/copilot/gov-overview

## Content intentionally omitted from the one-pager

- Autonomous agents and event-trigger governance, because autonomous agents are not available in GCC.
- Azure AI Search knowledge-source governance, because the knowledge source is not available in GCC.
- Copilot Studio authoring/activity events in Purview, because the documented prerequisite excludes FedRAMP tenants.
- Copilot Control System and tenant agent registry workflows, because reviewed public sources do not explicitly confirm them for GCC.
- Environment groups/rules and Power Platform Pipelines as baseline requirements, because explicit GCC confirmation was not found.
- Any statement that PAYG, environment capacity dashboards, or tenant per-agent hard stops are available in every GCC tenant.