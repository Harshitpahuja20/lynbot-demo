-- Create default users
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  email_verified,
  onboarding_complete,
  is_active
) VALUES 
(
  'admin@lyncbot.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9S2', -- LyncBot123!
  'Admin',
  'User',
  'admin',
  true,
  true,
  true
),
(
  'demo@example.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo123456
  'Demo',
  'User',
  'user',
  true,
  true,
  true
);