#!/bin/bash
# Script to update domain URLs for production deployment
# Usage: ./scripts/update-domain.sh yourdomain.com

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Domain name required${NC}"
  echo "Usage: ./scripts/update-domain.sh yourdomain.com"
  exit 1
fi

NEW_DOMAIN="$1"
OLD_DOMAIN="streaming-patterns.example.com"

echo -e "${YELLOW}Updating domain URLs from ${OLD_DOMAIN} to ${NEW_DOMAIN}${NC}\n"

# Confirm before proceeding
echo "This will update URLs in:"
echo "  - index.html"
echo "  - public/robots.txt"
echo "  - public/sitemap.xml"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Cancelled${NC}"
  exit 1
fi

# Create backup
BACKUP_DIR=".backups/$(date +%Y%m%d_%H%M%S)"
echo -e "${YELLOW}Creating backup in ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"
cp index.html "$BACKUP_DIR/"
cp public/robots.txt "$BACKUP_DIR/"
cp public/sitemap.xml "$BACKUP_DIR/"

# Update files
echo -e "\n${YELLOW}Updating index.html...${NC}"
sed -i '' "s|${OLD_DOMAIN}|${NEW_DOMAIN}|g" index.html

echo -e "${YELLOW}Updating public/robots.txt...${NC}"
sed -i '' "s|${OLD_DOMAIN}|${NEW_DOMAIN}|g" public/robots.txt

echo -e "${YELLOW}Updating public/sitemap.xml...${NC}"
sed -i '' "s|${OLD_DOMAIN}|${NEW_DOMAIN}|g" public/sitemap.xml

# Show changes
echo -e "\n${GREEN}✓ URLs updated successfully!${NC}\n"

echo -e "${YELLOW}Changes made:${NC}"
echo "--------------------------------"
git diff --no-color index.html public/robots.txt public/sitemap.xml | grep -E "^[\+\-].*http" || echo "No URL changes detected"
echo "--------------------------------"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review changes: git diff"
echo "2. Test locally: npm run dev"
echo "3. Build: npm run build"
echo "4. Deploy: wrangler deploy"
echo ""
echo -e "${YELLOW}Backup saved in: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}To restore: cp ${BACKUP_DIR}/* .${NC}"
