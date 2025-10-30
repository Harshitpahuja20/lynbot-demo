require('dotenv').config({ path: '.env' })
const { userOperations } = require('../lib/database.ts')

async function testUserCreation() {
  try {
    console.log('Testing user creation...')
    
    const testUser = {
      email: 'test@example.com',
      password_hash: 'hashedpassword123',
      first_name: 'Test',
      last_name: 'User',
      company: 'Test Company',
      role: 'user',
      email_verified: true,
      onboarding_complete: true,
      is_active: true,
      email_accounts: [],
      subscription: { plan: 'free', status: 'inactive' },
      linkedin_accounts: [],
      api_keys: {},
      settings: {
        timezone: 'UTC',
        workingHours: { start: 9, end: 18 },
        workingDays: [1, 2, 3, 4, 5],
        automation: {
          enabled: false,
          connectionRequests: { enabled: false },
          welcomeMessages: { enabled: false },
          followUpMessages: { enabled: false },
          profileViews: { enabled: false }
        },
        notifications: {
          email: true,
          webhook: false
        }
      },
      usage: {
        totalConnections: 0,
        totalMessages: 0,
        totalCampaigns: 0,
        totalProspects: 0
      }
    }
    
    const user = await userOperations.create(testUser)
    console.log('✅ User created successfully:', user.email)
    
    // Clean up test user
    await userOperations.delete(user.id)
    console.log('✅ Test user cleaned up')
    
  } catch (error) {
    console.error('❌ User creation failed:', error.message)
  }
}

testUserCreation()