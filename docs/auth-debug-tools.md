# Authentication Debug Tools

This document describes the authentication debugging tools available in the development environment.

## Overview

The authentication debug tools provide comprehensive debugging capabilities for the authentication system, including:

- Real-time authentication state monitoring
- Consistency checking and auto-repair
- Debug logging and snapshots
- Scenario simulation for testing
- Visual debugging panel

## Components

### 1. AuthStateDebugger (`utils/authStateDebugger.ts`)

The core debugging utility that provides:

- **State Snapshots**: Captures authentication state across localStorage, cookies, and the auth manager
- **Consistency Checking**: Detects inconsistencies between different storage locations
- **Auto-repair**: Automatically fixes common authentication state issues
- **Debug Logging**: Structured logging with different levels (info, warn, error, debug)
- **Scenario Simulation**: Simulates common authentication scenarios for testing

#### Usage

```typescript
import { authStateDebugger } from '@/utils/authStateDebugger';

// Log debug information
authStateDebugger.log('info', 'user_action', { action: 'login_attempt' });

// Take a state snapshot
const snapshot = authStateDebugger.takeSnapshot();

// Check for inconsistencies
const issues = authStateDebugger.checkConsistency();

// Auto-fix issues
const result = await authStateDebugger.autoFix();

// Simulate scenarios
authStateDebugger.simulateScenario('token_expired');
```

### 2. AuthDebugPanel (`components/debug/AuthDebugPanel.tsx`)

A comprehensive React component that provides a visual interface for debugging:

- **Current State Tab**: Shows real-time authentication state
- **Logs Tab**: Displays debug logs with filtering and search
- **Issues Tab**: Shows detected inconsistencies with auto-fix options
- **Tools Tab**: Provides debugging actions and scenario simulation

### 3. AuthDebugTrigger (`components/debug/AuthDebugTrigger.tsx`)

A floating button that opens the debug panel:

- Only visible in development environment
- Keyboard shortcut: `Ctrl/Cmd + Shift + D`
- Configurable position (top-left, top-right, bottom-left, bottom-right)

### 4. Debug Hooks (`hooks/useAuthDebug.ts`)

React hooks for integrating debugging into components:

- **useAuthDebug**: Provides logging functions for components
- **useAuthStateMonitor**: Monitors localStorage and cookie changes
- **useAuthConsistencyChecker**: Automatically checks for consistency issues

## Integration

### Adding to Your Application

1. **Add the debug integration to your main layout**:

```tsx
// app/layout.tsx or similar
import { AuthDebugIntegration } from '@/components/debug/AuthDebugIntegration';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <AuthDebugIntegration />
      </body>
    </html>
  );
}
```

2. **Use debug hooks in components**:

```tsx
import { useAuthDebug } from '@/hooks/useAuthDebug';

export function LoginForm() {
  const { logAuthAction, logAuthError } = useAuthDebug('LoginForm');
  
  const handleLogin = async (credentials) => {
    logAuthAction('login_attempt', { email: credentials.email });
    
    try {
      const result = await login(credentials);
      logAuthAction('login_success', { userId: result.user.id });
    } catch (error) {
      logAuthError('login_failed', error);
    }
  };
  
  // ... rest of component
}
```

## Features

### State Monitoring

The debugger continuously monitors:

- **localStorage**: `token`, `user`, `authState` keys
- **Cookies**: Authentication-related cookies
- **Auth Manager**: Current authentication state
- **Cross-tab Events**: Authentication events from other browser tabs

### Consistency Checking

Automatically detects:

- **Token Mismatches**: Different tokens in localStorage, cookies, and auth manager
- **User Data Mismatches**: Inconsistent user data between storage locations
- **State Logic Issues**: Authentication state that doesn't match token presence
- **Missing Data**: Required authentication data that's missing

### Auto-repair Functionality

Can automatically fix:

- **Token Synchronization**: Syncs tokens across all storage locations
- **User Data Sync**: Ensures user data consistency
- **State Correction**: Fixes authentication state logic issues
- **Storage Cleanup**: Removes orphaned or corrupted data

### Scenario Simulation

Test common scenarios:

