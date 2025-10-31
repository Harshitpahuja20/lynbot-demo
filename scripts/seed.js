const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please create a .env.local file with the following variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.error('JWT_SECRET=your_jwt_secret');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedDatabase() {
  try {
    console.log('Connecting to Supabase...');

    // Clear existing users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all users
    
    if (deleteError) {
      console.error('Error clearing users:', deleteError);
    }
    console.log('Cleared existing users');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('LyncBot123!', 12);
    const demoPasswordHash = await bcrypt.hash('demo123456', 12);

    // Create admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert([{
        email: 'admin@lyncbot.com',
        password_hash: adminPasswordHash,
        first_name: 'Admin',
        last_name: 'User',
        company: 'Lync Bot',
        role: 'admin',
        subscription: {
          plan: 'full_access',
          status: 'active'
        },
        email_verified: true,
        onboarding_complete: true,
        is_active: true
      }])
      .select();

    if (adminError) {
      console.error('Error creating admin user:', adminError);
    } else {
      console.log('Created admin user: admin@lyncbot.com / LyncBot123!');
    }

    // Create demo user
    const { data: demoUser, error: demoError } = await supabase
      .from('users')
      .insert([{
        email: 'demo@example.com',
        password_hash: demoPasswordHash,
        first_name: 'Demo',
        last_name: 'User',
        company: 'Demo Company',
        role: 'user',
        subscription: {
          plan: 'free',
          status: 'active'
        },
        email_verified: true,
        onboarding_complete: true,
        is_active: true
      }])
      .select();

    if (demoError) {
      console.error('Error creating demo user:', demoError);
    } else {
      console.log('Created demo user: demo@example.com / demo123456');
    }

    console.log('Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();