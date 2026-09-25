#!/usr/bin/env bash
set -euo pipefail

TARGET_REPO="${1:-sophiamaybea/open-claw}"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

if ! command -v gh >/dev/null 2>&1; then
  cat >&2 <<'EOF'
GitHub CLI (gh) is not installed.

macOS:
  brew install gh

Ubuntu/Debian:
  See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

Then run this script again.
EOF
  exit 127
fi

echo "==> Checking GitHub CLI authentication"

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "==> No GitHub CLI login found. Opening GitHub's secure browser login..."
  gh auth login     --hostname github.com     --git-protocol https     --web     --scopes "repo,workflow,read:org"
fi

echo "==> Configuring Git to use GitHub CLI credentials"
gh auth setup-git

LOGIN="$(gh api user --jq '.login')" || die "Could not read the authenticated GitHub account."
echo "==> Authenticated as: ${LOGIN}"

echo "==> Verifying repository write access: ${TARGET_REPO}"
CAN_PUSH="$(gh api "repos/${TARGET_REPO}" --jq '.permissions.push // false')" || {
  cat >&2 <<EOF
Could not access ${TARGET_REPO} with the current GitHub CLI authentication.

If this is a scope problem, run:
  gh auth refresh --hostname github.com --scopes repo,workflow,read:org

Then retry:
  bash scripts/github_write_connect.sh ${TARGET_REPO}
EOF
  exit 2
}

if [[ "${CAN_PUSH}" != "true" ]]; then
  cat >&2 <<EOF
Authenticated as ${LOGIN}, but GitHub reports no push/write permission for:
  ${TARGET_REPO}

Grant this account write access to the repository, then retry.
EOF
  exit 3
fi

echo
echo "SUCCESS"
echo "GitHub CLI is authenticated and Git is configured for HTTPS pushes."
echo "Account: ${LOGIN}"
echo "Repo:    ${TARGET_REPO}"
echo "Write:   yes"
echo
echo "Useful checks:"
echo "  gh auth status"
echo "  gh repo view ${TARGET_REPO}"
echo "  gh api repos/${TARGET_REPO} --jq '.permissions'"
echo
echo "Clone:"
echo "  gh repo clone ${TARGET_REPO}"
