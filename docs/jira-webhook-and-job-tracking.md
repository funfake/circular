# Jira Webhook Integration and Job Creation Tracking

## Overview

The application now includes three key features:

1. Automatic Jira ticket status updates when tickets are rejected
2. Visual feedback during AI assessment with a loading spinner
3. Visual feedback during job creation with a loading spinner

## Jira Integration

### API Details

- **URL**: Uses the same `jiraSourceUrl` configured in project credentials for both GET and POST operations
- **GET**: Fetches tickets from Jira
- **POST**: Updates ticket status in Jira
- **Content-Type**: application/json

### Update Request Payload (POST)

```json
{
  "ticketId": "10018", // Jira ticket ID
  "ticketStatus": "42" // Status code for "Rejected" in Jira
}
```

### Integration Flow

1. When a ticket is assessed in `convex/assessment.ts`:
   - The AI evaluates the ticket completeness
   - If the ticket is rejected (`assessment.rejected === true`):
     - The system retrieves the ticket's `jiraId` from the database
     - A POST request is sent to the `jiraSourceUrl` with the ticket ID and status 42
     - The API call is wrapped in a try-catch to prevent failures from affecting the assessment process
   - If the ticket is approved:
     - The `creatingJobs` flag is set to true
     - The normal job splitting process continues
     - The `creatingJobs` flag is set to false when job creation completes

## Job Creation Status Tracking

### Implementation

- Added `creatingJobs` boolean field to the tickets schema
- When job creation starts, `creatingJobs` is set to true
- When job creation completes (success or failure), `creatingJobs` is set to false
- The TicketCard component displays appropriate status with spinners

### Visual Feedback States

- **Pending Review**: Gray badge with spinner - AI is assessing the ticket in the background
- **Creating Jobs**: Blue badge with spinner - jobs are being generated
- **Approved**: Green badge - ticket approved and jobs created successfully
- **Rejected**: Red badge - ticket rejected, Jira status updated to rejected

### Loading Indicators

The application now shows loading spinners in two scenarios:

1. **During Assessment**: When `ticket.rejected === undefined`, showing the AI is analyzing the ticket
2. **During Job Creation**: When `ticket.creatingJobs === true`, showing jobs are being generated

## Error Handling

- Jira API failures are logged but don't cause the assessment to fail
- Console logs track both successful and failed API calls
- The assessment process continues regardless of Jira update response
- Job creation failures properly reset the `creatingJobs` flag

## Files Modified

1. **convex/schema.ts**:
   - Added `creatingJobs` field to tickets table

2. **convex/assessment.ts**:
   - Added Jira status update in the `assessTicket` function
   - Added `updateTicketJobCreationStatus` mutation
   - Added `getProjectCredentials` internal query
   - Sets `creatingJobs` to true before job splitting
   - Sends POST request to `jiraSourceUrl` when ticket is rejected
   - Uses the same URL for both fetching and updating tickets

3. **convex/jobs.ts**:
   - Updated to set `creatingJobs` flag to false when job creation completes
   - Handles both success and error cases

4. **components/TicketCard.tsx**:
   - Added Loader2 icon import from lucide-react
   - Updated badge logic to show spinner for both pending review and job creation
   - Shows spinner when `ticket.rejected === undefined` (AI assessment in progress)
   - Shows spinner when `ticket.creatingJobs === true` (job creation in progress)
   - Added blue "Creating Jobs" status with animated spinner

## Testing Guide

### Test Rejected Tickets

1. Process a ticket with incomplete description (e.g., ticket 10018 or 10016)
2. Observe the "Pending Review" badge with spinner during assessment
3. Check console logs for webhook call status
4. Verify the badge changes to "Rejected" when assessment completes
5. Verify in Jira that the ticket status has been updated to "Rejected" (status 42)

### Test Job Creation

1. Process a complete ticket (e.g., ticket 10014, 10012, or 10006)
2. Observe the "Pending Review" badge with spinner during assessment
3. When approved, observe the badge changes to "Creating Jobs" with spinner
4. Wait for job creation to complete
5. Verify the badge changes to "Approved" when done

### Example Test Tickets

**Rejected Tickets:**

- **10018**: "Préférences utilisateur backend" - Too vague, lacks acceptance criteria
- **10016**: "Synchroniser thème multi-tab" - Incomplete description, strategy not defined

**Approved Tickets:**

- **10014**: "Documentation" - Clear objectives, acceptance criteria provided
- **10012**: "Tailwind config + globals.css" - Specific requirements and criteria
- **10006**: "Bouton pour basculer entre dark/light" - Detailed implementation requirements

## User Experience Flow

1. **Ticket Imported**: Shows "Pending Review" with spinner
2. **Assessment in Progress**: Spinner continues to animate
3. **If Rejected**: Badge changes to red "Rejected", Jira is updated
4. **If Approved**: Badge changes to blue "Creating Jobs" with spinner
5. **Jobs Created**: Badge changes to green "Approved"

This provides clear visual feedback throughout the entire ticket processing lifecycle.

```

```
