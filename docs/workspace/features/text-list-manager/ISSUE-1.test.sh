#!/usr/bin/env bash
# Structural verification tests for ISSUE-1: Monorepo Scaffolding
# Run from repo root: bash docs/workspace/features/text-list-manager/ISSUE-1.test.sh
# Each test checks one acceptance criterion. Tests pass (exit 0) only when the
# implementation is complete; they fail with a descriptive message otherwise.

set -uo pipefail

PASS=0
FAIL=0
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"

ok()   { echo "  PASS: $1"; ((PASS++)); }
fail() { echo "  FAIL: $1"; ((FAIL++)); }

echo ""
echo "ISSUE-1 scaffold tests"
echo "Root: $ROOT"
echo "=============================="

# ── AC-1: pnpm-workspace.yaml exists and lists packages/* and apps/* ──────────
echo ""
echo "AC-1: pnpm-workspace.yaml"

if [[ -f "$ROOT/pnpm-workspace.yaml" ]]; then
  ok "pnpm-workspace.yaml exists"
else
  fail "pnpm-workspace.yaml does not exist"
fi

if [[ -f "$ROOT/pnpm-workspace.yaml" ]] && grep -qF "packages/*" "$ROOT/pnpm-workspace.yaml"; then
  ok "pnpm-workspace.yaml lists packages/*"
else
  fail "pnpm-workspace.yaml does not list packages/*"
fi

if [[ -f "$ROOT/pnpm-workspace.yaml" ]] && grep -qF "apps/*" "$ROOT/pnpm-workspace.yaml"; then
  ok "pnpm-workspace.yaml lists apps/*"
else
  fail "pnpm-workspace.yaml does not list apps/*"
fi

# ── AC-2: Root package.json — name, private, 5 scripts, no deps ───────────────
echo ""
echo "AC-2: Root package.json"

if [[ -f "$ROOT/package.json" ]]; then
  ok "package.json exists"
else
  fail "package.json does not exist"
fi

if [[ -f "$ROOT/package.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/package.json'))
assert data.get('name') == 'text-list-manager', 'name mismatch'
" 2>/dev/null; then
  ok "package.json has name=text-list-manager"
else
  fail "package.json does not have name=text-list-manager"
fi

if [[ -f "$ROOT/package.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/package.json'))
assert data.get('private') == True, 'private must be true'
" 2>/dev/null; then
  ok "package.json has private=true"
else
  fail "package.json does not have private=true"
fi

REQUIRED_SCRIPTS=("build" "test" "dev:react" "dev:vanilla" "lint")
for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [[ -f "$ROOT/package.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/package.json'))
assert '$script' in data.get('scripts', {}), 'missing script'
" 2>/dev/null; then
    ok "package.json has script: $script"
  else
    fail "package.json missing script: $script"
  fi
done

if [[ -f "$ROOT/package.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/package.json'))
assert 'dependencies' not in data, 'should have no dependencies'
assert 'devDependencies' not in data, 'should have no devDependencies'
" 2>/dev/null; then
  ok "package.json has no dependencies or devDependencies"
else
  fail "package.json must not have dependencies or devDependencies"
fi

# ── AC-3: tsconfig.base.json with strict: true and required options ────────────
echo ""
echo "AC-3: tsconfig.base.json"

if [[ -f "$ROOT/tsconfig.base.json" ]]; then
  ok "tsconfig.base.json exists"
else
  fail "tsconfig.base.json does not exist"
fi

if [[ -f "$ROOT/tsconfig.base.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/tsconfig.base.json'))
opts = data.get('compilerOptions', {})
assert opts.get('strict') == True, 'strict must be true'
" 2>/dev/null; then
  ok "tsconfig.base.json has strict=true"
else
  fail "tsconfig.base.json does not have strict=true"
fi

REQUIRED_TS_OPTIONS=("target" "module" "moduleResolution" "lib" "declaration" "declarationMap" "sourceMap" "esModuleInterop" "skipLibCheck" "forceConsistentCasingInFileNames")
for opt in "${REQUIRED_TS_OPTIONS[@]}"; do
  if [[ -f "$ROOT/tsconfig.base.json" ]] && python3 -c "
import json, sys
data = json.load(open('$ROOT/tsconfig.base.json'))
opts = data.get('compilerOptions', {})
assert '$opt' in opts, 'missing option'
" 2>/dev/null; then
    ok "tsconfig.base.json has compilerOption: $opt"
  else
    fail "tsconfig.base.json missing compilerOption: $opt"
  fi
done

# ── AC-4: Root .eslintrc.cjs exists ───────────────────────────────────────────
echo ""
echo "AC-4: .eslintrc.cjs"

if [[ -f "$ROOT/.eslintrc.cjs" ]]; then
  ok ".eslintrc.cjs exists"
else
  fail ".eslintrc.cjs does not exist"
fi

# ── AC-5: .gitignore covers required patterns ─────────────────────────────────
echo ""
echo "AC-5: .gitignore"

if [[ -f "$ROOT/.gitignore" ]]; then
  ok ".gitignore exists"
else
  fail ".gitignore does not exist"
fi

REQUIRED_IGNORES=("node_modules/" "dist/" ".pnpm-store/" "*.local")
for pattern in "${REQUIRED_IGNORES[@]}"; do
  if [[ -f "$ROOT/.gitignore" ]] && grep -qF "$pattern" "$ROOT/.gitignore"; then
    ok ".gitignore contains: $pattern"
  else
    fail ".gitignore missing: $pattern"
  fi
done

# ── AC-6: packages/ and apps/ directories exist ───────────────────────────────
echo ""
echo "AC-6: Directory structure"

if [[ -d "$ROOT/packages" ]]; then
  ok "packages/ directory exists"
else
  fail "packages/ directory does not exist"
fi

if [[ -d "$ROOT/apps" ]]; then
  ok "apps/ directory exists"
else
  fail "apps/ directory does not exist"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "SOME TESTS FAILED — implementation incomplete"
  exit 1
else
  echo "ALL TESTS PASSED"
  exit 0
fi
