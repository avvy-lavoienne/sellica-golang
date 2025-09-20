# Guest-to-Auth Conversion Feature

## Overview

The Guest-to-Auth Conversion feature provides a seamless way for anonymous users to create accounts while preserving their chat history and preferences. This feature automatically triggers conversion prompts based on user engagement patterns and provides a guided registration process.

## Features

### 🎯 **Automatic Trigger System**
- Triggers after 3+ guest interactions
- Respects user dismissal preferences
- Implements cooldown periods to avoid spam
- Tracks conversion attempts and eligibility

### 🔄 **Seamless Data Migration**
- Preserves complete conversation history
- Transfers user preferences and settings
- Maintains session continuity
- Validates data integrity during migration

### 📱 **Responsive UI Components**
- Modal, inline, and banner variants
- Mobile-optimized interface
- Progressive form with validation
- Real-time feedback and error handling

### 🔒 **Security & Privacy**
- Secure password requirements
- Data encryption during transfer
- Privacy consent management
- Rollback capabilities on failure

## Architecture

### Components

```
src/components/auth/
├── GuestConversionPrompt.tsx      # Main conversion UI component
├── GuestRegistrationForm.tsx      # Multi-step registration form
├── GuestConversionTrigger.tsx     # Integration component for chat interface
└── types.ts                       # TypeScript interfaces
```

### Services

```
src/services/auth/
└── guestConversionService.ts      # Business logic for conversion process
```

### Hooks

```
src/hooks/
└── useGuestConversion.ts          # React hook for conversion state management
```

## Usage

### Basic Integration

```tsx
import { GuestConversionTrigger } from '@/components/chatbot/GuestConversionTrigger'

function ChatInterface() {
  return (
    <div>
      {/* Your chat interface */}
      <GuestConversionTrigger variant="modal" showBenefits={true} />
    </div>
  )
}
```

### Custom Implementation

```tsx
import { useGuestConversion } from '@/hooks/useGuestConversion'
import { GuestConversionPrompt } from '@/components/auth/GuestConversionPrompt'

function CustomConversion() {
  const {
    guestSessionData,
    isEligibleForConversion,
    shouldShowPrompt,
    convertToAuth,
    dismissPrompt,
    skipConversion
  } = useGuestConversion({
    autoTrigger: true,
    minInteractions: 3,
    onConversionSuccess: (result) => {
      console.log('Conversion successful:', result)
    }
  })

  if (!shouldShowPrompt || !guestSessionData) return null

  return (
    <GuestConversionPrompt
      guestSessionData={guestSessionData}
      onConvert={convertToAuth}
      onDismiss={dismissPrompt}
      onSkip={skipConversion}
      variant="inline"
    />
  )
}
```

## Configuration

### Environment Variables

```env
# Session Management
SELLY_GUEST_SESSION_TTL=168  # 7 days in hours
SELLY_MAX_CONVERSION_ATTEMPTS=3

# Conversion Triggers
SELLY_MIN_INTERACTIONS_FOR_CONVERSION=3
SELLY_CONVERSION_COOLDOWN_HOURS=24

# Security
SELLY_ENABLE_CONVERSION_TRACKING=true
SELLY_REQUIRE_EMAIL_VERIFICATION=false
```

### Feature Flags

```typescript
const CONVERSION_FEATURE_FLAGS = {
  ENABLE_AUTO_TRIGGER: true,
  ENABLE_BENEFITS_DISPLAY: true,
  ENABLE_PROGRESSIVE_FORM: true,
  ENABLE_DATA_MIGRATION: true,
  ENABLE_SESSION_CONTINUITY: true
}
```

## API Reference

### GuestConversionPrompt Props

```typescript
interface ConversionPromptProps {
  guestSessionData: GuestSessionData
  onConvert: (userData: UserRegistrationData) => Promise<ConversionResult>
  onDismiss: () => void
  onSkip: () => void
  className?: string
  variant?: 'modal' | 'inline' | 'banner'
  showBenefits?: boolean
  autoTrigger?: boolean
}
```

### useGuestConversion Hook

```typescript
interface UseGuestConversionReturn {
  // State
  guestSessionData: GuestSessionData | null
  isEligibleForConversion: boolean
  shouldShowPrompt: boolean
  isConverting: boolean
  conversionError: string | null

  // Actions
  triggerConversionPrompt: () => void
  dismissPrompt: () => void
  skipConversion: () => void
  convertToAuth: (userData: UserRegistrationData) => Promise<ConversionResult>
  checkEligibility: () => Promise<boolean>

  // Utils
  getInteractionCount: () => number
  getConversionAttempts: () => number
}
```

