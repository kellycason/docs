import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []
const skills = [
  {
    name: 'power-pages-code-site',
    guide: 'references/power-pages-code-site-scaffolding-guide.md',
    requiredTerms: [
      'Sites.Selected',
      'createUploadSession',
      'adx_serverlogic_adx_webrole',
      '/_services/sharepoint-data.json',
      'previewWindow.location.replace',
    ],
  },
  {
    name: 'power-platform-code-apps',
    guide: 'references/power-platform-code-apps-field-guide.md',
    requiredTerms: [
      'power-apps init',
      'pac code add-data-source',
      '@odata.bind',
      'downloadFileFromRecord',
      'gccmoderate',
      'connection references',
    ],
  },
  {
    name: 'copilot-studio-agent-engineering',
    guides: [
      'references/baseline-gap-analysis.md',
      'references/identity-and-authoring.md',
      'references/grounding-and-capabilities.md',
      'references/routing-and-dialogs.md',
      'references/lifecycle-and-tests.md',
      'references/hr-benefits-case-study.md',
    ],
    requiredTerms: [
      'FileGroupKnowledgeSource',
      'CreateSearchQuery',
      'SearchAndSummarizeContent',
      'CancelOtherTopics',
      'EndConversation',
      '.mcs/botdefinition.json',
    ],
  },
]

function fail(message) {
  errors.push(message)
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null
  const values = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    values[key] = value
  }
  return values
}

async function filesUnder(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(fullPath))
    else files.push(fullPath)
  }
  return files
}

const summaries = []

for (const definition of skills) {
  const skillRoot = path.join(root, 'skills', definition.name)
  const skillFile = path.join(skillRoot, 'SKILL.md')
  const guidePaths = definition.guides || [definition.guide]
  const guideFiles = guidePaths.map((guide) => path.join(skillRoot, guide))
  const skill = await readFile(skillFile, 'utf8')
  const guides = await Promise.all(guideFiles.map((guideFile) => readFile(guideFile, 'utf8')))
  const guide = guides.join('\n')
  const version = (await readFile(path.join(skillRoot, 'VERSION'), 'utf8')).trim()
  const changelog = await readFile(path.join(skillRoot, 'CHANGELOG.md'), 'utf8')
  const frontmatter = parseFrontmatter(skill)

  if (!frontmatter) {
    fail(`${definition.name}: SKILL.md is missing YAML frontmatter.`)
  } else {
    if (frontmatter.name !== definition.name) fail(`${definition.name}: skill name must match its folder name.`)
    if (!frontmatter.description) fail(`${definition.name}: skill description is required.`)
    if ((frontmatter.description || '').length > 1024) fail(`${definition.name}: skill description exceeds 1024 characters.`)
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`${definition.name}: VERSION must contain a semantic version.`)
  if (!changelog.includes(`## ${version} -`)) fail(`${definition.name}: CHANGELOG.md has no entry for ${version}.`)
  for (const guidePath of guidePaths) {
    if (!skill.includes(`./${guidePath}`)) fail(`${definition.name}: SKILL.md must link to ${guidePath} with a relative path.`)
  }

  for (const [label, text] of [['SKILL.md', skill], ...guides.map((text, index) => [guidePaths[index], text])]) {
    const fences = (text.match(/^```/gm) || []).length
    if (fences % 2 !== 0) fail(`${definition.name}: ${label} has unbalanced Markdown code fences.`)
  }

  const packageFiles = await filesUnder(skillRoot)
  for (const file of packageFiles) {
    if ((await stat(file)).size > 2 * 1024 * 1024) fail(`${path.relative(root, file)} exceeds 2 MiB.`)
  }

  const publicTextFiles = packageFiles.filter((file) => {
    const extension = path.extname(file).toLowerCase()
    return ['.md', '.yml', '.yaml', '.json', '.txt'].includes(extension) || path.basename(file) === 'VERSION'
  })
  const publicText = (await Promise.all(publicTextFiles.map((file) => readFile(file, 'utf8')))).join('\n')
  const privacyText = publicText.replaceAll('@odata.bind', '')
  const privacyPatterns = [
    ['email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
    ['GUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i],
    ['Dataverse organization URL', /https:\/\/[^\s<]*\.crm\d*\.dynamics\.com/i],
    ['SharePoint tenant URL', /https:\/\/[^\s<]*\.sharepoint\.com/i],
  ]
  for (const [label, pattern] of privacyPatterns) {
    if (pattern.test(privacyText)) fail(`${definition.name}: public skill contains a possible ${label}.`)
  }

  for (const term of definition.requiredTerms) {
    if (!guide.includes(term)) fail(`${definition.name}: guide is missing required pattern: ${term}`)
  }

  summaries.push(`${definition.name} ${version}: ${packageFiles.length} files, ${guide.length} guide characters`)
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(`Validated ${summaries.join('; ')}.`)
