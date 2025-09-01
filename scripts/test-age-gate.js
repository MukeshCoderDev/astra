#!/usr/bin/env node

/**
 * Age Gate Testing Script
 * 
 * This script helps test the age gate functionality by clearing localStorage
 * and providing instructions for testing different scenarios.
 */

console.log('🔞 Age Gate Testing Helper\n');

console.log('To test the age gate modal, follow these steps:\n');

console.log('1. 📝 Ensure .env.local has REACT_APP_ADULT=1');
console.log('   ✅ This has been created for you in .env.local\n');

console.log('2. 🧹 Clear browser localStorage to reset age consent:');
console.log('   - Open browser DevTools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Find localStorage for localhost:5173 (or your dev port)');
console.log('   - Delete these keys if they exist:');
console.log('     • age_ack');
console.log('     • age_ack_ts\n');

console.log('3. 🔄 Restart your development server:');
console.log('   npm run dev\n');

console.log('4. 🌐 Refresh your browser');
console.log('   The 18+ modal should now appear!\n');

console.log('🧪 Testing Scenarios:');
console.log('• First visit: Modal should appear');
console.log('• After clicking "I am 18+": Modal disappears and consent is stored');
console.log('• Subsequent visits: Modal should NOT appear (consent remembered)');
console.log('• After 90 days: Modal should appear again (consent expired)\n');

console.log('🔧 Troubleshooting:');
console.log('• If modal still doesn\'t appear, check browser console for errors');
console.log('• Verify REACT_APP_ADULT=1 in your environment');
console.log('• Make sure you cleared localStorage completely');
console.log('• Try incognito/private browsing mode for fresh state\n');

console.log('💡 Quick localStorage Clear (run in browser console):');
console.log('localStorage.removeItem("age_ack");');
console.log('localStorage.removeItem("age_ack_ts");');
console.log('location.reload();\n');

console.log('✅ Ready to test! The age gate should now work correctly.');