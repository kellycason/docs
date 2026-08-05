/*
 * Rebuilds the attached 10-slide legacy deck as a modern themed PPTX.
 * Preserves its layouts and wording, applies the M365 Copilot visual language,
 * and uses official product icons supplied in the working deck.
 *
 * Run from repo root:
 *   $env:NODE_PATH = (npm root -g); node .\presentations\copilot-studio-productivity-processes-themed-v2\build-themed-v2.js
 */
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");
const {
  MdMenuBook,
  MdOutlinePsychology,
  MdBolt,
  MdPublic,
  MdChatBubbleOutline,
  MdTaskAlt,
  MdOutlineDocumentScanner,
  MdSchema,
  MdOutlineAnalytics,
  MdGroups,
  MdLockOutline,
  MdSupportAgent,
  MdSearch,
  MdRoute,
  MdConfirmationNumber,
} = require("react-icons/md");

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "Kelly Cason";
pptx.company = "Microsoft";
pptx.subject = "Copilot Studio: From AI-Powered Productivity to AI-Powered Processes";
pptx.title = "Copilot Studio - From Productivity to Processes - Themed v2";
pptx.lang = "en-US";
pptx.theme = { headFontFace: "Segoe UI Semibold", bodyFontFace: "Segoe UI", lang: "en-US" };

const C = {
  ink: "091F2C",
  bg: "F2F1F7",
  white: "FFFFFF",
  blue: "0078D4",
  magenta: "C03BC4",
  peach: "FFA38B",
  purple: "8661C5",
  sky: "8DC8E8",
  coral: "FF5C39",
  muted: "5B6672",
  soft: "C8D8E5",
  line: "E7E5F0",
  paleBlue: "EAF4FB",
  palePurple: "ECEAF6",
  panel2: "142E40",
  panel3: "18354A",
  footer: "9AA3AD",
};
const GRAD = [C.blue, C.purple, C.magenta];
const HEAD = "Segoe UI Semibold";
const BODY = "Segoe UI";
const ROOT = path.resolve(__dirname, "..");
const LOGOS = path.join(ROOT, "copilot-studio-better-together", "Logos and Images");
const OUT = path.join(__dirname, "Copilot Studio - From Productivity to Processes - Themed v2.pptx");
const DPI = 220;

