# Jira Webhook Integration for Rejected Tickets

## Overview

When a ticket is assessed and rejected by the AI assessment system, the application now automatically updates the corresponding Jira ticket status to "Rejected" (status code 42).

## Implementation Details

### Webhook Endpoint

- **URL**: `https://kikoane.app.n8n.cloud/webhook/update-ticket`
- **Method**: POST
- **Content-Type**: application/json

### Request Payload

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
     - A POST request is sent to the webhook with the ticket ID and status 42
     - The webhook call is wrapped in a try-catch to prevent failures from affecting the assessment process
   - If the ticket is approved:
     - The normal job splitting process continues

### Error Handling

- Webhook failures are logged but don't cause the assessment to fail
- Console logs track both successful and failed webhook calls
- The assessment process continues regardless of webhook response

### Files Modified

- `convex/assessment.ts`: Added webhook integration in the `assessTicket` function

### Testing

To test the integration:

1. Process a ticket that should be rejected (e.g., one with incomplete description)
2. Check the console logs for webhook call status
3. Verify in Jira that the ticket status has been updated to "Rejected"

### Example Rejected Tickets (from tickets.json)

- **Ticket 10018**: "Préférences utilisateur backend" - Too vague, lacks acceptance criteria
- **Ticket 10016**: "Synchroniser thème multi-tab" - Incomplete description, strategy not defined
