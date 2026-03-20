# AI-Driven Tasks

This guide shows real-world examples of using AI assistants to manage your Fizzy boards.

## Daily Standup

Start your day by reviewing your work:

```
You: Give me a standup summary for the Engineering board

AI: Here's your Engineering standup:

**Yesterday's Progress:**
- Closed #234 "Implement OAuth" - completed auth flow
- Updated #235 "API docs" - 80% complete

**Today's Focus:**
- #235 "API documentation" - in progress
- #240 "Database migration" - needs triage

**Blockers:**
- #241 "External API integration" - waiting on vendor credentials

Would you like me to add standup notes to any of these cards?
```

## Quick Capture

Capture ideas and tasks without context switching:

```
You: Add a card for "investigate memory leak in production" 
     with high priority, tagged #bug #urgent

AI: Created #245 "Investigate memory leak in production"
    - Board: Engineering
    - Tags: #bug, #urgent
    - Status: Needs Triage

Should I assign this to someone or move it to a specific column?
```

## Bulk Operations

Handle multiple cards at once:

```
You: Move all cards tagged #v2.1 from "Backlog" to "Next Sprint"

AI: Found 6 cards tagged #v2.1 in Backlog:
    - #201 "User profile redesign"
    - #203 "Dark mode support"
    - #205 "Export to PDF"
    - #207 "Keyboard shortcuts"
    - #210 "Performance improvements"
    - #212 "Mobile responsive fixes"

Moving all to "Next Sprint"... Done!
```

## Sprint Planning

Let AI help with planning:

```
You: Show me cards in triage that have been waiting more than a week

AI: Found 4 cards in triage for over 7 days:

1. #180 "Refactor authentication module" (12 days)
   - No tags, unassigned
   
2. #182 "Add caching layer" (10 days)
   - Tagged #performance
   
3. #185 "Update error handling" (8 days)
   - Tagged #tech-debt

4. #188 "Improve search indexing" (8 days)
   - Tagged #performance

Would you like me to:
- Move these to "Backlog"?
- Assign them to team members?
- Add priority tags?
```

## Contextual Updates

AI can read card details and add intelligent comments:

```
You: Check the status of card #234 and add a progress update

AI: Card #234 "Implement OAuth flow"

Current status: In Progress
Assigned: @ryan
Tags: #auth, #backend

Recent comments:
- 3 days ago: "Started integration with OAuth provider"
- 2 days ago: "Token refresh flow complete"

Adding comment: "Progress update: OAuth flow implementation
continues. Token refresh and basic authentication complete.
Remaining: error handling and session management."

Done! Added progress comment to #234.
```

## End of Day Review

Wrap up with an automated summary:

```
You: Create an end-of-day summary for today's work

AI: Today's Summary - March 15, 2024

**Completed (3 cards):**
- #234 Implement OAuth flow
- #238 Fix login redirect bug
- #239 Update API rate limits

**In Progress (2 cards):**
- #235 API documentation (80%)
- #240 Database migration script

**Added (2 cards):**
- #245 Investigate memory leak
- #246 Update dependencies

**Time in meetings:** ~2 hours based on calendar

Should I add this summary as a comment to a project card?
```

## Automated Triage

Let AI suggest how to organize new cards:

```
You: Help me triage the 8 new cards that came in today

AI: Here are my suggestions for the 8 new cards:

**High Priority (move to "This Week"):**
- #250 "Critical: Payment processing error" - #bug #urgent
- #251 "Security patch needed" - #security

**Normal Priority (move to "Backlog"):**
- #252 "Feature: Export to CSV"
- #253 "Improve loading states"
- #254 "Add pagination to list view"

**Low Priority (move to "Not Now"):**
- #255 "Nice to have: Custom themes"
- #256 "Investigate GraphQL"
- #257 "Code style improvements"

Should I apply these suggestions?
```

## Cross-Board Awareness

Work across multiple boards:

```
You: Show me all cards assigned to me across all boards

AI: Your assigned cards:

**Engineering (4 cards):**
- #234 "OAuth implementation" - In Progress
- #240 "Database migration" - Needs Triage

**Design (2 cards):**
- #45 "Dashboard mockups" - Review
- #48 "Mobile layouts" - In Progress

**Personal (1 card):**
- #12 "Update portfolio" - This Week

Total: 7 cards across 3 boards
```

## Tips for Effective AI-Driven Workflows

1. **Be specific** - "Create a card for X on Engineering" beats "add a task"

2. **Use card numbers** - Reference `#123` to work with specific cards

3. **Ask for context** - "Show me the description and comments" before updating

4. **Batch operations** - "Tag all cards from the sprint with #released"

5. **Regular reviews** - "What's stale?" or "What needs attention?"

6. **Let AI summarize** - End of day, sprint reviews, standups

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related Workflows"
  :items="[
    { title: 'Vibe Coding', link: '/workflows/vibe-coding', description: 'Low-friction AI-first workflow' },
    { title: 'Project Management', link: '/workflows/project-management', description: 'Sprint planning and releases' },
    { title: 'Team Collaboration', link: '/workflows/team-collaboration', description: 'Multi-person patterns' },
  ]"
/>
