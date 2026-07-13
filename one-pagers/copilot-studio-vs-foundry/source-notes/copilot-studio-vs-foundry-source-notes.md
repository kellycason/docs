# Copilot Studio vs. Microsoft Foundry — Source Notes

Working date: 2026-07-13
Audience framing: US State & Local Government customers in the Government Community Cloud (GCC).
Constraints honored: high-level; when-to-use guidance; no cost comparison; strengths only (no weaknesses); same theme + hosting as the pricing one-pager.

## Positioning (grounded in Microsoft Learn)

- **Copilot Studio** = low-code SaaS to build/customize/deploy conversational and task agents via a visual canvas + natural language; extends Microsoft 365 Copilot; 1,000+ connectors; Power Platform governance (DLP, managed environments); generative orchestration; publish to Teams/SharePoint/web.
- **Microsoft Foundry** = unified Azure PaaS for pro-code AI apps/agents; broad model catalog (incl. Azure OpenAI) with fine-tuning and evaluations; multi-agent orchestration via SDKs; large tool catalog; tracing/observability; responsible-AI guardrails; publish to M365/Teams/containers.
- **Not either/or**: Foundry agents/models can be surfaced in Microsoft 365 and Teams; Copilot Studio can call custom models/tools. Many solutions combine both.

## When to use which (CAF "Technology plan for AI agents")

- Copilot Studio (SaaS, low-code): speed, maker/business-led, conversational/task agents, extend M365, prebuilt connectors.
- Foundry (PaaS, pro-code): custom code-first apps, choose/fine-tune models, advanced orchestration, deep Azure integration, developer/data-scientist owned.

## Government cloud availability

- **Copilot Studio GCC**: available; FedRAMP High; customer content stored in the US and physically separated; GCC / GCC High / DoD options. Source: requirements-licensing-gcc.
- **Microsoft Foundry in Azure Government**: available in US Gov Virginia and US Gov Arizona; Azure OpenAI models (GPT-5.1, GPT-4.1, o-series, GPT-4o), guardrails, RBAC, private networking, tracing; Foundry Agent Service available with a subset of features. Source: foundry-azure-government.
- Feature/model availability differs by environment and region (kept as a neutral "varies / confirm" note, not a weakness call-out).

## Source links used

- Copilot Studio overview: https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio
- What is Microsoft Foundry: https://learn.microsoft.com/azure/foundry/what-is-foundry
- Choose an AI agent build path (CAF): https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/technology-solutions-plan-strategy
- Copilot Studio for US Government (GCC): https://learn.microsoft.com/microsoft-copilot-studio/requirements-licensing-gcc
- Microsoft Foundry in Azure Government: https://learn.microsoft.com/azure/foundry/concepts/foundry-azure-government
