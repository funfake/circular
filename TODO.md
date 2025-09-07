# BlackBox AI Integration - Runtime Error Fix & API Merge

## Issues Fixed
1. **Runtime Error**: `ArgumentValidationError: Object is missing the required field 'userId'` in `blackboxApi:getUserDashboard`
2. **API Conflicts**: Duplicate BlackBox AI API files in `api/blackbox-ai/convex/` and main `convex/` directory

## Root Causes
1. The `useBlackBoxIntegration` hook was calling `useQuery` for `getUserDashboard` and `getRecentActivity` without required parameters
2. Conflicting API implementations between the separate API directory and main convex directory

## Changes Made

### ✅ lib/blackbox-integration.ts
- Removed `getUserDashboard` and `getRecentActivity` from the main `useBlackBoxIntegration` hook
- Created separate parameterized hooks:
  - `useUserDashboard(userId: Id<"users"> | undefined)`
  - `useRecentActivity(userId: Id<"users"> | undefined)`
- Both new hooks use "skip" when userId is undefined to prevent validation errors
- Added null checks for user and repository creation
- Fixed priority field handling in ticket creation

### ✅ convex/blackboxApi.ts
- Merged and consolidated all BlackBox AI functionality into single file
- Uses direct database operations instead of circular API calls
- Properly handles `blackboxTickets` table (separate from Jira `tickets`)
- Implements user and repository creation with duplicate checking
- All functions now work with the merged schema

### ✅ Schema Integration
- Main `convex/schema.ts` already contains merged schema with:
  - Project management tables (`projects`, `tickets`, `jobs`, etc.)
  - BlackBox AI tables (`users`, `repositories`, `blackboxTickets`, `developmentTasks`)
- Proper table separation: `tickets` for Jira, `blackboxTickets` for BlackBox AI

### ✅ Cleanup
- Removed duplicate `api/blackbox-ai/` directory
- Removed redundant `convex/blackboxTickets.ts` file
- Consolidated all BlackBox functionality into main convex directory

## Impact
- ✅ Fixed runtime validation error
- ✅ Resolved API conflicts and duplications
- ✅ Maintained backward compatibility for existing components
- ✅ BlackBox demo page continues to work without changes
- ✅ Clean, consolidated codebase structure
- ✅ No circular dependencies or TypeScript errors

## Usage
For components that need user dashboard or recent activity data:
```typescript
import { useUserDashboard, useRecentActivity } from "@/lib/blackbox-integration";

// In component:
const userDashboard = useUserDashboard(userId);
const recentActivity = useRecentActivity(userId);
```

For the main BlackBox integration:
```typescript
import { useBlackBoxIntegration } from "@/lib/blackbox-integration";

const {
  createUserWithRepo,
  createAndProcessTicket,
  retryFailedTasks,
  getSystemStats,
} = useBlackBoxIntegration();
```

## Status: COMPLETED ✅
All conflicts resolved, API merged, and runtime errors fixed.
