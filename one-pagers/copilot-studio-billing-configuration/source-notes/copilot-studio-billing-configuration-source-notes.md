# Copilot Studio Billing Configuration - Source Notes

Working date: 2026-07-23

Audience: Administrators, agent owners, finance teams, and agency program managers choosing how Copilot Studio usage is funded and controlled.

Cloud scope: Microsoft Government Community Cloud (GCC) planning. Prepaid Copilot Studio licensing is documented for GCC. Validate PAYG and the newer Power Platform capacity-management controls in the target GCC tenant before making operational commitments.

## Editorial guardrails

- Copilot Credits are usage units; one user request can consume multiple credits depending on the features used.
- Prepaid credits are pooled at the tenant level and can be allocated to environments.
- An environment allocation assigns prepaid credits; it doesn't stop usage at the allocated amount.
- When no fallback is configured, prepaid custom-agent usage can enter overage and is subject to Microsoft enforcement. Public documentation describes a grace threshold rather than an immediate stop at 100% of the environment allocation.
- Monthly prepaid consumption resets on the first day of the month.
- While PAYG is linked, billable usage is charged to the Azure subscription. Removing the environment from the billing plan stops future Azure charges but does not itself turn off the agent; continued operation depends on another entitlement or capacity path.
- Azure budgets alert; they do not stop resources or consumption.
- Qualifying employee-facing use by an authenticated Microsoft 365 Copilot licensed user is zero-rated only within the documented inclusion boundary and fair-use limits. Nonincluded scenarios follow the configured Copilot Credit path.

## Billing configurations

### Prepaid only, no fallback

- Capacity source: prepaid Copilot Credits purchased into the tenant pool and allocated to an environment.
- At exhaustion: for general custom-agent usage, Microsoft documents enforcement when the tenant reaches 125% of prepaid capacity. An active conversation can finish; affected custom agents are then disabled until capacity is added or reset. Agent flows are enforced separately when prepaid capacity is exhausted.
- Azure charge: none.
- Stop behavior: automatic at documented tenant thresholds, not at the environment allocation.

### Prepaid with tenant spillover

- Capacity source: the environment allocation plus available tenant capacity.
- At exhaustion: the environment can draw from the remaining tenant pool, which reduces capacity available to other environments.
- Azure charge: none.
- Stop behavior: subject to documented tenant-level prepaid enforcement; agent-flow enforcement is handled separately.

### PAYG only

- Capacity source: an Azure-linked Power Platform billing plan.
- At exhaustion: there is no finite prepaid allocation to exhaust; billable credits continue to meter to Azure.
- Azure charge: all billable usage.
- Stop behavior: Azure budgets alert only. Turning off the agent stops activity. Removing PAYG stops future Azure charges but doesn't itself turn off the agent.

### Prepaid with PAYG overage

- Capacity source: an environment prepaid allocation followed by PAYG for overage.
- At exhaustion: additional billable credits are charged to Azure, providing continuity.
- Azure charge: overage only.
- Stop behavior: Azure budgets alert only. Turning off the agent stops activity. Removing PAYG stops future Azure charges but doesn't itself turn off the agent.

### Microsoft 365 Copilot licensed-user inclusion

- Employee-facing Copilot Studio use is included when the interacting user has a Microsoft 365 Copilot license and the agent operates using that authenticated user's identity, within the documented inclusion boundary.
- Agent-flow inclusion applies only to flows invoked through **When an agent calls the flow** under the licensed user's identity.
- Computer-using agents and other excluded scenarios consume credits through the configured prepaid or PAYG path.
- Inclusion is subject to fair-use limits and isn't a departmental budget cap.

## Controls

- **Environment allocation:** assigns prepaid credits from the tenant pool to an environment.
- **Draw from tenant capacity:** permits an environment to use available shared prepaid capacity after its allocation.
- **Bill to PAYG:** sends applicable overage to the linked Azure subscription.
- **Azure budget:** evaluates actual or forecasted cost and sends alerts; it doesn't stop consumption.
- **Disable or disconnect:** turning off an agent stops activity. Removing the environment from PAYG stops future Azure charges through that path but doesn't itself turn off the agent; continued operation depends on another entitlement or capacity path.

## Official Microsoft sources

- Copilot Studio licensing: https://learn.microsoft.com/microsoft-copilot-studio/billing-licensing
- Billing rates and management: https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management
- Manage Copilot Studio credits and capacity: https://learn.microsoft.com/power-platform/admin/manage-copilot-studio-messages-capacity
- Copilot Studio billing FAQ: https://learn.microsoft.com/microsoft-copilot-studio/faq-billing-licensing
- Power Platform PAYG overview: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-overview
- Set up Power Platform PAYG: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-set-up
- View PAYG usage and billing: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-usage-costs
- Create and manage Azure budgets: https://learn.microsoft.com/azure/cost-management-billing/costs/tutorial-acm-create-budgets
- Copilot Studio for US Government customers: https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Copilot Credit Guide: https://go.microsoft.com/fwlink/?linkid=2368800