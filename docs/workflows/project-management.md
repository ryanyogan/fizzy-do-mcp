# Project Management

Learn how to use Fizzy MCP for effective project management with AI assistance.

## Board Organization

### Setting Up a New Project

```
You: Create a new board called "Q2 Product Launch" with columns for 
     Planning, Design, Development, Testing, and Done

AI: Created board "Q2 Product Launch" with 5 columns:
    1. Planning
    2. Design
    3. Development
    4. Testing
    5. Done

Would you like me to add any initial cards or configure auto-postpone?
```

### Column-Based Workflows

Track work as it moves through stages:

```
You: What's the current state of the Q2 Product Launch board?

AI: Q2 Product Launch Overview:

**Planning (3 cards)**
- #501 "Define launch requirements"
- #502 "Create timeline"
- #503 "Stakeholder review"

**Design (2 cards)**
- #504 "Landing page mockups" - assigned @sarah
- #505 "Email templates" - assigned @mike

**Development (4 cards)**
- #506 "Build landing page" - in progress
- #507 "Set up analytics"
- #508 "Payment integration"
- #509 "Email automation"

**Testing (0 cards)**

**Done (1 card)**
- #500 "Project kickoff meeting"

Progress: 1/10 cards complete (10%)
```

## Sprint Management

### Sprint Planning

```
You: Help me plan the next sprint from our backlog

AI: I found 15 cards in your backlog. Based on tags and priority:

**Recommended for Sprint (5 cards, ~40 story points):**
- #520 "User onboarding flow" - #feature, 8 points
- #521 "Fix checkout bugs" - #bug, 3 points
- #522 "Performance optimization" - #tech-debt, 5 points
- #523 "Add search filters" - #feature, 8 points
- #524 "Update error messages" - #ux, 5 points

**Could fit if capacity allows:**
- #525 "Dark mode" - #feature, 13 points
- #526 "Export reports" - #feature, 8 points

Want me to move these to "Sprint Backlog" and assign owners?
```

### Sprint Progress

```
You: Sprint progress report

AI: Sprint 24 Progress (Day 7 of 10):

**Velocity:**
- Completed: 21 points (5 cards)
- In Progress: 13 points (3 cards)
- Remaining: 8 points (2 cards)

**On Track:** User onboarding, checkout bugs, error messages
**At Risk:** Performance optimization (blocked)
**Completed:** Search filters, dashboard updates

**Blockers:**
- #522 "Performance optimization" - waiting for staging access

Projected completion: 34/42 points (81%)

Recommendation: Consider moving #527 to next sprint to ensure
quality on remaining items.
```

## Release Management

### Release Preparation

```
You: Prepare release notes for v2.5.0 from closed cards this sprint

AI: Here are the release notes for v2.5.0:

## New Features
- User onboarding flow with guided setup (#520)
- Advanced search filters for all list views (#523)

## Bug Fixes
- Fixed checkout validation errors (#521)
- Resolved mobile layout issues on dashboard (#528)

## Improvements
- Updated error messages for better clarity (#524)
- Performance improvements to list rendering (#522)

## Technical
- Upgraded dependencies to latest versions (#529)

Should I create this as a card or export it?
```

### Post-Release Tracking

```
You: Tag all cards from v2.5.0 with #released and move to archive

AI: Found 7 cards from the v2.5.0 milestone.

Tagged with #released:
- #520, #521, #522, #523, #524, #528, #529

Moved to "Archive" column.

Any follow-up items to create for v2.6.0?
```

## Milestone Tracking

### Milestone Overview

```
You: Show me progress toward the "Beta Launch" milestone

AI: Beta Launch Milestone Progress:

**Status:** 65% complete (26/40 cards)

**By Category:**
- Features: 15/20 complete (75%)
- Bugs: 8/12 complete (67%)
- Documentation: 3/8 complete (38%)

**Blocking Items:**
- #601 "SSO Integration" - waiting on vendor
- #602 "Security audit" - scheduled next week

**At Risk:**
- Documentation is behind schedule
- 3 features have no assignee

**Projected Completion:** April 15 (2 days behind schedule)

Recommendations:
1. Assign documentation tasks
2. Follow up on SSO vendor
3. Consider reducing scope on #610-612
```

## Retrospectives

### Sprint Retrospective Data

```
You: Pull data for our sprint retrospective

AI: Sprint 24 Retrospective Data:

**Metrics:**
- Planned: 42 points | Completed: 34 points (81%)
- Cards completed: 8/10
- Blockers encountered: 2
- Bugs found in testing: 3

**Timeline:**
- Day 1-3: Good momentum (15 points)
- Day 4-6: Blocked on staging (5 points)
- Day 7-10: Recovery sprint (14 points)

**What Went Well:**
- Onboarding feature delivered on time
- Bug fixes had quick turnaround

**Challenges:**
- Staging environment access delayed 2 days
- Performance work took longer than estimated

**Cards Rolled Over:**
- #530 "Accessibility audit" (no capacity)
- #531 "API versioning" (deprioritized)

Want me to create action items from this?
```

## Resource Planning

### Workload Distribution

```
You: Show me workload distribution across the team

AI: Team Workload (Current Sprint):

**@sarah (Design)**
- Assigned: 3 cards (13 points)
- In Progress: 1 card
- Status: On track

**@mike (Frontend)**
- Assigned: 5 cards (21 points)
- In Progress: 2 cards
- Status: Potentially overloaded

**@alex (Backend)**
- Assigned: 2 cards (8 points)
- In Progress: 1 card
- Status: Has capacity

**@jordan (QA)**
- Assigned: 4 cards (testing queue)
- Status: Testing backlog growing

Recommendations:
1. Move 1 frontend card from @mike to @alex
2. Prioritize @jordan's testing queue
```

## Best Practices

### 1. Consistent Tagging

Use tags for filtering and reporting:
- `#bug`, `#feature`, `#tech-debt`, `#docs`
- `#p1`, `#p2`, `#p3` for priority
- `#v2.5`, `#v2.6` for milestones

### 2. Card Hygiene

Keep cards actionable:
- Clear titles ("Add password reset" not "passwords")
- Acceptance criteria in descriptions
- Regular triage of stale cards

### 3. Automated Reports

Set up regular AI summaries:
- Daily: Standup prep
- Weekly: Progress reports
- Sprint end: Metrics and retrospective data

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related Workflows"
  :items="[
    { title: 'Vibe Coding', link: '/workflows/vibe-coding', description: 'Low-friction AI-first workflow' },
    { title: 'Team Collaboration', link: '/workflows/team-collaboration', description: 'Multi-person patterns' },
    { title: 'AI-Driven Tasks', link: '/workflows/ai-driven-tasks', description: 'Individual productivity' },
  ]"
/>
