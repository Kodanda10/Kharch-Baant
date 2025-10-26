import { suggestTagForDescription } from './services/geminiService.ts';

async function testGeminiService() {
    console.log('🔍 Testing Gemini Code Assist Service...\n');
    
    // Test cases
    const testDescriptions = [
        'Lunch at McDonald\'s',
        'Uber ride to office',
        'Netflix subscription',
        'Groceries from Walmart',
        'Doctor visit copay'
    ];
    
    console.log('📝 Test descriptions:');
    testDescriptions.forEach((desc, i) => console.log(`${i + 1}. ${desc}`));
    console.log('');
    
    for (let i = 0; i < testDescriptions.length; i++) {
        const description = testDescriptions[i];
        console.log(`Testing: "${description}"`);
        
        try {
            const startTime = Date.now();
            const suggestedTag = await suggestTagForDescription(description);
            const endTime = Date.now();
            
            if (suggestedTag) {
                console.log(`✅ Suggested tag: "${suggestedTag}" (${endTime - startTime}ms)`);
            } else {
                console.log(`⚠️  No tag suggested (service may be disabled or API key missing) (${endTime - startTime}ms)`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        console.log('');
    }
    
    // Check if API key is configured
    console.log('🔑 Checking API key configuration...');
    const viteEnv = import.meta?.env ?? {};
    const hasApiKey = !!(
        viteEnv.VITE_GEMINI_API_KEY ||
        viteEnv.GEMINI_API_KEY ||
        (typeof process !== 'undefined' && (
            process.env.VITE_GEMINI_API_KEY || 
            process.env.GEMINI_API_KEY || 
            process.env.API_KEY
        ))
    );
    
    if (hasApiKey) {
        console.log('✅ API key is configured');
    } else {
        console.log('❌ No Gemini API key found in environment variables');
        console.log('   Expected variables: VITE_GEMINI_API_KEY, GEMINI_API_KEY, or API_KEY');
        console.log('   You may need to create a .env file with your Gemini API key');
    }
}

testGeminiService().catch(console.error);