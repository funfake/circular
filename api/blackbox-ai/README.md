# BlackBox AI Integration

This folder contains the BlackBox AI Ticket Development System integration for the Circular project.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

3. Initialize Convex:
```bash
npx convex dev --configure
```

## Usage

```typescript
import { BlackBoxAIIntegration } from './api/blackbox-ai';

// Initialize
BlackBoxAIIntegration.initialize(process.env.CONVEX_URL);

// Process ticket
const result = await BlackBoxAIIntegration.processTicket(ticketData, repoData);

// Create PR
const pr = await BlackBoxAIIntegration.createPullRequest(result.task._id, userId);
```

## API Reference

- `BlackBoxAIIntegration.processTicket()` - Process development ticket with AI
- `BlackBoxAIIntegration.createPullRequest()` - Create GitHub pull request
- `BlackBoxAIIntegration.getTaskStatus()` - Check task processing status

## Files

- `index.ts` - Main integration wrapper
- `convex/` - Backend functions (Convex)
- `types/` - TypeScript definitions
- `example.ts` - Usage examples
