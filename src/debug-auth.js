// Debug script to test authentication and API calls
const API_BASE_URL = 'https://abst-fullstack-production.up.railway.app';

async function debugAuth() {
  console.log('=== Frontend Authentication Debug ===');
  
  // Test 1: Check if token exists in localStorage
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  console.log('1. Local Storage Check:');
  console.log('   Token exists:', !!token);
  console.log('   User exists:', !!user);
  if (token) {
    console.log('   Token preview:', token.substring(0, 20) + '...');
  }
  if (user) {
    console.log('   User:', JSON.parse(user));
  }
  
  // Test 2: Check axios default headers
  console.log('\n2. Axios Headers Check:');
  console.log('   Authorization header:', window.axios?.defaults?.headers?.common?.Authorization);
  
  // Test 3: Test login
  console.log('\n3. Testing Login:');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'superpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login response:', loginData);
    
    if (loginData.token) {
      // Test 4: Test residents API with token
      console.log('\n4. Testing Residents API:');
      const residentsResponse = await fetch(`${API_BASE_URL}/api/residents/?facility_id=73`, {
        headers: {
          'Authorization': `Token ${loginData.token}`,
          'Accept': 'application/json'
        }
      });
      
      const residentsData = await residentsResponse.json();
      console.log('   Residents response:', residentsData);
      console.log('   Total residents:', residentsData.count);
      console.log('   First few residents:', residentsData.results?.slice(0, 3));
    }
  } catch (error) {
    console.error('   Error:', error);
  }
}

// Run the debug function
debugAuth(); 