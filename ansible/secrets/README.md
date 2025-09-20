# Secrets Management

This directory contains template files for managing sensitive configuration values.

## Setup Instructions

1. **Copy template files:**
   ```bash
   cp staging_secrets.yml.example staging_secrets.yml
   cp production_secrets.yml.example production_secrets.yml
   ```

2. **Fill in actual values:**
   Edit the `.yml` files and replace placeholder values with real secrets.

3. **Encrypt files (recommended):**
   ```bash
   ansible-vault encrypt staging_secrets.yml
   ansible-vault encrypt production_secrets.yml
   ```

4. **Running playbooks with vault:**
   ```bash
   ansible-playbook -i inventory.yml playbooks/deploy.yml --ask-vault-pass
   ```

## File Structure

- `*_secrets.yml.example` - Template files (safe to commit)
- `*_secrets.yml` - Actual secret files (DO NOT commit)
- `README.md` - This documentation

## Security Notes

- Never commit actual secret files to version control
- Use strong, unique passwords for each environment
- Consider using ansible-vault for additional encryption
- Regularly rotate secrets in production

## Required Secrets

### Database
- `vault_*_db_password` - PostgreSQL database password

### Authentication
- `vault_*_jwt_secret` - JWT signing secret (use a strong random string)

### Google OAuth
- `vault_*_google_client_id` - Google OAuth Client ID
- `vault_*_google_client_secret` - Google OAuth Client Secret