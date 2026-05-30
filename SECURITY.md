# Security Policy & Guidance

## Credential Management

### Database Credentials
We have implemented dynamic connection string assembly in `src/lib/prisma.ts`. To enhance security:
- Use individual environment variables (`DB_USER`, `DB_PASSWORD`, etc.) instead of a single `DATABASE_URL`.
- In production, these should be managed via a Secret Manager (e.g., AWS Secrets Manager, HashiCorp Vault).

### OAuth Secret Rotation
OAuth client secrets for Google, HubSpot, Salesforce, and Teams are stored in environment variables. 

**Rotation Policy:**
1. **Frequency**: Rotate secrets every 90 days.
2. **Procedure**: 
   - Generate a new secret in the provider's developer console.
   - Update the environment variable in the deployment platform (e.g., Vercel).
   - Trigger a redeploy to apply changes.
   - Revoke the old secret after confirming the new one is operational.
3. **Compromise**: If a secret is leaked, rotate immediately and audit access logs.

## Input Validation & Sanitization

### File Uploads
- Files are validated using magic byte detection and MIME type whitelisting.
- Maximum size limit is 100MB.
- Temporary files are stored in the OS temporary directory (`os.tmpdir()`) to avoid path traversal.

### AI Script Execution
- Python scripts for PII redaction, diarization, and language detection are executed using `child_process.spawn`.
- Sensitive data (like PII text) is passed via `stdin` to prevent shell injection and avoid command-line argument length restrictions.
- Absolute paths are used for all script references via `path.resolve(process.cwd(), ...)`.

## Recommendations for Production
- **Secret Management**: Migrate from `.env` files to a dedicated Secret Manager.
- **Security Headers**: Implement CSP, HSTS, and X-Frame-Options headers.
- **Audit Logging**: Implement logging for sensitive administrative operations.
- **Dependency Audits**: Run `npm audit --audit-level=high` regularly.
