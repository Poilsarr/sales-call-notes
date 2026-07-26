
export function getSecret(key: string): string {
  return (process.env[key] || '').trim();
}
