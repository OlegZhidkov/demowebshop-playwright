export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name} in .env (see .env.example) or as a CI secret`);
  }
  return value;
}
