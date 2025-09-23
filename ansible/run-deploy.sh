#!/bin/bash

# T-SHARE Deployment Script
# Usage: ./run-deploy.sh [staging|production] [deploy|init]

set -e

# Parse arguments
ENVIRONMENT=${1:-staging}
ACTION=${2:-deploy}

# Validate arguments
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    echo "Usage: $0 [staging|production] [deploy|init]"
    exit 1
fi

if [[ ! "$ACTION" =~ ^(deploy|init)$ ]]; then
    echo "❌ Error: Action must be 'deploy' or 'init'"
    echo "Usage: $0 [staging|production] [deploy|init]"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting T-SHARE ${ACTION} for ${ENVIRONMENT} environment${NC}"
echo "=================================================="

# Check if ansible-playbook is available
if ! command -v ansible-playbook &> /dev/null; then
    echo -e "${RED}❌ Error: ansible-playbook not found. Please install Ansible.${NC}"
    exit 1
fi

# Check if inventory file exists
INVENTORY_FILE="inventory.yml"
if [[ ! -f "$INVENTORY_FILE" ]]; then
    echo -e "${RED}❌ Error: Inventory file ${INVENTORY_FILE} not found.${NC}"
    exit 1
fi

# Check if secrets file exists
SECRETS_FILE="secrets/${ENVIRONMENT}_secrets.yml"
if [[ ! -f "$SECRETS_FILE" ]]; then
    echo -e "${RED}❌ Error: Secrets file ${SECRETS_FILE} not found.${NC}"
    echo -e "${YELLOW}Please create the secrets file from the example:${NC}"
    echo "cp secrets/${ENVIRONMENT}_secrets.yml.example $SECRETS_FILE"
    echo "Then edit the file with your actual secrets."
    exit 1
fi

# Select playbook based on action
if [[ "$ACTION" == "init" ]]; then
    PLAYBOOK="playbooks/init.yml"
    echo -e "${YELLOW}⚠️  WARNING: This will completely reset the database and all data will be lost!${NC}"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🛑 Operation cancelled.${NC}"
        exit 0
    fi
else
    PLAYBOOK="playbooks/deploy.yml"
fi

# Check if playbook exists
if [[ ! -f "$PLAYBOOK" ]]; then
    echo -e "${RED}❌ Error: Playbook ${PLAYBOOK} not found.${NC}"
    exit 1
fi

# Display configuration
echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Environment: $ENVIRONMENT"
echo "   Action: $ACTION"
echo "   Playbook: $PLAYBOOK"
echo "   Inventory: $INVENTORY_FILE"
echo "   Secrets: $SECRETS_FILE"
echo

# Run ansible-playbook
echo -e "${GREEN}🎯 Executing Ansible playbook...${NC}"
ansible-playbook \
    -i "$INVENTORY_FILE" \
    --limit "$ENVIRONMENT" \
    "$PLAYBOOK" \
    --vault-password-file <(echo "your-vault-password") \
    -v

ANSIBLE_EXIT_CODE=$?

if [[ $ANSIBLE_EXIT_CODE -eq 0 ]]; then
    echo
    # Capitalize first letter of ACTION for display
    ACTION_DISPLAY="$(echo ${ACTION:0:1} | tr '[:lower:]' '[:upper:]')${ACTION:1}"
    echo -e "${GREEN}🎉 ${ACTION_DISPLAY} completed successfully!${NC}"

    if [[ "$ACTION" == "deploy" ]]; then
        echo -e "${BLUE}📱 Next steps:${NC}"
        echo "   1. Access your application"
        echo "   2. Check logs if needed: ansible-playbook -i $INVENTORY_FILE --limit $ENVIRONMENT playbooks/logs.yml"
        echo "   3. To initialize with fresh data: $0 $ENVIRONMENT init"
        echo
        echo -e "${YELLOW}ℹ️  Note: 'deploy' preserves existing database data and only runs migrations${NC}"
    elif [[ "$ACTION" == "init" ]]; then
        echo -e "${BLUE}🔑 Default credentials:${NC}"
        echo "   Username: admin@template-share.com"
        echo "   Password: admin123"
        echo
        echo -e "${BLUE}📱 Access your application and change the default password!${NC}"
        echo -e "${RED}⚠️  Warning: 'init' completely resets the database and all data${NC}"
    fi
else
    echo
    echo -e "${RED}❌ ${ACTION^} failed with exit code $ANSIBLE_EXIT_CODE${NC}"
    echo -e "${YELLOW}💡 Check the output above for error details.${NC}"
    exit $ANSIBLE_EXIT_CODE
fi