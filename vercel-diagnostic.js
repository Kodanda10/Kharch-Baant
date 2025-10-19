#!/usr/bin/env node

/**
 * Quick diagnostic to check what's loaded on Vercel
 * 
 * Instructions:
 * 1. Open your Vercel app: https://kharch-baant-psi.vercel.app
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Copy-paste this entire script and press Enter
 * 5. Share the output with me
 */

console.log('=== VERCEL DEPLOYMENT DIAGNOSTIC ===\n');

// 1. Check if React is loaded
console.log('1. React loaded?', typeof React !== 'undefined' ? '✅ Yes' : '❌ No');

// 2. Check if app root exists
const root = document.getElementById('root');
console.log('2. Root div exists?', root ? '✅ Yes' : '❌ No');
if (root) {
  console.log('   Root innerHTML length:', root.innerHTML.length);
  console.log('   Root has content?', root.innerHTML.length > 0 ? '✅ Yes' : '❌ No (empty)');
}

// 3. Check environment variables (if accessible)
console.log('\n3. Environment Variables:');
try {
  // In production, these won't be directly accessible, but we can check if they exist in the build
  console.log('   Note: Env vars are embedded at build time, not runtime');
  console.log('   Check Network tab for actual API calls to see if they use correct URLs');
} catch (e) {
  console.log('   ❌ Error checking env vars:', e.message);
}

// 4. Check for JavaScript errors
console.log('\n4. JavaScript Errors on Page:');
const errors = [];
window.addEventListener('error', (e) => {
  errors.push(e.message);
  console.log('   ❌ Error:', e.message);
});
if (errors.length === 0) {
  console.log('   ℹ️ No errors captured yet (check above for any red errors)');
}

// 5. Check network requests
console.log('\n5. Check Network Tab:');
console.log('   - Look for requests to clerk.accounts.dev');
console.log('   - Look for requests to supabase.co');
console.log('   - Any 401/403/CORS errors?');

// 6. Check Clerk specifically
console.log('\n6. Clerk Status:');
setTimeout(() => {
  if (typeof window.Clerk !== 'undefined') {
    console.log('   ✅ Clerk loaded');
  } else {
    console.log('   ❌ Clerk not loaded - likely the issue!');
    console.log('   → Check if VITE_CLERK_PUBLISHABLE_KEY is set in Vercel');
    console.log('   → Check if your Vercel domain is whitelisted in Clerk dashboard');
  }
}, 2000);

// 7. Page load state
console.log('\n7. Page State:');
console.log('   Document ready state:', document.readyState);
console.log('   Page fully loaded?', document.readyState === 'complete' ? '✅ Yes' : '⏳ Loading...');

console.log('\n=== END DIAGNOSTIC ===');
console.log('\nℹ️ Share this entire output so I can help debug!\n');
