# Unipile Integration Guide

## Overview
Unipile is now integrated as the primary method for LinkedIn authentication and automation. This provides secure OAuth-based authentication without storing LinkedIn passwords.

## What Changed

### 1. Backend (NestJS)
- **UnipileService** (`lync-nest/src/linkedin/unipile.service.ts`): Core service for Unipile API calls
- **UnipileController** (`lync-nest/src/linkedin/unipile.controller.ts`): REST endpoints for Unipile operations
- Added to `LinkedinModule` providers and controllers

### 2. Frontend (Next.js)
- **Settings Page** (`pages/settings.tsx`): Updated LinkedIn tab with Unipile OAuth button (recommended) and legacy form (fallback)
- **Callback Page** (`pages/unipile-callback.tsx`): Handles OAuth redirect after LinkedIn authentication
- **API Endpoints**:
  - `/api/unipile/connect`: Initiates Unipile connection
  - `/api/unipile/callback`: Saves account after OAuth (deprecated - using direct callback page)
  - `/api/user/linkedin-account`: Updated to support both Unipile and legacy methods

### 3. Database Schema
LinkedIn accounts now store:
```typescript
{
  unipile_account_id: string,  // Unipile account ID
  provider: 'unipile' | 'legacy',
  isActive: boolean,
  lastLogin: string,
  accountHealth: {
    status: string,
    lastCheck: string,
    restrictions: []
  }
}
```

## Setup Instructions

### 1. Environment Variables

**Backend** (`lync-nest/.env`):
```env
UNIPILE_API_URL=https://api8.unipile.com:13874/api/v1
UNIPILE_DSN=your-unipile-dsn-key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env.local`):
```env
NEST_API_URL=http://localhost:4000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 2. Get Unipile Credentials
1. Sign up at [Unipile](https://unipile.com)
2. Get your DSN key from the dashboard
3. Update `UNIPILE_DSN` in backend `.env`

### 3. User Flow

#### Recommended: Unipile OAuth
1. User clicks "Connect LinkedIn via Unipile" in Settings
2. Frontend calls `/api/unipile/connect`
3. Backend creates Unipile account and returns `hosted_auth_url`
4. User authenticates in popup window
5. Unipile redirects to `/unipile-callback?account_id=xxx`
6. Callback page saves account to database
7. Popup closes and refreshes parent window

#### Legacy: Direct Connection
1. User expands "Advanced: Direct Connection" section
2. Enters LinkedIn email/password
3. Credentials are encrypted and stored in database
4. Used for Playwright automation (existing flow)

## API Endpoints

### Unipile Service Methods
- `connectLinkedInAccount(userId)`: Create OAuth connection
- `getMessages(accountId)`: Fetch LinkedIn messages
- `sendMessage(accountId, attendees, text)`: Send message
- `searchProfiles(accountId, query)`: Search LinkedIn profiles
- `sendConnectionRequest(accountId, userId, message)`: Send connection request
- `getAccount(accountId)`: Get account info
- `disconnectAccount(accountId)`: Remove connection

### REST Endpoints (NestJS)
- `POST /unipile/connect`: Initiate connection
- `GET /unipile/messages?account_id=xxx`: Get messages
- `POST /unipile/messages`: Send message
- `GET /unipile/search?account_id=xxx&q=query`: Search profiles
- `POST /unipile/connect-request`: Send connection request
- `GET /unipile/account/:id`: Get account
- `DELETE /unipile/account/:id`: Disconnect

## Migration Path

### Phase 1: Dual Support (Current)
- Both Unipile and legacy methods work
- Unipile is recommended in UI
- Existing users can continue with legacy

### Phase 2: Unipile Primary (Future)
- Replace Playwright calls with Unipile API
- Update LinkedinService to use UnipileService
- Update LinkedinGateway WebSocket handlers

### Phase 3: Deprecate Legacy (Future)
- Remove password storage
- Remove Playwright automation
- Unipile only

## Testing

1. **Test Unipile Connection**:
   - Go to Settings → LinkedIn tab
   - Click "Connect LinkedIn via Unipile"
   - Complete OAuth in popup
   - Verify account appears in "Connected Accounts"

2. **Test Legacy Connection**:
   - Expand "Advanced: Direct Connection"
   - Enter credentials
   - Click "Save Direct Connection"
   - Verify account saved

## Security Benefits

### Unipile (Recommended)
✅ No password storage
✅ OAuth-based authentication
✅ Automatic token refresh
✅ LinkedIn-compliant API usage
✅ Better rate limiting
✅ Official LinkedIn integration

### Legacy (Fallback)
⚠️ Stores encrypted passwords
⚠️ Browser automation (Playwright)
⚠️ Risk of account restrictions
⚠️ Manual session management
⚠️ CAPTCHA challenges

## Troubleshooting

### Popup Blocked
- Allow popups for your domain
- Or manually open the `hosted_auth_url`

### Callback Not Working
- Check `FRONTEND_URL` in backend `.env`
- Verify callback page route exists
- Check browser console for errors

### Account Not Saving
- Verify JWT token is valid
- Check Supabase connection
- Review API logs for errors

## Next Steps

1. ✅ Unipile service created
2. ✅ Frontend OAuth flow implemented
3. ✅ Database schema updated
4. ⏳ Replace Playwright with Unipile API calls
5. ⏳ Update search/messaging to use Unipile
6. ⏳ Migrate existing users to Unipile
