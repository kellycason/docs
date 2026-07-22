import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const skillName = 'power-pages-code-site'
const skillRoot = path.join(root, 'skills', skillName)
const skillFile = path.join(skillRoot, 'SKILL.md')
const guideFile = path.join(skillRoot, 'references', 'power-pages-code-site-scaffolding-guide.md')
const errors = []

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

const skill = await readFile(skillFile, 'utf8')
const guide = await readFile(guideFile, 'utf8')
const version = (await readFile(path.join(skillRoot, 'VERSION'), 'utf8')).trim()
const changelog = await readFile(path.join(skillRoot, 'CHANGELOG.md'), 'utf8')
const frontmatter = parseFrontmatter(skill)

if (!frontmatter) {
  fail('SKILL.md is missing YAML frontmatter.')
} else {
  if (frontmatter.name !== skillName) fail('Skill name must match its folder name.')
  if (!frontmatter.description) fail('Skill description is required.')
  if ((frontmatter.description || '').length > 1024) fail('Skill description exceeds 1024 characters.')
}

if (!/^\d+\.\d+\.\d+$/.test(version)) fail('VERSION must contain a semantic version.')
if (!changelog.includes(`## ${version} -`)) fail(`CHANGELOG.md has no entry for ${version}.`)
if (!skill.includes('./references/power-pages-code-site-scaffolding-guide.md')) {
  fail('SKILL.md must link to the scaffolding guide with a relative path.')
}

for (const [label, text] of [['SKILL.md', skill], ['guide', guide]]) {
  const fences = (text.match(/^```/gm) || []).length
  if (fences % 2 !== 0) fail(`${label} has unbalanced Markdown code fences.`)
}

const packageFiles = await filesUnder(skillRoot)
for (const file of packageFiles) {
  if ((await stat(file)).size > 2 * 1024 * 1024) fail(`${path.relative(root, file)} exceeds 2 MiB.`)
}

const publicText = `${skill}\n${guide}`
const privacyText = publicText.replaceAll('@odata.bind', '')
const privacyPatterns = [
  ['email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['GUID', /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i],
  ['Dataverse organization URL', /https:\/\/[^\s<]*\.crm\d*\.dynamics\.com/i],
  ['SharePoint tenant URL', /https:\/\/[^\s<]*\.sharepoint\.com/i],
]
for (const [label, pattern] of privacyPatterns) {
  if (pattern.test(privacyText)) fail(`Public skill contains a possible ${label}.`)
}

const requiredTerms = [
  'Sites.Selected',
  'createUploadSession',
  'adx_serverlogic_adx_webrole',
  '/_services/sharepoint-data.json',
  'previewWindow.location.replace',
]
for (const term of requiredTerms) {
  if (!guide.includes(term)) fail(`Guide is missing required pattern: ${term}`)
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

console.log(`Validated ${skillName} ${version}: ${packageFiles.length} files, ${guide.length} guide characters.`)
