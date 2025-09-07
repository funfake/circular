import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Internal query to get ticket by ID
export const getTicketById = internalQuery({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, { ticketId }) => {
    return await ctx.db.get(ticketId);
  },
});

// Internal query to get project credentials
export const getProjectCredentials = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const credentials = await ctx.db
      .query("credentials")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .unique();
    return credentials;
  },
});

// Examples from tickets.json for the prompt
const TICKET_EXAMPLES = `
INCOMPLETE TICKETS (should be rejected):
1. Title: "Préférences utilisateur backend"
   Description: "_(Incomplet)_ Définir API pour stocker préférence theme en DB liée à l'utilisateur. Gestion SSR ?"
   Reason: Too vague, lacks acceptance criteria, no clear implementation details

2. Title: "Synchroniser thème multi-tab"
   Description: "_(Incomplet)_ Décrire stratégie : écouter storage event pour propager changement. Définir tests."
   Reason: Incomplete description, strategy not defined, tests not specified

COMPLETE TICKETS (should be accepted):
1. Title: "Documentation"
   Description: "Ajouter une section docs/theme-toggle.md expliquant comment fonctionne useTheme, où est injecté theme-client.ts, et comment personnaliser les couleurs. Mettre à jour le README avec instructions d'activation.
   
   *Acceptance Criteria*:
   * Doc claire et concise
   * .env.example mis à jour si besoin
   * Lien vers doc dans README"
   Reason: Clear objectives, specific files mentioned, acceptance criteria provided

2. Title: "Bouton pour basculer entre dark/light"
   Description: "Créer ThemeToggle.tsx qui utilise useTheme(). Doit être accessible : bouton avec aria-pressed, icône soleil/lune.
   
   *Acceptance Criteria*:
   * Bouton accessible avec clavier
   * Icône change selon le thème
   * Appelle setTheme au clic
   * Test e2e Playwright (clic = bascule)"
   Reason: Specific component name, clear requirements, accessibility considered, test requirements defined

3. Title: "Dark Mode Toggle (Next.js + Tailwind)"
   Description: "Implémenter un toggle Dark/Light dans le projet Next.js App Router. Par défaut, suivre les préférences système (prefers-color-scheme). Sur clic, appliquer immédiatement le thème, le persister dans localStorage et refléter l'état par une classe dark sur <html>. Garantir accessibilité, absence de flash (FOUC), et couverture minimale de tests.
   
   *Labels*: ui, nextjs, tailwind, theme
   *Components*: WebApp"
   Reason: Comprehensive requirements, technical details provided, specific implementation approach
`;

// Internal mutation to update ticket rejection status
export const updateTicketRejectionStatus = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    rejected: v.boolean(),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, { ticketId, rejected, rejectionReason }) => {
    await ctx.db.patch(ticketId, {
      rejected,
      rejectionReason: rejectionReason || undefined,
    });
    return { success: true };
  },
});

// Internal mutation to update ticket job creation status
export const updateTicketJobCreationStatus = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    creatingJobs: v.boolean(),
  },
  handler: async (ctx, { ticketId, creatingJobs }) => {
    await ctx.db.patch(ticketId, {
      creatingJobs,
    });
    return { success: true };
  },
});

