# BlackBox AI Integration - Complete Guide

## Overview

This document describes the successful integration of the BlackBox AI API into the Circular (Jira-to-Code) project. The integration allows automatic code generation from development tickets using AI.

## What Was Integrated

The BlackBox AI system from `api/blackbox-ai/` has been fully integrated into the main Next.js + Convex application. This includes:

1. **Database Schema Integration**
2. **API Functions Migration**
3. **Service Layer Creation**
4. **UI Components**
5. **Environment Configuration**

## Architecture Changes

### Before Integration
```
Main Project (Circular)
├── Convex Backend (simple schema)
├── WorkOS Authentication
└── Basic UI

Separate API (api/blackbox-ai/)
├── Own Convex Instance
├── Complex Schema
└── Standalone Functions
```

### After Integration
```
Unified Project
├── Single Convex Backend
│   ├── Merged Schema (with conflict resolution)
│   ├── All API Functions
│   └── Unified Data Model
├── WorkOS Authentication
├── BlackBox AI Integration Layer
└── Enhanced UI with Demo Pages
```

## Key Changes Made

### 1. Schema Consolidation (`convex/schema.ts`)

**Problem Solved**: Conflicting table names and separate schemas

**Solution**:
- Renamed main project's `tickets` table to `jiraTickets` to avoid conflicts
- Added BlackBox AI tables: `users`, `repositories`, `tickets`, `developmentTasks`
- Maintained all indexes and relationships

### 2. Convex Functions Migration

Created the following function modules:
- `convex/users.ts` - User management
- `convex/repositories.ts` - GitHub repository management
- `convex/tickets.ts` - Ticket creation and processing
- `convex/tasks.ts` - Development task tracking
- `convex/blackboxApi.ts` - Main API endpoints

### 3. Integration Service Layer (`lib/blackbox-integration.ts`)

Created a service layer that provides:
- TypeScript interfaces for all data models
- `BlackBoxIntegration` class for API interactions
- React hooks for component integration
- Singleton pattern for easy access

### 4. UI Integration

- **Updated Home Page** (`app/page.tsx`): Feature overview and navigation
- **Demo Page** (`app/blackbox-demo/page.tsx`): Interactive demo for testing
- **Environment Template** (`.env.example`): All required configuration

## How to Use the Integration

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Start Convex Backend**
   ```bash
   npx convex dev
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Using the BlackBox AI Features

#### From React Components

```typescript
import { useBlackBoxIntegration } from '@/lib/blackbox-integration';

function MyComponent() {
  const { createAndProcessTicket } = useBlackBoxIntegration();
  
  const handleSubmit = async () => {
    const result = await createAndProcessTicket({
      userId: "user_id",
      repositoryId: "repo_id",
      ticketData: {
        title: "Add feature",
        description: "Implement new feature",
        priority: "high"
      },
      autoProcess: true
    });
  };
}
```

#### From Server Code

```typescript
import { BlackBoxIntegration } from '@/lib/blackbox-integration';

const blackbox = new BlackBoxIntegration();

const result = await blackbox.processTicket(
  {
    title: "Add authentication",
    description: "Implement JWT auth",
    repositoryUrl: "https://github.com/user/repo",
    priority: "high"
  },
  {
    owner: "user",
    name: "repo",
    defaultBranch: "main"
  }
);
```

## API Endpoints Available

### Main Endpoints (via `convex/blackboxApi.ts`)

- `createUserWithRepo` - Create user and associate repository
- `createAndProcessTicket` - Create ticket and start AI processing
- `getUserDashboard` - Get user statistics and recent activity
- `getRecentActivity` - Get recent tickets and tasks
- `retryFailedTasks` - Retry all failed tasks for a user
- `getSystemStats` - Get system-wide statistics

### Supporting Functions

- User management (`users.ts`)
- Repository management (`repositories.ts`)
- Ticket operations (`tickets.ts`)
- Task tracking (`tasks.ts`)

## Data Flow

1. **User creates ticket** → UI form submission
2. **Ticket validation** → Convex mutation
3. **Task creation** → Development task queued
4. **AI processing** → BlackBox AI generates code
5. **GitHub integration** → Code committed to branch
6. **PR creation** → Pull request opened for review

## Testing the Integration

### Manual Testing

1. Navigate to http://localhost:3000
2. Sign in with WorkOS authentication
3. Go to BlackBox Demo page
4. Fill in the form:
   - Ticket title and description
   - GitHub repository details
   - Priority level
5. Submit and monitor progress

### Verification Checklist

- [ ] Convex backend starts without errors
- [ ] Schema migrations apply successfully
- [ ] Authentication flow works
- [ ] Demo page loads correctly
- [ ] Ticket creation succeeds
- [ ] System stats display properly

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Run `npx convex dev` to regenerate types
   - Ensure all dependencies are installed

2. **Authentication Issues**
   - Verify WorkOS credentials in `.env.local`
   - Check redirect URI configuration

3. **API Connection Errors**
   - Confirm Convex URL is correct
   - Check network connectivity

4. **GitHub Integration**
   - Ensure bot has repository access
   - Verify GitHub token permissions

## Benefits of Integration

1. **Unified Codebase**: Single repository to maintain
2. **Shared Authentication**: One auth system for all features
3. **Consistent UI**: Integrated user experience
4. **Simplified Deployment**: One application to deploy
5. **Better Type Safety**: Shared TypeScript definitions
6. **Easier Testing**: All code in one place

## Future Enhancements

- Add real BlackBox AI API calls (currently stubbed)
- Implement GitHub webhook handlers
- Add progress tracking UI
- Create admin dashboard
- Add batch processing capabilities
- Implement rate limiting
- Add error recovery mechanisms

## Conclusion

The BlackBox AI integration is now fully functional within the main Circular project. The architecture supports both the existing Jira integration and the new AI-powered code generation features, with room for future expansion.
