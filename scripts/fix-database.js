require('dotenv').config({ path: '.env' })

async function fixDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    console.log('Adding email_accounts column to users table...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_accounts jsonb DEFAULT \'[]\'::jsonb'
      })
    })

    if (!response.ok) {
      // Try alternative approach using PostgREST
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Profile': 'public'
        },
        body: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_accounts jsonb DEFAULT \'[]\'::jsonb'
      })
      
      if (!altResponse.ok) {
        throw new Error('Could not execute SQL automatically')
      }
    }

    console.log('Successfully added email_accounts column!')
    
  } catch (error) {
    console.log('Automatic fix failed. Manual action required:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Run this command:')
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS email_accounts jsonb DEFAULT \'[]\'::jsonb;')
  }
}

fixDatabase()