// Internal action to assess a single ticket
export const assessTicket = internalAction({
  args: {
    ticketId: v.id("tickets"),
    jiraTitle: v.string(),
    jiraDescription: v.string(),
  },
  handler: async (ctx, { ticketId, jiraTitle, jiraDescription }) => {
    // Get API key from environment
    const apiKey = process.env.BLACKBOX_API_KEY;
    if (!apiKey) {
      console.error("BLACKBOX_API_KEY not found in environment variables");
      return { error: "API key not configured" };
    }

    // Blackbox API endpoint (configurable via env)
    const apiUrl = "https://api.blackbox.ai/chat/completions";

    // Prepare the prompt for assessment
    const prompt = `You are a technical project manager assessing Jira tickets for completeness and clarity.

Based on the following examples, assess whether a ticket should be rejected or accepted:

${TICKET_EXAMPLES}

ASSESSMENT CRITERIA:
- REJECT if the description is vague, incomplete, or lacks clear requirements
- REJECT if there are no acceptance criteria or success metrics
- REJECT if the technical approach is unclear or undefined
- ACCEPT if the ticket has clear objectives, specific requirements, and defined acceptance criteria
- ACCEPT if the ticket provides enough detail for a developer to start working

Now assess this ticket:

Title: "${jiraTitle}"
Description: "${jiraDescription}"

IMPORTANT: Your response must be ONLY a valid JSON object with this exact structure:
{
  "rejected": true or false,
  "reason": "Brief explanation of the decision"
}`;

    try {
      // Call BlackBox AI API with the same structure as the working implementation
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "blackboxai/anthropic/claude-sonnet-4",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `BlackBox API error: ${response.status} ${response.statusText}`,
          errorText
        );
        return {
          error: `API request failed: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Extract the assessment from the response according to the OpenRouter/OpenAI format
      let responseContent = "";

      // According to the documentation, the response follows OpenAI Chat API format
      if (
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0
      ) {
        const choice = data.choices[0];

        // Check for error in the choice
        if (choice.error) {
          console.error("API returned error in choice:", choice.error);
          return {
            error: `API error: ${choice.error.message || "Unknown error"}`,
          };
        }

        // For non-streaming responses, content is in message.content
        if (choice.message && choice.message.content) {
          responseContent = choice.message.content;
        }
        // For non-chat completions, content might be in text
        else if (choice.text) {
          responseContent = choice.text;
        }
        // For streaming (though we're not using it), content would be in delta.content
        else if (choice.delta && choice.delta.content) {
          responseContent = choice.delta.content;
        }
      }

      // Handle alternative Blackbox response shapes
      if (!responseContent) {
        if (typeof data === "string") {
          responseContent = data;
        } else if (data.content) {
          responseContent = data.content;
        } else if (data.message) {
          responseContent = data.message;
        } else if (data.output_text) {
          responseContent = data.output_text;
        }
      }

      if (!responseContent) {
        console.error(
          "No content in API response. Full response:",
          JSON.stringify(data, null, 2)
        );
        return { error: "No content found in API response" };
      }

      // Log usage information if available
      // if (data.usage) {
      //   console.log(
      //     `Token usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`
      //   );
      // }

      let assessment;
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseContent.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          assessment = JSON.parse(jsonMatch[0]);
        } else {
          assessment = JSON.parse(responseContent);
        }
      } catch (parseError) {
        console.error(
          "Failed to parse AI response as JSON:",
          responseContent,
          parseError
        );
        // Fallback: try to determine from the text
        const lowerContent = responseContent.toLowerCase();
        const isRejected =
          lowerContent.includes("reject") ||
          lowerContent.includes("incomplete") ||
          lowerContent.includes("insufficient");
        assessment = {
          rejected: isRejected,
          reason: responseContent.substring(0, 200),
        };
      }

      // Update the ticket with the assessment result
      await ctx.runMutation(internal.assessment.updateTicketRejectionStatus, {
        ticketId,
        rejected: Boolean(assessment.rejected),
        rejectionReason: assessment.reason || undefined,
      });

      // Get the ticket to get jiraId and projectId
      const ticket = await ctx.runQuery(internal.assessment.getTicketById, {
        ticketId,
      });

      if (ticket) {
        // If ticket is rejected, update Jira ticket status
        if (assessment.rejected) {
          try {
            // Get project credentials to get the jiraSourceUrl
            const credentials = await ctx.runQuery(
              internal.assessment.getProjectCredentials,
              { projectId: ticket.projectId }
            );

            // Use the jiraSourceUrl for updating ticket status (same URL for GET and POST)
            const jiraUrl = credentials?.jiraSourceUrl;

            if (!jiraUrl) {
              console.error("No Jira URL configured for project");
            } else {
              // POST to the same jiraSourceUrl to update ticket status
              const updateResponse = await fetch(jiraUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ticketId: ticket.jiraId,
                  ticketStatus: "42", // 42 = rejected status in Jira
                }),
              });

              if (!updateResponse.ok) {
                console.error(
                  `Failed to update Jira ticket status: ${updateResponse.status} ${updateResponse.statusText}`
                );
              } else {
                console.log(
                  `Successfully updated Jira ticket ${ticket.jiraId} status to rejected via ${jiraUrl}`
                );
              }
            }
          } catch (error) {
            console.error("Error updating Jira ticket status:", error);
            // Don't fail the assessment if update fails
          }
        }
        // If ticket is approved (not rejected), trigger job splitting
        else {
          // Set creatingJobs flag to true before starting job creation
          await ctx.runMutation(
            internal.assessment.updateTicketJobCreationStatus,
            {
              ticketId,
              creatingJobs: true,
            }
          );

          // Schedule job splitting to run asynchronously
          await ctx.scheduler.runAfter(0, internal.jobs.splitTicketIntoJobs, {
            ticketId,
            jiraTitle,
            jiraDescription,
            projectId: ticket.projectId,
          });
        }
      }

      return {
        success: true,
        rejected: assessment.rejected,
        reason: assessment.reason,
      };
    } catch (error) {
      console.error("Error assessing ticket:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
