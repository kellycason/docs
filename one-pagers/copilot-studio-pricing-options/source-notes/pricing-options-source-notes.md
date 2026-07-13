# Copilot Studio Pricing Options - Source Notes

Working date: 2026-07-13
Primary attached source documents:
- Microsoft Copilot Studio Licensing Guide, July 2026
- Microsoft Copilot Credits Guide, July 2026

Official Microsoft resource links used in the one-pager:
- Copilot Studio licensing: https://learn.microsoft.com/microsoft-copilot-studio/billing-licensing
- Microsoft Copilot Studio Licensing Guide: https://go.microsoft.com/fwlink/?linkid=2320995
- Copilot Credit Guide: https://go.microsoft.com/fwlink/?linkid=2368800
- Billing rates and management: https://learn.microsoft.com/microsoft-copilot-studio/requirements-messages-management
- Manage Copilot Studio credits and capacity: https://learn.microsoft.com/power-platform/admin/manage-copilot-studio-messages-capacity
- Copilot Credit Pre-Purchase Plan: https://learn.microsoft.com/azure/cost-management-billing/reservations/copilot-credit-p3
- Copilot Studio agent usage estimator: https://microsoft.github.io/copilot-studio-estimator/
- Power Platform pay-as-you-go overview: https://learn.microsoft.com/power-platform/admin/pay-as-you-go-overview
- Power Platform admin center: https://admin.powerplatform.microsoft.com/
- Microsoft 365 admin center: https://admin.microsoft.com/

Key source facts captured:
- Copilot Credits are the common usage currency for Copilot Studio capabilities.
- Usage depends on agent design, volume, complexity, orchestration, knowledge, tools, actions, and voice configuration.
- Credits are pooled at tenant level and can be allocated/managed across environments.
- Pay-as-you-go is billed in arrears at $0.01 per Copilot Credit and is linked through an Azure subscription/billing policy.
- Copilot Credit Pre-Purchase Plan P3 is a one-year upfront purchase with tiered discounts from 5% to 20%; unused credits expire at term end.
- Microsoft Agent Pre-Purchase Plan P3 uses Agent Commit Units for eligible Copilot Studio and Microsoft Foundry usage; 1 ACU equals $1 of eligible usage or 100 Copilot Credits.
- Copilot Studio credit packs are $200 per pack/month, billed annually; 1 pack equals 25,000 Copilot Credits/month; unused monthly credits do not roll over.
- Microsoft 365 Copilot is $30 per user/month and includes Microsoft 365 Copilot experiences and certain employee-facing Copilot Studio agent usage, subject to fair usage limits.
- Work IQ APIs used by Copilot Studio agents are not included in the Microsoft 365 Copilot User SL and consume Copilot Credits.
- Dataverse for Copilot Studio default tenant capacity in the July 2026 guide: 15 GB database, 20 GB file, 2 GB log.

Content gaps worth covering in customer discussions:
- Expected user population and interaction volume.
- Internal vs external audience/channel requirements.
- Whether the solution needs premium/custom connectors, AI tools, voice, Work IQ APIs, or agent flows.
- Governance: environment strategy, DLP, spend policies, monthly limits, alerts, and hard stops.
- Whether usage should be covered by monthly packs, annual commitment, pay-as-you-go, or a combination.