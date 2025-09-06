import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every day at 07:00 CET (approximately 06:00 UTC; Convex uses UTC)
crons.daily(
  "sync_jira_tickets_daily",
  { hourUTC: 6, minuteUTC: 0 },
  internal.tickets.syncAllProjectsDaily
);

export default crons;
