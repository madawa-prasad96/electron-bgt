// Test script to verify the login fix
console.log('Testing login fix...');

// Simulate the initial state
console.log('Initial state:');
console.log('- Dashboard container should be hidden');
console.log('- Login form should be visible');

// Simulate successful login
console.log('\nSimulating successful login...');
localStorage.setItem('currentUser', JSON.stringify({id: 1, username: 'admin', role: 'superadmin'}));

console.log('After login:');
console.log('- Dashboard container should be visible');
console.log('- Login form should be hidden');

// Clean up
localStorage.removeItem('currentUser');

console.log('\nTest completed.');