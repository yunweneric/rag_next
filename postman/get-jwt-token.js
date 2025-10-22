/**
 * Helper script to get JWT token from your API
 * Run this script to get your JWT token for Postman testing
 * 
 * Usage:
 * 1. Update the configuration below
 * 2. Run: node get-jwt-token.js
 */

// Configuration - Update these values
const API_BASE_URL = 'http://localhost:3000'
const EMAIL = 'your-email@example.com'
const PASSWORD = 'your-password'

async function getJWTToken() {
  try {
    console.log('🔐 Authenticating with API...')
    
    // Login with email and password
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Authentication failed:', errorData.error)
      return
    }
    
    const data = await response.json()
    
    if (!data.success || !data.token) {
      console.error('❌ No token in response')
      return
    }
    
    console.log('✅ Authentication successful!')
    console.log('👤 User:', data.user.email)
    console.log('📋 JWT Token:')
    console.log(data.token)
    console.log('')
    console.log('📝 Copy this token and paste it into your Postman environment:')
    console.log('   - Open Postman')
    console.log('   - Go to Environments')
    console.log('   - Select "Swiss Legal Chat API Environment"')
    console.log('   - Set jwt_token = ' + data.token)
    console.log('')
    console.log('🚀 You can now test the API endpoints!')
    
  } catch (error) {
    console.error('❌ Error getting JWT token:', error.message)
  }
}

// Alternative: Register a new user
async function registerAndGetToken() {
  try {
    console.log('📝 Registering new user...')
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'testuser',
        full_name: 'Test User'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Registration failed:', errorData.error)
      return
    }
    
    const data = await response.json()
    
    if (!data.success || !data.token) {
      console.error('❌ No token in response')
      return
    }
    
    console.log('✅ Registration successful!')
    console.log('👤 User:', data.user.email)
    console.log('📋 JWT Token:')
    console.log(data.token)
    console.log('')
    console.log('📝 Copy this token and paste it into your Postman environment:')
    console.log('   - Open Postman')
    console.log('   - Go to Environments')
    console.log('   - Select "Swiss Legal Chat API Environment"')
    console.log('   - Set jwt_token = ' + data.token)
    console.log('')
    console.log('🚀 You can now test the API endpoints!')
    
  } catch (error) {
    console.error('❌ Error registering user:', error.message)
  }
}

// Run the function
console.log('Choose an option:')
console.log('1. Login with existing credentials')
console.log('2. Register new user')
console.log('')

// For now, try login first, then register if it fails
getJWTToken().catch(() => {
  console.log('Login failed, trying to register new user...')
  registerAndGetToken()
})