function makeShadow() {
  return { type: "outer", color: "8A83B0", opacity: 0.18, blur: 5, angle: 90, distance: 2 };
}
function deepShadow() {
  return { type: "outer", color: "5C5776", opacity: 0.22, blur: 7, angle: 90, distance: 3 };
}
function gradDir(angle) {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  return {
    x1: (0.5 - dx * 0.5) * 100,
    y1: (0.5 - dy * 0.5) * 100,
    x2: (0.5 + dx * 0.5) * 100,
    y2: (0.5 + dy * 0.5) * 100,
  };
}
function stops(colors) {
  return colors.map((color, index) => `<stop offset="${(index / (colors.length - 1)) * 100}%" stop-color="#${color}"/>`).join("");
}
async function gradientRect(wIn, hIn, colors = GRAD, angle = 0, radiusFraction = 0.15) {
  const width = Math.max(8, Math.round(wIn * DPI));
  const height = Math.max(8, Math.round(hIn * DPI));
  const radius = Math.round(Math.min(width, height) * radiusFraction);
  const direction = gradDir(angle);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="${direction.x1}%" y1="${direction.y1}%" x2="${direction.x2}%" y2="${direction.y2}%">${stops(colors)}</linearGradient></defs><rect width="${width}" height="${height}" rx="${radius}" fill="url(#g)"/></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `image/png;base64,${png.toString("base64")}`;
}
async function glow(wIn, hIn, color, alpha = 0.45) {
  const width = Math.round(wIn * 120);
  const height = Math.round(hIn * 120);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="r"><stop offset="0%" stop-color="#${color}" stop-opacity="${alpha}"/><stop offset="100%" stop-color="#${color}" stop-opacity="0"/></radialGradient></defs><rect width="${width}" height="${height}" fill="url(#r)"/></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `image/png;base64,${png.toString("base64")}`;
}
async function officialLogo(file) {
  const fullPath = path.join(LOGOS, file);
  const png = await sharp(fullPath).resize(512, 512, { fit: "contain" }).png().toBuffer();
  return `image/png;base64,${png.toString("base64")}`;
}
async function iconTile(Icon, colors = GRAD, angle = 130, size = 300) {
  const radius = Math.round(size * 0.26);
  const direction = gradDir(angle);
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><linearGradient id="g" x1="${direction.x1}%" y1="${direction.y1}%" x2="${direction.x2}%" y2="${direction.y2}%">${stops(colors)}</linearGradient></defs><rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/></svg>`;
  const tileBuffer = await sharp(Buffer.from(tileSvg)).png().toBuffer();
  const iconSize = Math.round(size * 0.52);
  const iconSvg = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { color: "#FFFFFF", size: String(iconSize) }));
  const iconBuffer = await sharp(Buffer.from(iconSvg)).png().toBuffer();
  const output = await sharp(tileBuffer).composite([{ input: iconBuffer, gravity: "center" }]).png().toBuffer();
  return `image/png;base64,${output.toString("base64")}`;
}
function addText(slide, text, options) {
  slide.addText(text, {
    fontFace: BODY,
    color: C.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    ...options,
  });
}
function addRichText(slide, runs, options) {
  slide.addText(runs.map((run) => ({ text: run.text, options: { color: run.color || C.ink, bold: run.bold ?? true, ...(run.options || {}) } })), {
    fontFace: HEAD,
    margin: 0,
    fit: "shrink",
    ...options,
  });
}
function addCard(slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.09,
    fill: { color: options.fill || C.white },
    line: { color: options.line || C.line, width: options.lineWidth || 1 },
    shadow: options.shadow === false ? undefined : (options.deep ? deepShadow() : makeShadow()),
  });
}
function addFooter(slide, number, dark = false) {
  addText(slide, "Copilot Studio", { x: 0.85, y: 7.12, w: 2.0, h: 0.17, fontSize: 8.5, color: dark ? C.soft : C.footer });
  addText(slide, String(number), { x: 12.28, y: 7.08, w: 0.35, h: 0.18, fontSize: 9, color: dark ? C.soft : C.footer, align: "right" });
}
function addHeader(slide, eyebrow, headline, subtitle, options = {}) {
  addText(slide, eyebrow.toUpperCase(), { x: 0.85, y: 0.62, w: 7.5, h: 0.26, fontFace: HEAD, fontSize: 11, bold: true, color: options.eyebrowColor || C.blue, charSpacing: 1.8 });
  if (Array.isArray(headline)) {
    addRichText(slide, headline, { x: 0.85, y: 1.02, w: 11.75, h: options.headlineH || 0.78, fontSize: options.headlineSize || 27 });
  } else {
    addText(slide, headline, { x: 0.85, y: 1.02, w: 11.75, h: options.headlineH || 0.78, fontFace: HEAD, fontSize: options.headlineSize || 27, bold: true, color: C.ink });
  }
  if (subtitle) addText(slide, subtitle, { x: 0.85, y: options.subtitleY || 1.98, w: 11.7, h: 0.45, fontSize: 13.2, color: C.muted });
}
function addTopGradient(slide, x, y, w, imageData) {
  slide.addImage({ data: imageData, x, y, w, h: 0.07 });
}
function arrow(slide, x, y, w, color = C.purple, both = false) {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h: 0,
    line: { color, width: 2.5, beginArrowType: both ? "triangle" : "none", endArrowType: "triangle" },
  });
}
function addChip(slide, text, x, y, w, fill, color = C.ink) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: fill }, line: { color: fill } });
  addText(slide, text, { x, y: y + 0.01, w, h: 0.3, fontFace: HEAD, fontSize: 9.8, bold: true, color, align: "center", valign: "middle" });
}
function addNotes(slide, text) {
  slide.addNotes(text);
}

async function build() {
  const logo = {
    m365: await officialLogo("Copilot Icon.png"),
    studio: await officialLogo("Copilot Studio Icon.svg"),
    aiBuilder: await officialLogo("AI Builder Icon.svg"),
    foundry: await officialLogo("AI Foundry Icon.svg"),
    powerPages: await officialLogo("Power Pages Icon.svg"),
    powerPlatform: await officialLogo("Power Platform Icon.svg"),
    dataverse: await officialLogo("Dataverse Icon.svg"),
  };
  const icon = {
    know: await iconTile(MdMenuBook, [C.blue, C.sky]),
    reason: await iconTile(MdOutlinePsychology, [C.blue, C.purple]),
    act: await iconTile(MdBolt, [C.purple, C.magenta]),
    reach: await iconTile(MdPublic, [C.magenta, C.coral]),
    ask: await iconTile(MdChatBubbleOutline, [C.blue, C.sky]),
    cite: await iconTile(MdSearch, [C.blue, C.purple]),
    complete: await iconTile(MdTaskAlt, [C.purple, C.magenta]),
    document: await iconTile(MdOutlineDocumentScanner, [C.blue, C.sky]),
    classify: await iconTile(MdSchema, [C.blue, C.purple]),
    predict: await iconTile(MdOutlineAnalytics, [C.purple, C.magenta]),
    prompt: await iconTile(MdOutlinePsychology, [C.magenta, C.coral]),
    authenticated: await iconTile(MdLockOutline, [C.blue, C.purple]),
    public: await iconTile(MdPublic, [C.purple, C.magenta]),
    service: await iconTile(MdSupportAgent, [C.magenta, C.coral]),
    describe: await iconTile(MdChatBubbleOutline, [C.blue, C.sky]),
    navigate: await iconTile(MdRoute, [C.blue, C.purple]),
    request: await iconTile(MdTaskAlt, [C.purple, C.magenta]),
    confirm: await iconTile(MdConfirmationNumber, [C.magenta, C.coral]),
  };
  const gradientBar = await gradientRect(12, 0.08, GRAD, 0, 0.5);
  const darkGradientBar = await gradientRect(4, 0.08, [C.blue, C.purple, C.magenta], 0, 0.5);
  const blueGlow = await glow(7, 7, C.blue, 0.42);
  const magentaGlow = await glow(6, 6, C.magenta, 0.38);

  // Slide 1 - title
  {
    const s = pptx.addSlide();
    s.background = { color: C.ink };
    s.addImage({ data: blueGlow, x: 7.7, y: 2.4, w: 7, h: 7 });
    s.addImage({ data: magentaGlow, x: 9.8, y: 4.0, w: 5.5, h: 5.5 });
    s.addImage({ data: logo.studio, x: 0.86, y: 0.72, w: 0.48, h: 0.48 });
    addText(s, "MICROSOFT COPILOT STUDIO", { x: 1.52, y: 0.8, w: 4.0, h: 0.28, fontFace: HEAD, fontSize: 12, bold: true, color: C.sky, charSpacing: 1.1 });
    addRichText(s, [
      { text: "From AI-Powered Productivity", color: C.white },
      { text: "\nto AI-Powered Processes", color: C.sky },
    ], { x: 0.85, y: 1.65, w: 9.2, h: 1.65, fontSize: 37, breakLine: false });
    addText(s, "Building agents that know, reason, act, and reach users — across every channel of your business.", { x: 0.86, y: 3.7, w: 8.7, h: 0.76, fontSize: 16, color: C.soft });
    addChip(s, "25-minute session", 0.86, 6.38, 1.75, "20394B", C.white);
    addText(s, "Better together with Microsoft Copilot", { x: 2.86, y: 6.44, w: 3.6, h: 0.24, fontSize: 10.5, color: C.soft });
    s.addImage({ data: logo.studio, x: 10.45, y: 4.7, w: 1.65, h: 1.65 });
    addFooter(s, 1, true);
    addNotes(s, "Opening. Frame the session as a progression from AI-powered productivity to AI-powered processes. Copilot Studio is the focus: agents that know, reason, act, and reach users across channels. Keep this brief and move to the agenda.");
  }

  // Slide 2 - agenda
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "Agenda", "What we’ll cover in 25 minutes", "From the evolution of Copilot to choosing your center of gravity.", { headlineSize: 27, subtitleY: 1.78 });
    const left = [
      ["0:00", "The Evolution", "From flow of work to flow of business"],
      ["1:30", "What Is Copilot Studio?", "Agents that know, reason, act, and reach"],
      ["4:00", "Demo 1 · Extend M365 Copilot", "Grounded answer to governed action"],
      ["7:00", "AI Builder in the Process", "Document processing, extraction, prediction"],
    ];
    const right = [
      ["9:30", "Beyond One Work Surface", "Employees, citizens, and service channels"],
      ["12:00", "Demo 2 · Citizen Self-Service", "Guide a resident to a confirmed request"],
      ["15:30", "Choose the Center of Gravity", "M365 Copilot, Copilot Studio, or Foundry"],
      ["18:00", "Discussion, Handoffs & Q&A", "Open dialogue and next steps"],
    ];
    s.addShape(pptx.ShapeType.line, { x: 6.67, y: 3.0, w: 0, h: 3.4, line: { color: "D9D7E5", width: 1.2 } });
    const item = (x, y, row, index) => {
      const timeColor = index % 2 === 0 ? C.blue : C.purple;
      addText(s, row[0], { x, y, w: 0.92, h: 0.3, fontFace: HEAD, fontSize: 13.2, bold: true, color: timeColor });
      addText(s, row[1], { x: x + 1.27, y: y - 0.02, w: 4.45, h: 0.34, fontFace: HEAD, fontSize: 13.2, bold: true, color: C.ink });
      addText(s, row[2], { x: x + 1.27, y: y + 0.31, w: 4.45, h: 0.3, fontSize: 10.8, color: C.muted });
    };
    left.forEach((row, index) => item(0.85, 3.1 + index * 0.95, row, index));
    right.forEach((row, index) => item(7.0, 3.1 + index * 0.95, row, index + 1));
    addFooter(s, 2);
    addNotes(s, "Preview the 25-minute flow. The two demonstrations are intentionally short and can be recorded for quality assurance. The narrative moves from the M365 Copilot extension story, through Copilot Studio and AI Builder, to external audiences and the final platform decision guidance.");
  }

  // Slide 3 - evolution
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "The Evolution", [
      { text: "M365 Copilot changes how people work; ", color: C.ink },
      { text: "Copilot Studio changes how work gets done.", color: C.purple },
    ], "The shift from AI in the flow of work to agents in the flow of business — an expansion, not a replacement.", { headlineSize: 25, headlineH: 0.95, subtitleY: 2.02 });
    addCard(s, 0.75, 3.0, 5.25, 3.0, { fill: C.white, deep: false });
    addTopGradient(s, 0.75, 3.0, 5.25, gradientBar);
    s.addImage({ data: logo.m365, x: 1.18, y: 3.34, w: 0.7, h: 0.7 });
    addText(s, "M365 COPILOT", { x: 2.05, y: 3.48, w: 2.4, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: C.blue });
    addText(s, "AI in the flow of work", { x: 1.18, y: 4.15, w: 3.8, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true });
    addText(s, "Ask  ·  Create  ·  Summarize", { x: 1.18, y: 4.92, w: 3.7, h: 0.34, fontSize: 12, color: C.muted });
    addText(s, "Transforms how people work", { x: 1.18, y: 5.54, w: 3.8, h: 0.34, fontFace: HEAD, fontSize: 12.5, bold: true });
    addCard(s, 7.35, 3.0, 5.25, 3.0, { fill: C.ink, line: C.blue, deep: true });
    addTopGradient(s, 7.35, 3.0, 5.25, gradientBar);
    s.addImage({ data: logo.studio, x: 7.78, y: 3.34, w: 0.7, h: 0.7 });
    addText(s, "COPILOT STUDIO", { x: 8.65, y: 3.48, w: 2.4, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: C.sky });
    addText(s, "Agents in the flow of business", { x: 7.78, y: 4.15, w: 4.1, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: C.white });
    addText(s, "Know  ·  Reason  ·  Act  ·  Reach", { x: 7.78, y: 4.92, w: 3.8, h: 0.34, fontSize: 12, color: C.soft });
    addText(s, "Transforms how work gets done", { x: 7.78, y: 5.54, w: 3.8, h: 0.34, fontFace: HEAD, fontSize: 12.5, bold: true, color: C.white });
    arrow(s, 6.15, 4.5, 1.05, C.purple);
    addChip(s, "EXTEND", 6.03, 4.0, 1.3, C.purple, C.white);
    addText(s, "Not a ceiling or a migration — the next layer of the Microsoft agent stack.", { x: 2.1, y: 6.35, w: 9.1, h: 0.3, fontFace: HEAD, fontSize: 11.2, color: C.muted, align: "center" });
    addFooter(s, 3);
    addNotes(s, "M365 Copilot brings AI into the flow of work. Copilot Studio extends that experience into the flow of business. This is an expansion, not a replacement or migration. The transition happens when the organization moves from using AI in the flow of work to designing agents for specific business outcomes.");
  }

  // Slide 4 - what is Copilot Studio
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "What Is Copilot Studio", [
      { text: "One low-code platform to build agents that ", color: C.ink },
      { text: "know, reason, act, and reach.", color: C.purple },
    ], "Grounded in your knowledge, connected to your systems, governed on Power Platform.", { headlineSize: 25, headlineH: 0.9, subtitleY: 2.0 });
    const items = [
      { x: 0.75, icon: icon.know, title: "KNOW", body: "Enterprise knowledge from documents, Dataverse, and websites" },
      { x: 3.92, icon: icon.reason, title: "REASON", body: "Instructions and orchestration plan the right path" },
      { x: 7.09, icon: icon.act, title: "ACT", body: "Tools, APIs, and agent flows complete the work" },
      { x: 10.26, icon: icon.reach, title: "REACH", body: "Users met in M365 Copilot, Teams, web, and voice" },
    ];
    items.forEach((item) => {
      addCard(s, item.x, 3.08, 2.55, 2.95, { fill: C.white });
      s.addImage({ data: item.icon, x: item.x + 0.86, y: 3.34, w: 0.82, h: 0.82 });
      addText(s, item.title, { x: item.x + 0.2, y: 4.34, w: 2.15, h: 0.34, fontFace: HEAD, fontSize: 15, bold: true, align: "center" });
      addText(s, item.body, { x: item.x + 0.24, y: 4.78, w: 2.07, h: 0.92, fontSize: 11.8, color: C.muted, align: "center", valign: "middle" });
    });
    addCard(s, 0.75, 6.27, 12.06, 0.55, { fill: C.white, shadow: false });
    addTopGradient(s, 0.75, 6.27, 12.06, gradientBar);
    s.addImage({ data: logo.powerPlatform, x: 1.05, y: 6.36, w: 0.38, h: 0.38 });
    addText(s, "Built on Microsoft Power Platform", { x: 1.58, y: 6.33, w: 2.9, h: 0.35, fontFace: HEAD, fontSize: 11.5, bold: true });
    addText(s, "Security  ·  Governance  ·  Lifecycle  ·  Analytics", { x: 4.62, y: 6.33, w: 5.3, h: 0.35, fontSize: 10.8, color: C.muted });
    addFooter(s, 4);
    addNotes(s, "Copilot Studio is Microsoft's low-code platform for building enterprise agents. Walk left to right: Know through enterprise knowledge; Reason through instructions and orchestration; Act through tools, APIs, and agent flows; Reach users in M365 Copilot, Teams, web, and voice. Power Platform supplies the enterprise foundation for security, governance, lifecycle, and analytics.");
  }

  // Slide 5 - demo 1
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "Demo 1 · Extend M365 Copilot", "From a grounded answer to a governed business action — inside M365 Copilot.", "The agent moves past the FAQ: it cites approved knowledge, then takes the next step.", { headlineSize: 25, headlineH: 0.9, subtitleY: 2.0 });
    s.addImage({ data: logo.m365, x: 10.72, y: 0.48, w: 0.42, h: 0.42 });
    addChip(s, "RECORDED", 11.38, 0.53, 1.05, C.purple, C.white);
    const steps = [
      { x: 0.75, number: "1", icon: icon.ask, title: "Ask in the flow of work", body: "An employee invokes the agent right inside M365 Copilot", color: C.blue },
      { x: 4.79, number: "2", icon: icon.cite, title: "Ground the answer", body: "Approved knowledge returns a focused, cited response", color: C.purple },
      { x: 8.83, number: "3", icon: icon.complete, title: "Complete the next step", body: "A connector or agent flow acts — and confirms the result", color: C.magenta },
    ];
    steps.forEach((step) => {
      addCard(s, step.x, 3.15, 3.65, 2.75, { fill: C.white });
      addText(s, step.number, { x: step.x + 0.35, y: 3.48, w: 0.6, h: 0.55, fontFace: HEAD, fontSize: 30, bold: true, color: step.color });
      s.addImage({ data: step.icon, x: step.x + 2.72, y: 3.43, w: 0.58, h: 0.58 });
      addText(s, step.title, { x: step.x + 0.35, y: 4.32, w: 2.95, h: 0.55, fontFace: HEAD, fontSize: 14.5, bold: true });
      addText(s, step.body, { x: step.x + 0.35, y: 5.0, w: 2.95, h: 0.65, fontSize: 11, color: C.muted });
    });
    addCard(s, 0.75, 6.23, 11.73, 0.5, { fill: C.paleBlue, line: C.paleBlue, shadow: false });
    addText(s, "Watch for:  specialized scope  ·  cited knowledge  ·  a real tool call  ·  confirmation", { x: 1.0, y: 6.31, w: 11.2, h: 0.3, fontFace: HEAD, fontSize: 11.2, bold: true, color: "174E7E" });
    addFooter(s, 5);
    addNotes(s, "Recorded demo, approximately three minutes. Show an employee invoking a specialized agent inside M365 Copilot, receiving a grounded and cited answer, then asking the agent to complete the next step through a connector or agent flow. The business action and visible confirmation are the differentiation; avoid a pure FAQ demonstration.");
  }

  // Slide 6 - AI Builder
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "AI Builder in the Process", [
      { text: "Copilot Studio owns the conversation; ", color: C.ink },
      { text: "AI Builder does the specialized task.", color: C.magenta },
    ], "A focused AI capability inside an agent flow — not a second agent platform.", { headlineSize: 24, headlineH: 0.9, subtitleY: 2.0 });
    addCard(s, 0.75, 3.03, 4.55, 3.05, { fill: C.ink, line: C.blue, deep: true });
    addTopGradient(s, 0.75, 3.03, 4.55, gradientBar);
    s.addImage({ data: logo.studio, x: 1.13, y: 3.4, w: 0.62, h: 0.62 });
    addText(s, "COPILOT STUDIO", { x: 1.95, y: 3.55, w: 2.4, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: C.sky });
    addText(s, "Owns the interaction", { x: 1.13, y: 4.18, w: 3.1, h: 0.38, fontFace: HEAD, fontSize: 17, bold: true, color: C.white });
    addText(s, "Understands intent\nChooses knowledge & tools\nManages the conversation\nReturns the result", { x: 1.13, y: 4.78, w: 3.2, h: 1.05, fontSize: 11.8, color: C.soft, breakLine: false });
    arrow(s, 5.48, 3.48, 0.6, C.magenta);
    s.addImage({ data: logo.aiBuilder, x: 6.3, y: 3.05, w: 0.62, h: 0.62 });
    addText(s, "AI BUILDER  ·  THE FOCUSED TASK", { x: 7.1, y: 3.2, w: 4.5, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: C.magenta });
    const tasks = [
      { x: 6.3, y: 3.82, icon: icon.document, title: "Process documents", body: "Read and structure incoming files" },
      { x: 9.48, y: 3.82, icon: icon.classify, title: "Classify & extract", body: "Categories, entities, sentiment, fields" },
      { x: 6.3, y: 5.03, icon: icon.predict, title: "Predict", body: "Score a likely business outcome" },
      { x: 9.48, y: 5.03, icon: icon.prompt, title: "Run a prompt", body: "Controlled, structured GenAI output" },
    ];
    tasks.forEach((task) => {
      addCard(s, task.x, task.y, 2.82, 1.05, { fill: C.white, shadow: false });
      s.addImage({ data: task.icon, x: task.x + 0.18, y: task.y + 0.22, w: 0.5, h: 0.5 });
      addText(s, task.title, { x: task.x + 0.82, y: task.y + 0.2, w: 1.75, h: 0.28, fontFace: HEAD, fontSize: 12.2, bold: true });
      addText(s, task.body, { x: task.x + 0.82, y: task.y + 0.52, w: 1.78, h: 0.4, fontSize: 10.8, color: C.muted });
    });
    addText(s, "Multiple prebuilt and custom models are available — validate the model and feature in your target environment.", { x: 2.0, y: 6.43, w: 9.7, h: 0.3, fontSize: 11, color: C.muted, align: "center" });
    addFooter(s, 6);
    addNotes(s, "Copilot Studio owns the conversation and orchestration; AI Builder performs a focused task inside an agent flow, app, or automation. Use the four examples to show document processing, classification and extraction, prediction, and controlled prompts. Validate the selected model and feature in the target GCC environment before the customer session.");
  }

  // Slide 7 - audiences
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "Beyond One Work Surface", "The same platform serves employees, authenticated users, citizens, and service channels.", "External audiences change the channel, identity, data, and operating model — not the platform.", { headlineSize: 24, headlineH: 0.9, subtitleY: 2.0 });
    const audiences = [
      { x: 0.75, icon: logo.m365, title: "Employees", channel: "M365 Copilot  ·  Teams", detail: "Internal identity; connectors and agent flows" },
      { x: 3.92, icon: logo.powerPages, title: "Authenticated", channel: "Power Pages  ·  custom app", detail: "Signed-in users; scoped data and actions" },
      { x: 7.09, icon: icon.public, title: "Public", channel: "Website self-service", detail: "Anonymous; public knowledge only" },
      { x: 10.26, icon: icon.service, title: "Service", channel: "Messaging  ·  voice", detail: "Live handoff and voice via Dynamics 365" },
    ];
    audiences.forEach((item) => {
      addCard(s, item.x, 3.08, 2.55, 3.0, { fill: C.white });
      s.addImage({ data: item.icon, x: item.x + 0.9, y: 3.36, w: 0.74, h: 0.74 });
      addText(s, item.title, { x: item.x + 0.2, y: 4.35, w: 2.15, h: 0.34, fontFace: HEAD, fontSize: 15, bold: true, align: "center" });
      addText(s, item.channel, { x: item.x + 0.14, y: 4.91, w: 2.27, h: 0.4, fontFace: HEAD, fontSize: 11.3, bold: true, color: C.blue, align: "center" });
      addText(s, item.detail, { x: item.x + 0.2, y: 5.43, w: 2.15, h: 0.54, fontSize: 11, color: C.muted, align: "center" });
    });
    addText(s, "One platform  ·  one governance model  ·  four audiences", { x: 3.2, y: 6.47, w: 6.9, h: 0.3, fontFace: HEAD, fontSize: 12.5, bold: true, color: C.ink, align: "center" });
    addFooter(s, 7);
    addNotes(s, "Organize the discussion by audience rather than reciting every channel. Employees use M365 Copilot and Teams; authenticated users can use Power Pages or custom applications; public users can receive anonymous website self-service over public knowledge; service scenarios can add messaging, voice, and live handoff with applicable Dynamics 365 capabilities.");
  }

  // Slide 8 - demo 2
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "Demo 2 · Citizen Self-Service", "A governed public agent guides a resident from question to a confirmed request.", "Same platform patterns as the employee agent — a different, carefully drawn audience boundary.", { headlineSize: 24, headlineH: 0.9, subtitleY: 2.0 });
    s.addImage({ data: logo.powerPages, x: 10.72, y: 0.48, w: 0.42, h: 0.42 });
    addChip(s, "RECORDED", 11.38, 0.53, 1.05, C.purple, C.white);
    const steps = [
      { x: 0.75, number: "1", icon: icon.describe, title: "Describe the need", body: "The resident explains it in plain language", color: C.blue },
      { x: 3.92, number: "2", icon: icon.navigate, title: "Navigate the service", body: "Approved public guidance finds the next step", color: C.purple },
      { x: 7.09, number: "3", icon: icon.request, title: "Create the request", body: "A governed flow writes to the service system", color: C.magenta },
      { x: 10.26, number: "4", icon: icon.confirm, title: "Confirm & track", body: "The resident gets a reference number", color: C.coral },
    ];
    steps.forEach((step) => {
      addCard(s, step.x, 3.15, 2.55, 2.8, { fill: C.white });
      addText(s, step.number, { x: step.x + 0.28, y: 3.47, w: 0.48, h: 0.55, fontFace: HEAD, fontSize: 28, bold: true, color: step.color });
      s.addImage({ data: step.icon, x: step.x + 1.68, y: 3.42, w: 0.58, h: 0.58 });
      addText(s, step.title, { x: step.x + 0.28, y: 4.32, w: 2.0, h: 0.55, fontFace: HEAD, fontSize: 14.2, bold: true });
      addText(s, step.body, { x: step.x + 0.28, y: 4.99, w: 2.0, h: 0.66, fontSize: 11.5, color: C.muted });
    });
    addCard(s, 0.75, 6.2, 12.06, 0.52, { fill: C.palePurple, line: C.palePurple, shadow: false });
    s.addImage({ data: logo.aiBuilder, x: 1.0, y: 6.28, w: 0.35, h: 0.35 });
    addText(s, "Optional:  a supported AI Builder model extracts fields after submission — validated before use.", { x: 1.5, y: 6.27, w: 10.8, h: 0.34, fontFace: HEAD, fontSize: 11.2, bold: true, color: "684189" });
    addFooter(s, 8);
    addNotes(s, "Recorded demo, approximately three and a half minutes. Show a resident describing a need, receiving approved public guidance, creating a request through a governed flow, and receiving a reference number. Keep the public agent's instructions, knowledge, authentication, and tools separate from the employee agent. AI Builder document extraction is optional and should occur after submission with validation before operational use.");
  }

  // Slide 9 - center of gravity
  {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    addHeader(s, "Choose the Center of Gravity", "Start where the solution belongs; connect where the value is clear.", "Center of gravity picks the starting point — integration always stays open.", { headlineSize: 25, headlineH: 0.9, subtitleY: 2.0 });
    const cards = [
      { x: 0.5, icon: logo.m365, label: "EMPLOYEE EXPERIENCE", title: "M365 Copilot", body: "Productivity grounded in your Microsoft 365 work", fill: C.white, text: C.ink, accent: C.blue },
      { x: 4.84, icon: logo.studio, label: "BUSINESS AGENT", title: "Copilot Studio", body: "Governed knowledge, actions, channels, and lifecycle", fill: C.ink, text: C.white, accent: C.sky },
      { x: 9.18, icon: logo.foundry, label: "CUSTOM AI ENGINEERING", title: "Microsoft Foundry", body: "Code-first agents, model choice, evaluations, Azure-native", fill: C.white, text: C.ink, accent: C.magenta },
    ];
    cards.forEach((card, index) => {
      addCard(s, card.x, 3.18, 3.65, 2.85, { fill: card.fill, line: index === 1 ? C.blue : C.line, deep: index === 1 });
      addTopGradient(s, card.x, 3.18, 3.65, gradientBar);
      s.addImage({ data: card.icon, x: card.x + 1.43, y: 3.45, w: 0.8, h: 0.8 });
      addText(s, card.label, { x: card.x + 0.2, y: 4.44, w: 3.25, h: 0.28, fontFace: HEAD, fontSize: 10.8, bold: true, color: card.accent, align: "center" });
      addText(s, card.title, { x: card.x + 0.2, y: 4.83, w: 3.25, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: card.text, align: "center" });
      addText(s, card.body, { x: card.x + 0.38, y: 5.32, w: 2.89, h: 0.6, fontSize: 11.3, color: index === 1 ? C.soft : C.muted, align: "center" });
    });
    addChip(s, "THE FOCUS TODAY", 5.74, 2.94, 1.75, C.purple, C.white);
    addText(s, "CONNECT", { x: 4.15, y: 4.18, w: 0.69, h: 0.2, fontFace: HEAD, fontSize: 7.8, bold: true, color: C.blue, align: "center" });
    arrow(s, 4.27, 4.62, 0.45, C.blue, true);
    addText(s, "CONNECT", { x: 8.49, y: 4.18, w: 0.69, h: 0.2, fontFace: HEAD, fontSize: 7.8, bold: true, color: C.magenta, align: "center" });
    arrow(s, 8.61, 4.62, 0.45, C.magenta, true);
    addText(s, "A decision guide, not a scorecard — the center of gravity moves as the requirement changes.", { x: 2.05, y: 6.45, w: 9.2, h: 0.3, fontFace: HEAD, fontSize: 11.2, italic: true, color: C.ink, align: "center" });
    addFooter(s, 9);
    addNotes(s, "This is a decision guide, not a scorecard. Start with M365 Copilot when employee productivity and Microsoft 365 work are central. Start with Copilot Studio for governed business agents, actions, channels, and lifecycle. Start with Microsoft Foundry when custom models, code-first orchestration, evaluations, or an Azure-native runtime are central. The bidirectional connectors reinforce that integration remains open.");
  }

  // Slide 10 - discussion
  {
    const s = pptx.addSlide();
    s.background = { color: C.ink };
    s.addImage({ data: blueGlow, x: 7.7, y: 2.4, w: 7, h: 7 });
    s.addImage({ data: magentaGlow, x: 9.8, y: 4.0, w: 5.5, h: 5.5 });
    s.addImage({ data: logo.studio, x: 0.86, y: 0.75, w: 0.48, h: 0.48 });
    addText(s, "DISCUSSION  ·  18:00–25:00", { x: 1.52, y: 0.83, w: 4.0, h: 0.28, fontFace: HEAD, fontSize: 12, bold: true, color: C.sky, charSpacing: 1.0 });
    addText(s, "Discussion, product handoffs & Q&A", { x: 0.85, y: 1.52, w: 10.6, h: 0.68, fontFace: HEAD, fontSize: 31, bold: true, color: C.white });
    const questions = [
      "Where is your center of gravity today — and where should it be?",
      "Which process deserves your first agent?",
      "What must “governed” mean for your audience?",
    ];
    questions.forEach((question, index) => {
      s.addShape(pptx.ShapeType.ellipse, { x: 0.9, y: 2.93 + index * 0.58, w: 0.12, h: 0.12, fill: { color: index === 0 ? C.blue : index === 1 ? C.purple : C.magenta }, line: { color: index === 0 ? C.blue : index === 1 ? C.purple : C.magenta } });
      addText(s, question, { x: 1.15, y: 2.83 + index * 0.58, w: 9.0, h: 0.35, fontSize: 15, color: C.soft });
    });
    addText(s, "Handoff: when the need shifts to custom models or code-first orchestration, Microsoft Foundry becomes the starting point — or the specialized service behind your Studio agent.", { x: 0.86, y: 5.2, w: 9.6, h: 0.78, fontSize: 11.5, color: C.soft });
    addText(s, "Better together — from AI-powered productivity to AI-powered processes.", { x: 0.86, y: 6.52, w: 9.4, h: 0.35, fontFace: HEAD, fontSize: 13.5, bold: true, italic: true, color: C.sky });
    s.addImage({ data: logo.foundry, x: 11.02, y: 5.75, w: 1.12, h: 1.12 });
    addFooter(s, 10, true);
    addNotes(s, "Use the questions to open discussion. Handoff to the Foundry presenter: when the requirement shifts to custom models or code-first orchestration, Microsoft Foundry becomes the starting point or the specialized service behind the Copilot Studio agent. Close on the better-together message.");
  }

  await pptx.writeFile({ fileName: OUT });
  console.log(`Wrote ${OUT}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
