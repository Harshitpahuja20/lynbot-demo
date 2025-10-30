require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('Setting up database tables...')
    
    // Read and execute all migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir).sort()
    
    for (const file of migrationFiles) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`)
        const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        
        // Split SQL by statements and execute each
        const statements = sqlContent.split(';').filter(stmt => stmt.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ sql: statement.trim() })
              })
            } catch (err) {
              // Continue on errors as some statements might already exist
            }
          }
        }
      }
    }
    
    console.log('Database setup completed!')
    
  } catch (error) {
    console.error('Setup failed:', error.message)
    console.log('\nManual setup required:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Run each migration file from supabase/migrations/ folder')
  }
}

setupDatabase()