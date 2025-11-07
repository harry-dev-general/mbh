#!/bin/bash
#
# Setup script for MBH Staff Portal git hooks
#

echo "🔧 Setting up git hooks for secret detection..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
if [ -f .githooks/pre-commit ]; then
    cp .githooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed"
else
    echo "❌ Pre-commit hook not found in .githooks/"
    exit 1
fi

# Configure git to use the hooks
git config core.hooksPath .git/hooks

echo ""
echo "📋 Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Scan for API keys (Airtable, Square, Google Maps)"
echo "  • Scan for JWT tokens (Supabase keys)"
echo "  • Scan for hardcoded credentials in URLs"
echo "  • Warn about test files and default admin keys"
echo ""
echo "To bypass the hook in emergencies (not recommended):"
echo "  git commit --no-verify"
echo ""
echo "To test the hook:"
echo "  echo 'const KEY = \"patYiJdXfvcSenMU4.test\"' > test.js"
echo "  git add test.js && git commit -m 'test'"
echo "  (This should be blocked)"
echo ""
