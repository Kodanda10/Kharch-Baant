export const getEnvValue = (...keys: string[]): string | undefined => {
  const metaEnv = ((import.meta as any)?.env ?? {}) as Record<string, string | undefined>;

  for (const key of keys) {
    const value = metaEnv[key];
    if (value !== undefined && value !== '') {
      return value;
    }
  }

  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const value = process.env[key];
      if (value !== undefined && value !== '') {
        return value;
      }
    }
  }

  return undefined;
};