- **Token Expiration**: Simulates expired token scenarios
- **User Logout**: Simulates logout from another tab
- **Storage Corruption**: Simulates corrupted localStorage data
- **Network Issues**: Simulates network-related authentication failures

## Debug Panel Interface

### Current State Tab

Shows real-time view of:
- Auth Manager state
- localStorage contents
- Cookie values
- SessionStorage data

### Logs Tab

Displays:
- Chronological debug logs
- Log level filtering (info, warn, error, debug)
- Expandable log details
- Stack traces for errors

### Issues Tab

Shows:
- Detected inconsistencies
- Severity levels (low, medium, high)
- Auto-fixable indicators
- Detailed comparison of expected vs actual values

### Tools Tab

Provides:
- Manual refresh button
- Auto-fix all issues button
- Clear logs button
- Export debug data button
- Scenario simulation buttons

## Keyboard Shortcuts

- **Ctrl/Cmd + Shift + D**: Toggle debug panel
- **Auto-refresh**: Toggle automatic data refresh in debug panel

## Development vs Production

### Development Environment

- All debugging features are active
- Debug panel is accessible
- Detailed logging to console
- Global debug objects available (`window.__authDebugger`)

### Production Environment

- All debugging features are disabled
- No performance impact
- No debug data collection
- Debug panel is hidden

## Troubleshooting Common Issues

### 1. Authentication State Inconsistencies

**Symptoms**: User appears logged in but can't access protected resources

**Debug Steps**:
1. Open debug panel (`Ctrl/Cmd + Shift + D`)
2. Check "Issues" tab for inconsistencies
3. Click "Auto Fix Issues" button
4. Verify state in "Current State" tab

### 2. Cross-tab Authentication Issues

**Symptoms**: Login state not syncing between browser tabs

**Debug Steps**:
1. Check logs for cross-tab sync events
2. Verify localStorage and cookie consistency
3. Look for storage event listeners in logs
4. Test with scenario simulation

### 3. Token Expiration Issues

**Symptoms**: Unexpected logouts or authentication failures

**Debug Steps**:
1. Check token values in different storage locations
2. Look for token refresh events in logs
3. Simulate token expiration scenario
4. Verify auto-refresh mechanisms

### 4. Google OAuth Issues

**Symptoms**: Google login failures or inconsistent state

**Debug Steps**:
1. Check OAuth callback logs
2. Verify Google token validation
3. Look for user creation/update events
4. Check for OAuth-specific error codes

## API Reference

### AuthStateDebugger Methods

```typescript
// Logging
log(level: 'info' | 'warn' | 'error' | 'debug', action: string, data: any): void

// State management
takeSnapshot(): AuthStateSnapshot
checkConsistency(): AuthStateInconsistency[]
autoFix(): Promise<{ fixed: number; errors: string[] }>

// Utilities
getDebugInfo(): DebugInfo
clearDebugData(): void
exportDebugData(): string
simulateScenario(scenario: 'token_expired' | 'user_logout' | 'storage_corruption'): void
```

### Debug Hooks

```typescript
// Component debugging
useAuthDebug(componentName: string): {
  logAuthAction: (action: string, data: any) => void;
  logAuthError: (action: string, error: any) => void;
  takeSnapshot: () => AuthStateSnapshot;
  checkConsistency: () => AuthStateInconsistency[];
}

// State monitoring
useAuthStateMonitor(): void

// Consistency checking
useAuthConsistencyChecker(intervalMs?: number): void
```

## Best Practices

1. **Use Descriptive Action Names**: Make log actions descriptive and consistent
2. **Include Relevant Context**: Add useful context data to logs
3. **Handle Errors Gracefully**: Always log errors with sufficient detail
4. **Regular Consistency Checks**: Use the consistency checker periodically
5. **Test Edge Cases**: Use scenario simulation to test edge cases
6. **Export Debug Data**: Export debug data when reporting issues

## Performance Considerations

- Debug tools only run in development environment
- Minimal performance impact in production (all features disabled)
- Log history is limited to prevent memory leaks
- Automatic cleanup of old snapshots and logs
- Efficient event listeners with proper cleanup

## Security Considerations

- Sensitive data is automatically masked in logs
- Debug data is only available in development
- No debug information is sent to external services
- Local storage of debug data only
- Proper cleanup on component unmount