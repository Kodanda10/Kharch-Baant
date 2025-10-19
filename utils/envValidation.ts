/**
 * Environment validation utilities for production readiness
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_MODE',
    'VITE_CLERK_PUBLISHABLE_KEY'
  ],
  optional: [
    'VITE_GEMINI_API_KEY',
    'VITE_DEBUG_ENABLED',
    'VITE_DEV_MODE'
  ]
};

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  config: Record<string, string | undefined>;
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const config: Record<string, string | undefined> = {};

  // Check required variables
  ENV_CONFIG.required.forEach(key => {
    const value = import.meta.env[key];
    config[key] = value;
    
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  });

  // Check optional variables and add warnings
  ENV_CONFIG.optional.forEach(key => {
    const value = import.meta.env[key];
    config[key] = value;
    
    if (key === 'VITE_GEMINI_API_KEY' && (!value || value.trim() === '')) {
      warnings.push('VITE_GEMINI_API_KEY is not set - AI tag suggestions will be disabled');
    }
  });

  // Production-specific checks
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_DEBUG_ENABLED === 'true') {
      warnings.push('Debug mode is enabled in production');
    }
    
    // Check for placeholder values
    if (config.VITE_SUPABASE_URL?.includes('your_supabase_project_url')) {
      missing.push('VITE_SUPABASE_URL (contains placeholder value)');
    }
    
    if (config.VITE_SUPABASE_ANON_KEY?.includes('your_supabase_anon_key')) {
      missing.push('VITE_SUPABASE_ANON_KEY (contains placeholder value)');
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config
  };
}

/**
 * Logs environment validation results to console
 */
export function logEnvironmentStatus(): EnvValidationResult {
  const result = validateEnvironment();
  
  if (result.isValid) {
    console.log('✅ Environment validation passed');
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:', result.warnings);
    }
  } else {
    console.error('❌ Environment validation failed');
    console.error('Missing required variables:', result.missing);
    if (result.warnings.length > 0) {
      console.warn('Additional warnings:', result.warnings);
    }
  }
  
  return result;
}

/**
 * Gets a typed environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  return import.meta.env[key] || fallback;
}

/**
 * Gets a boolean environment variable
 */
export function getEnvBool(key: string, fallback = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}