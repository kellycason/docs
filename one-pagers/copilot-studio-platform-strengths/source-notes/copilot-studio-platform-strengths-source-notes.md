# Copilot Studio Decision Guide — Source Notes

Working date: 2026-07-13
Audience framing: shareable Microsoft Copilot Studio decision guide for customers.
Constraints honored: use Microsoft platform capabilities only; back claims with public Microsoft documentation; same theme and hosting pattern as existing one-pagers.

## Content framing

- Content should focus on business value customers can read directly: meeting users in familiar channels, connecting governed business context, taking action, supporting voice, orchestrating agents, governing the lifecycle, measuring outcomes, and enabling low-code + pro-code collaboration.
- Avoid vendor-negative framing; keep the page focused on Microsoft capabilities and customer outcomes.

## Public-documentation-backed claims

- **Agent creation and planning**: Copilot Studio supports creating agents by describing instructions, triggers, knowledge sources, and tools in plain language, then testing and publishing across channels. Source: Copilot Studio overview.
- **Publishing channels**: Copilot Studio can deploy agents to channels such as Teams, Microsoft 365 Copilot, SharePoint, Power Pages, websites/custom applications, and more. Source: Publish agents to channels and clients.
- **Voice and IVR**: When used with Dynamics 365 Contact Center or Dynamics 365 Customer Service voice capabilities, Copilot Studio can author Interactive Voice Response (IVR) agents. Documented capabilities include speech and DTMF input, SSML voice output, audio files, barge-in, generative orchestration, constrained speech recognition, call transfer, and call termination. Source: Set up IVR agents in the voice channel using Copilot Studio.
- **Connectors and actions**: Power Platform connectors act as API wrappers and enable Copilot Studio, Power Automate, Power Apps, and Azure Logic Apps to communicate with apps and services. Connectors can be used as tools, actions in agent flows, and knowledge sources. Source: Use Power Platform connectors as tools.
- **Dataverse operational data**: Dataverse securely stores and manages business data and processes used by Power Platform applications. Copilot Studio can use Dataverse as knowledge and through tools/actions for operational agent scenarios. Sources: What is Microsoft Dataverse and Copilot Studio overview.
- **Agent orchestration and autonomy**: Copilot Studio supports specialized/connected agents and autonomous agents that use triggers, instructions, permissions, flows, and guardrails to respond to events and execute work. Feature maturity and availability vary by agent experience and connected-agent type. Sources: Design autonomous agent capabilities and Add other agents overview.
- **Data policies and governance**: Data policies govern how agents connect and interact with data and services within and outside the organization; admins configure Copilot Studio and Power Platform data policies in Power Platform admin center. Source: Configure data policies for agents.
- **Governance controls**: Copilot Studio governance documentation describes ALM, connector governance, environment-level DLP/RBAC/auditing, flexible deployment, sharing controls, publishing oversight, Power Platform admin center management, Purview, telemetry, and usage analytics. Source: Microsoft 365 Copilot extensibility / Copilot Studio experience search result.
- **Application lifecycle management**: Copilot Studio uses Power Platform solutions and supports development, test, and production environment strategies, pipelines, Azure DevOps, GitHub Actions, source control, and automated deployment approaches. Source: Establish an application lifecycle management strategy.
- **Analytics and optimization**: Copilot Studio includes built-in analytics and KPIs for usage, engagement, session outcomes, feedback, and channel-level analysis, plus options for custom reports and Application Insights telemetry. Sources: Measure and improve agent performance with KPIs and analytics; Monitor operations, compliance, and capacity.
- **Microsoft 365 Copilot connectors**: Copilot connectors bring external line-of-business data into Microsoft 365 Copilot; synced connectors index into Microsoft Graph, while federated connectors retrieve content in real time through MCP. Source: Microsoft 365 Copilot connectors overview.

## Source links used

- Copilot Studio overview: https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio
- Publish agents to channels and clients: https://learn.microsoft.com/microsoft-copilot-studio/guidance/channels
- Set up IVR agents in the voice channel using Copilot Studio: https://learn.microsoft.com/dynamics365/customer-service/administer/voice-channel-pva-bots
- Use Power Platform connectors as tools: https://learn.microsoft.com/microsoft-copilot-studio/advanced-connectors
- What is Microsoft Dataverse: https://learn.microsoft.com/power-apps/maker/data-platform/data-platform-intro
- Design autonomous agent capabilities: https://learn.microsoft.com/microsoft-copilot-studio/guidance/autonomous-agents
- Add other agents overview: https://learn.microsoft.com/microsoft-copilot-studio/authoring-add-other-agents
- Configure data policies for agents: https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention
- Establish an application lifecycle management strategy: https://learn.microsoft.com/microsoft-copilot-studio/guidance/alm
- Measure and improve agent performance with KPIs and analytics: https://learn.microsoft.com/microsoft-copilot-studio/guidance/analytics
- Monitor operations, compliance, and capacity: https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase5
- Microsoft 365 Copilot connectors overview: https://learn.microsoft.com/microsoft-365/copilot/extensibility/overview-copilot-connector
- Choose between Microsoft 365 Copilot and Copilot Studio to build your agent: https://learn.microsoft.com/microsoft-365/copilot/extensibility/copilot-studio-experience