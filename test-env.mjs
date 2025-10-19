// Quick environment validation test
import { validateEnvironment, logEnvironmentStatus } from './utils/envValidation.js';

console.log('🔍 Environment Validation Test');
console.log('=====================================\n');

// Test environment validation
const envResult = logEnvironmentStatus();

console.log('\n📊 Environment Details:');
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('- VITE_API_MODE:', import.meta.env.VITE_API_MODE || 'Not set (will default to mock)');
console.log('- VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Set' : '⚠️ Not set (Gemini features disabled)');

console.log('\n🚀 Status Summary:');
if (envResult.isValid) {
    console.log('✅ Your app is ready for production!');
    console.log('✅ All required environment variables are configured');
    console.log('✅ Supabase connection should work');
    
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.log('💡 Tip: Set VITE_GEMINI_API_KEY to enable AI-powered expense tag suggestions');
    }
} else {
    console.log('❌ Some configuration issues found');
    console.log('Missing variables:', envResult.missing);
}

console.log('\n🌐 You can now:');
console.log('- Create groups and add expenses');
console.log('- Track shared expenses with friends');
console.log('- Settle up balances');
console.log('- Export data as images');

if (envResult.warnings.length > 0) {
    console.log('\n⚠️ Warnings:', envResult.warnings);
}