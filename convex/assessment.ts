import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

Respond with a JSON object containing:
{
  "rejected": true/false,
  "reason": "Brief explanation of the decision"
}`;

    try {
      // Call BlackBox AI API with correct endpoint
      const response = await fetch("https://api.blackbox.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          // Use the API key in the body if not in headers
          apiKey: apiKey,
          model: "gpt-4",
          max_tokens: 200,
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
      console.log("BlackBox API response:", data);

      // Extract the assessment from the response
      // BlackBox AI might return the response in different formats
      let assessment;
      let responseContent = "";

      // Try different response formats
      if (data.response) {
        responseContent = data.response;
      } else if (data.choices && data.choices[0]) {
        if (data.choices[0].message) {
          responseContent = data.choices[0].message.content;
        } else if (data.choices[0].text) {
          responseContent = data.choices[0].text;
        }
      } else if (data.content) {
        responseContent = data.content;
      } else if (typeof data === "string") {
        responseContent = data;
      }

      if (!responseContent) {
        console.error("No content in API response:", data);
        return { error: "No content in API response" };
      }

      try {
        // Try to extract JSON from the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          assessment = JSON.parse(jsonMatch[0]);
        } else {
          assessment = JSON.parse(responseContent);
        }
      } catch (parseError) {
        console.error(
          "Failed to parse AI response:",
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

      console.log(`Ticket ${ticketId} assessed:`, assessment);
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
