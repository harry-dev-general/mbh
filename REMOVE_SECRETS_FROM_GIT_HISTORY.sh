#!/bin/bash

# MBH Staff Portal - Remove Secrets from Git History
# This script helps remove exposed credentials from git history
# BACKUP YOUR REPOSITORY BEFORE RUNNING THIS!

echo "⚠️  WARNING: This script will rewrite git history!"
echo "Make sure you have:"
echo "1. Backed up your repository"
echo "2. Coordinated with your team"
echo "3. Rotated all exposed credentials"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Create a file with all the secrets to remove
cat > secrets-to-remove.txt << 'EOF'
patYiJdXfvcSenMU4.f16c95bde5176be23391051e0c5bdc6405991805c434696d55b851bf208a2f14
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3VnZW9vaWdpd2FoaWtybXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDI0OTcsImV4cCI6MjA2ODM3ODQ5N30.OPIYLsnPNNF7dP3SDCODIurzaa3X_Q3xEhfPO3rLJxU
EAAAlxvlv1BGVkvpMDljJs4JeK6o0Z4JzXpLgFRmrBhH5HQ_lET7JTWL7uoSxmYb
sandbox-sq0idb-XMJPuJhbFV7hveP13KCkzQ
mbh-admin-2025
EOF

echo "Installing BFG Repo-Cleaner..."
if ! command -v bfg &> /dev/null
then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install bfg
    else
        echo "Please install BFG manually from: https://rtyley.github.io/bfg-repo-cleaner/"
        exit 1
    fi
fi

echo "Creating a mirror clone of the repository..."
git clone --mirror https://github.com/harry-dev-general/mbh mbh-mirror.git

echo "Running BFG to remove secrets..."
bfg --replace-text secrets-to-remove.txt mbh-mirror.git

echo "Cleaning up..."
cd mbh-mirror.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

echo ""
echo "✅ Secrets removed from history!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Review the changes: cd mbh-mirror.git && git log"
echo "2. Force push to remote: git push --force"
echo "3. Have all team members re-clone the repository"
echo "4. Delete the secrets-to-remove.txt file"
echo ""
echo "⚠️  CRITICAL: After force pushing, all team members must:"
echo "   - Delete their local repositories"
echo "   - Re-clone from GitHub"
echo "   - Re-apply any unpushed local changes"
