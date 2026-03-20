# Team Collaboration

Patterns for using Fizzy MCP effectively with multiple team members.

## Shared Board Access

### Understanding Team Structure

```
You: Who has access to the Engineering board and what are their roles?

AI: Engineering Board Team:

**Administrators:**
- @ryan (owner)
- @sarah

**Members:**
- @mike - Frontend
- @alex - Backend
- @jordan - QA
- @casey - DevOps

**Recent Activity:**
- @mike: Last active 2 hours ago
- @alex: Last active today
- @sarah: Last active yesterday

All members can create, edit, and close cards.
Administrators can manage columns and board settings.
```

## Assignment Workflows

### Assigning Work

```
You: Assign the top 3 bugs to available team members

AI: Here are the top 3 bugs and suggested assignments:

1. #301 "Login timeout on mobile" - Critical
   Suggested: @mike (frontend, has capacity)
   
2. #302 "API rate limit errors" - High
   Suggested: @alex (backend specialist)
   
3. #303 "Dashboard loading slow" - High
   Suggested: @mike (frontend, related to #301)

Shall I make these assignments?
```

```
You: Yes, and notify them via comments

AI: Done! Assigned and added comments:

#301 → @mike
Comment: "Assigned to you - critical mobile login issue.
Please prioritize this sprint."

#302 → @alex
Comment: "Assigned - API rate limit investigation.
Related to recent traffic spike."

#303 → @mike
Comment: "Also assigned to you - may be related to #301.
Check if same root cause."
```

### Workload Balancing

```
You: @mike seems overloaded. Redistribute some of her work.

AI: @mike's current assignments (7 cards, 34 points):

High Priority (keep assigned):
- #301 "Login timeout" - Critical, in progress
- #305 "Checkout flow fix" - High, assigned

Can be redistributed:
- #308 "Update button styles" → @casey (has capacity)
- #309 "Form validation" → @jordan (can handle)
- #312 "Add loading states" → backlog (lower priority)

This would reduce @mike to 4 cards (21 points).
Should I make these changes?
```

## Communication Patterns

### Status Updates

```
You: Add a status update to all in-progress cards for standup

AI: Adding status requests to 5 in-progress cards:

#301 (Login timeout) - @mike
Comment: "Status update requested for standup"

#302 (API rate limits) - @alex
Comment: "Status update requested for standup"

#305 (Checkout flow) - @mike
Comment: "Status update requested for standup"

#310 (User dashboard) - @sarah
Comment: "Status update requested for standup"

#315 (Deploy pipeline) - @casey
Comment: "Status update requested for standup"

Done! Team members will see these notifications.
```

### Handoffs

```
You: Hand off card #310 from @sarah to @mike with context

AI: Updating #310 "User dashboard redesign":

Previous: Assigned to @sarah
Now: Assigned to @mike

Added handoff comment:
"Handoff from @sarah to @mike:

Current state: Design complete, ready for implementation
Files: Figma link in description
Notes: Pay attention to mobile breakpoints
Questions: Ask @sarah about animation timing

@sarah please add any additional context."

@mike and @sarah both notified.
```

## Review Workflows

### Code Review Requests

```
You: Card #320 is ready for review. Notify the team.

AI: Updated #320 "Implement caching layer":

- Moved to "Review" column
- Added tag #needs-review

Comment added:
"Ready for code review!

PR: [link would go here]
Changes: Implemented Redis caching for API responses
Testing: Unit tests passing, needs integration test review
Reviewer needed: Backend team member

@alex @casey - please review when available"
```

### Review Tracking

```
You: What cards are waiting for review?

AI: Cards in Review (4 total):

**Backend Team:**
#320 "Caching layer" - @alex (waiting 2 days)
#322 "API refactor" - @alex (waiting 1 day)

**Frontend Team:**
#325 "Component library" - @mike (waiting 3 days)

**DevOps:**
#330 "CI pipeline" - @casey (waiting 1 day)

Oldest: #325 has been waiting 3 days.
Recommendation: Prioritize #325 review.
```

## Team Visibility

### Daily Overview

```
You: Team overview for today

AI: Engineering Team - March 15

**Active Now:**
- @mike: Working on #301 (login timeout)
- @alex: Working on #302 (API rate limits)

**Recently Updated:**
- @sarah closed #318 (design specs) 2 hours ago
- @casey moved #330 to Review 1 hour ago

**Blocked:**
- @jordan: #340 waiting for staging deploy

**Out Today:**
- @casey: PTO (per calendar)

**Today's Focus:**
- 3 cards targeted for completion
- Sprint ends in 2 days
- 2 cards in review need attention
```

### Team Standup Format

```
You: Generate standup notes for the team

AI: Engineering Standup - March 15

**@mike**
Yesterday: Investigated #301 login timeout, found cookie issue
Today: Implementing fix for #301, starting #303
Blockers: None

**@alex**
Yesterday: Profiled API endpoints for #302
Today: Implementing rate limit improvements
Blockers: None

**@sarah**
Yesterday: Completed design specs (#318)
Today: Starting user flow diagrams
Blockers: None

**@casey**
Yesterday: Pipeline updates (#330) in review
Today: OOO
Blockers: N/A

**@jordan**
Yesterday: Testing #325 component library
Today: Continue testing, write test cases
Blockers: Waiting for staging deploy

**Sprint Status:**
- Completed: 21/42 points
- Days remaining: 2
- At risk: #340 (blocked)
```

## Coordination Patterns

### Cross-Functional Work

```
You: Create a task that needs design, development, and QA

AI: Created #350 "Feature: User notifications"

Checklist added:
- [ ] Design mockups (@sarah)
- [ ] API implementation (@alex)
- [ ] Frontend components (@mike)
- [ ] QA test plan (@jordan)
- [ ] Documentation

Tags: #feature #cross-team

Should I assign the initial owner and add dependencies?
```

### Dependency Tracking

```
You: Show me cards that are blocking other work

AI: Blocked Dependencies:

**#340 "Staging deploy"** (blocks 3 cards)
- Blocking: #341, #342, #345
- Owner: @casey
- Status: Waiting for infra team
- Impact: QA testing delayed

**#302 "API rate limits"** (blocks 1 card)
- Blocking: #348 (performance tests)
- Owner: @alex
- Status: In progress
- ETA: Today

**Action Items:**
1. Escalate #340 to infra team
2. #302 on track, no action needed
```

## Best Practices

### 1. Clear Ownership
- Every card should have an assignee
- Use AI to identify unassigned work

### 2. Communication in Cards
- Keep discussions in card comments
- AI can summarize long threads

### 3. Regular Syncs
- Use AI for automated standup reports
- Track blockers proactively

### 4. Workload Visibility
- Review team capacity weekly
- Redistribute before overload

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related Workflows"
  :items="[
    { title: 'Vibe Coding', link: '/workflows/vibe-coding', description: 'Low-friction AI-first workflow' },
    { title: 'Project Management', link: '/workflows/project-management', description: 'Sprint planning and releases' },
    { title: 'AI-Driven Tasks', link: '/workflows/ai-driven-tasks', description: 'Individual productivity' },
  ]"
/>
