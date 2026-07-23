# Copilot Studio Billing Configuration - Source Notes

Working date: 2026-07-23

Audience: Administrators, agent owners, finance teams, and agency program managers choosing how Copilot Studio usage is funded and controlled.

Cloud scope: Microsoft Government Community Cloud (GCC) planning. Prepaid Copilot Studio licensing is documented for GCC. Validate PAYG and the newer Power Platform capacity-management controls in the target GCC tenant before making operational commitments.

## Editorial guardrails

- Copilot Credits are usage units; one user request can consume multiple credits depending on the features used.
- Prepaid credits are pooled at the tenant level and can be allocated to environments.
- An environment allocation is not an exact hard stop.
- When no fallback is configured, prepaid custom-agent usage can enter overage and is subject to Microsoft enforcement. Public documentation describes a grace threshold rather than an immediate stop at 100% of the environment allocation.
- Monthly prepaid consumption resets on the first day of the month. Public documentation does not describe overage as a debt deducted from the next month's allocation.
- PAYG usage is billed to the linked Azure subscription and continues until usage, the agent, a per-agent limit, or the billing path is stopped.
- Azure budgets alert; they do not stop resources or consumption.
- Per-agent monthly limits can provide notifications and a hard stop where the control is available.
- When both tenant spillover and PAYG are selected, public documentation says one or both options can be chosen but does not state a guaranteed consumption priority. Do not invent one.
- Qualifying employee-facing use by an authenticated Microsoft 365 Copilot licensed user is zero-rated only within the documented inclusion boundary and fair-use limits. Nonincluded scenarios follow the configured Copilot Credit path.

## Billing configurations

### Prepaid only, no fallback

- Capacity source: prepaid Copilot Credits purchased into the tenant pool and allocated to an environment.
- At exhaustion: the environment enters overage with no PAYG fallback and becomes subject to capacity enforcement.
- Azure charge: none.
- Stop behavior: not an exact hard stop at the environment allocation.

### Prepaid with tenant spillover

- Capacity source: the environment allocation plus available tenant capacity.
- At exhaustion: the environment can draw from the remaining tenant pool, which can reduce capacity available to other environments or agencies.
- Azure charge: none.
- Stop behavior: subject to prepaid enforcement after applicable capacity is exhausted; not an exact environment cap.

### PAYG only

- Capacity source: an Azure-linked Power Platform billing plan.
- At exhaustion: there is no finite prepaid allocation to exhaust; billable credits continue to meter to Azure.
- Azure charge: all billable usage.
- Stop behavior: no aggregate environment hard cap; use per-agent limits where available or disable the agent/billing path.

### Prepaid with PAYG overage

- Capacity source: an environment prepaid allocation followed by PAYG for overage.
- At exhaustion: additional billable credits are charged to Azure, providing continuity.
- Azure charge: overage only.
- Stop behavior: no aggregate environment hard cap; use per-agent limits where available.

### Prepaid with both fallback options

- Capacity source: the environment allocation, available tenant capacity, and a linked PAYG plan.
- At exhaustion: both tenant capacity and PAYG can cover overage. Public documentation doesn't state a guaranteed priority between the two fallback choices.
- Azure charge: PAYG-billed portion only.
- Stop behavior: no aggregate environment hard cap; this is the least strict agency allocation model.

### Microsoft 365 Copilot licensed-user inclusion

- Employee-facing Copilot Studio use is included when the interacting user is authenticated with a Microsoft 365 Copilot license and the scenario is within the documented inclusion boundary.
- Agent-flow inclusion applies only to flows invoked through **When an agent calls the flow** under the licensed user's identity.
- Computer-using agents and other excluded scenarios consume credits through the configured prepaid or PAYG path.
- Inclusion is subject to fair-use limits and isn't a departmental budget cap.

## Controls

- **Environment allocation:** assigns a planned share of prepaid tenant capacity; it isn't an exact hard stop.
- **Draw from tenant capacity:** permits an environment to use available shared prepaid capacity after its allocation.
- **Bill to PAYG:** sends applicable overage to the linked Azure subscription.
- **Azure budget:** evaluates actual or forecasted cost and sends alerts; it doesn't stop consumption.
- **Per-agent monthly limit:** provides notifications and can automatically turn off the agent at the configured limit where available.
- **Disable or disconnect:** stopping an agent prevents its usage; unlinking PAYG stops future billing through that path, assuming another valid capacity path exists.

## Recommended patterns

- **Strict agency control:** prepaid without tenant spillover, plus per-agent monthly limits where available.
- **Shared central pool:** prepaid with tenant spillover; monitor cross-environment consumption closely.
- **Clean chargeback:** one billing plan per agency, linked to that agency's environments and Azure cost-center structure.
- **Business continuity:** prepaid baseline plus agency-specific PAYG overage, Azure budget alerts, and per-agent limits for extreme usage.

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