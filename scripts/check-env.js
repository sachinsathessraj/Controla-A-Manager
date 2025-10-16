// Simple script to check environment variables
require('dotenv').config();

console.log('Environment Variables:');
console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

// Check if the anon key is valid
console.log('\nAnon Key Validation:');
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
if (anonKey) {
  const parts = anonKey.split('.');
  console.log(`- Key format: ${parts.length === 3 ? '✅ Valid JWT format' : '❌ Invalid JWT format'}`);
  if (parts.length === 3) {
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      console.log(`- Key type: ${header.typ || '❌ Missing'}`);
      console.log(`- Algorithm: ${header.alg || '❌ Missing'}`);
      console.log(`- Issuer: ${payload.iss || '❌ Missing'}`);
      console.log(`- Role: ${payload.role || '❌ Missing'}`);
      console.log(`- Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : '❌ Missing'}`);
      
      if (payload.exp) {
        const isExpired = payload.exp < now;
        console.log(`- Status: ${isExpired ? '❌ Expired' : '✅ Valid'}`);
      }
    } catch (err) {
      console.log('- Error parsing JWT:', err.message);
    }
  }
}