### GuestConversionService Methods

```typescript
class GuestConversionService {
  // Main conversion method
  convertGuestToAuth(
    guestSessionData: GuestSessionData,
    userData: UserRegistrationData
  ): Promise<ConversionResult>

  // Eligibility checking
  isConversionEligible(guestSessionData: GuestSessionData): Promise<boolean>

  // Attempt tracking
  trackConversionAttempt(guestSessionId: string): Promise<void>
}
```

## Data Flow

### Conversion Process

1. **Trigger Detection**
   - Monitor guest session interactions
   - Check eligibility criteria
   - Respect dismissal preferences

2. **User Registration**
   - Progressive form validation
   - Password strength checking
   - Terms and privacy consent

3. **Account Creation**
   - Supabase user creation
   - Profile data insertion
   - Error handling and rollback

4. **Data Migration**
   - Conversation history transfer
   - User preferences migration
   - Session data validation

5. **Session Transition**
   - Create authenticated session
   - Update session storage
   - Clean up guest session

### Error Handling

```typescript
// Conversion errors are handled gracefully
interface ConversionResult {
  success: boolean
  userId?: string
  sessionId?: string
  error?: string
  migratedData?: {
    conversationCount: number
    preferencesTransferred: boolean
    sessionContinuity: boolean
  }
}
```

## Testing

### Unit Tests

```bash
# Run conversion component tests
npm test src/components/auth/__tests__/GuestConversionPrompt.test.tsx

# Run conversion service tests
npm test src/services/auth/__tests__/guestConversionService.test.ts

# Run hook tests
npm test src/hooks/__tests__/useGuestConversion.test.ts
```

### Integration Tests

```bash
# Run complete conversion flow test
npm test src/__tests__/integration/guestConversion.integration.test.tsx
```

### Manual Testing Checklist

- [ ] Conversion prompt appears after 3 interactions
- [ ] Registration form validates all fields
- [ ] Password strength indicator works
- [ ] Terms and privacy consent required
- [ ] Successful conversion preserves chat history
- [ ] Error states display appropriate messages
- [ ] Permanent dismissal works correctly
- [ ] Mobile interface is responsive
- [ ] Session continuity maintained

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Conversion components loaded on demand
   - Registration form rendered only when needed

2. **Caching**
   - Guest session data cached locally
   - Eligibility checks cached with TTL

3. **Debouncing**
   - Interaction counting debounced
   - Trigger checks rate-limited

4. **Memory Management**
   - Event listeners cleaned up properly
   - Component state reset on unmount

## Security Considerations

### Data Protection

1. **Password Security**
   - Minimum 8 characters required
   - Must include uppercase, lowercase, and numbers
   - Client-side validation with server verification

2. **Session Security**
   - Secure session token generation
   - Encrypted data transfer
   - Automatic session cleanup

3. **Privacy Compliance**
   - Explicit consent for data processing
   - Right to data deletion
   - Transparent data usage policies

### Error Handling

1. **Graceful Degradation**
   - Fallback to guest mode on conversion failure
   - Preserve user data during errors
   - Clear error messages in Indonesian

2. **Rollback Mechanisms**
   - Automatic cleanup on partial failures
   - Session restoration capabilities
   - Data integrity validation

## Troubleshooting

### Common Issues

1. **Conversion Not Triggering**
   - Check interaction count threshold
   - Verify session eligibility
   - Check dismissal status in localStorage

2. **Registration Errors**
   - Validate email format
   - Check password requirements
   - Verify Supabase configuration

3. **Data Migration Issues**
   - Check session manager connectivity
   - Verify Redis/localStorage availability
   - Validate session data format

### Debug Commands

```bash
# Check guest session data
localStorage.getItem('selly_current_session_id')

# Reset conversion dismissal
localStorage.removeItem('guest-conversion-dismissed')

# Check conversion eligibility
console.log(await guestConversion.checkEligibility())
```

## Future Enhancements

### Planned Features

1. **Social Login Integration**
   - Google OAuth conversion
   - Facebook login support
   - LinkedIn professional accounts

2. **Enhanced Analytics**
   - Conversion funnel tracking
   - A/B testing for prompts
   - User behavior analysis

3. **Advanced Personalization**
   - Dynamic prompt timing
   - Personalized benefits display
   - Smart retry strategies

4. **Enterprise Features**
   - Bulk user migration
   - Admin conversion dashboard
   - Advanced reporting tools
