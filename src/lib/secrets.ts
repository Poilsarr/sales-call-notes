
export function getSecret(key: string): string {
  if (process.env.NODE_ENV === 'production') {
    // Production: integrate with AWS Secrets Manager or HashiCorp Vault
    // fallback to process.env
    return process.env[key] || '';
  }
  return process.env[key] || '';
}
