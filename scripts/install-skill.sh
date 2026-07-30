#!/usr/bin/env bash
set -euo pipefail

scope="workspace"
version="latest"
workspace="$(pwd)"
force="false"
skill_name="power-pages-code-site"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill)
      skill_name="${2:-}"
      shift 2
      ;;
    --scope)
      scope="${2:-}"
      shift 2
      ;;
    --version)
      version="${2:-}"
      shift 2
      ;;
    --workspace)
      workspace="${2:-}"
      shift 2
      ;;
    --force)
      force="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ "$skill_name" != "power-pages-code-site" && "$skill_name" != "power-platform-code-apps" && "$skill_name" != "copilot-studio-agent-engineering" ]]; then
  echo "--skill must be power-pages-code-site, power-platform-code-apps, or copilot-studio-agent-engineering" >&2
  exit 2
fi

asset_name="${skill_name}.zip"
case "$skill_name" in
  power-pages-code-site)
    expected_guide="references/power-pages-code-site-scaffolding-guide.md"
    ;;
  power-platform-code-apps)
    expected_guide="references/power-platform-code-apps-field-guide.md"
    ;;
  copilot-studio-agent-engineering)
    expected_guide="references/lifecycle-and-tests.md"
    ;;
esac

if [[ "$scope" != "workspace" && "$scope" != "global" ]]; then
  echo "--scope must be workspace or global" >&2
  exit 2
fi

if [[ "$version" == "latest" ]]; then
  download_url="https://github.com/kellycason/docs/releases/latest/download/${asset_name}"
elif [[ "$version" =~ ^${skill_name}-v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  download_url="https://github.com/kellycason/docs/releases/download/${version}/${asset_name}"
else
  echo "--version must be latest or a tag such as ${skill_name}-v1.0.0" >&2
  exit 2
fi

if [[ "$scope" == "global" ]]; then
  skills_root="${HOME}/.copilot/skills"
else
  skills_root="$(cd "$workspace" && pwd)/.github/skills"
fi
target="${skills_root}/${skill_name}"

if [[ -e "$target" && "$force" != "true" ]]; then
  echo "The skill already exists at '$target'. Rerun with --force to update it." >&2
  exit 1
fi

temporary_root="$(mktemp -d)"
staging_path="${target}.installing-$$"
cleanup() {
  rm -rf "$temporary_root" "$staging_path"
}
trap cleanup EXIT

curl -fsSL "$download_url" -o "${temporary_root}/${asset_name}"
mkdir -p "${temporary_root}/extract"
unzip -q "${temporary_root}/${asset_name}" -d "${temporary_root}/extract"

source_path="${temporary_root}/extract/${skill_name}"
if [[ ! -f "${source_path}/SKILL.md" ]]; then
  skill_file="$(find "${temporary_root}/extract" -type f -path "*/${skill_name}/SKILL.md" -print -quit)"
  if [[ -z "$skill_file" ]]; then
    echo "The release archive does not contain the expected skill package." >&2
    exit 1
  fi
  source_path="$(dirname "$skill_file")"
fi

mkdir -p "$skills_root"
cp -R "$source_path" "$staging_path"

if [[ ! -f "${staging_path}/SKILL.md" || ! -f "${staging_path}/${expected_guide}" ]]; then
  echo "The staged skill failed package validation." >&2
  exit 1
fi

rm -rf "$target"
mv "$staging_path" "$target"
installed_version="$(tr -d '[:space:]' < "${target}/VERSION")"
echo "Installed ${skill_name} ${installed_version} to ${target}"
