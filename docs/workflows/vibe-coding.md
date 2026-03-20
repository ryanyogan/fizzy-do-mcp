# Vibe Coding

Let's be real - sometimes you just want to throw ideas at your AI and let it cook. Vibe coding is all about flow state, minimal friction, and trusting your AI assistant to handle the details.

This workflow is for those sessions where you're jamming with Claude, Cursor, or your AI of choice and want Fizzy to stay out of your way while still keeping track of everything.

## The Philosophy

Traditional project management: write detailed specs, estimate time, assign reviewers, update status daily.

Vibe coding: "Hey, make the button do the thing. You know what I mean."

Both are valid. Fizzy supports both. This page is about the second one.

## Tag Strategies for Vibing

The key to vibe coding is using simple, expressive tags that communicate intent without overhead.

### The Essential Tags

| Tag | Meaning |
|-----|---------|
| `#vibe` | This is a vibe coding session - minimal process |
| `#ai-ready` | AI can pick this up and run with it |
| `#blocked` | Stuck on something, need human input |
| `#ship-it` | Good enough, deploy it |
| `#wip` | Work in progress, don't judge |

### Setting Up Tags

```
You: Create a new board called "Vibe Projects" with tags 
     #vibe, #ai-ready, #blocked, #ship-it, and #wip

AI: Created board "Vibe Projects" with 5 tags.
    Ready for some vibe coding!
```

## Quick Capture Flow

The best ideas come when you're not trying. Capture them fast:

```
You: Quick card: dark mode but make it actually good

AI: Created #42 "Dark mode but make it actually good"
    Board: Vibe Projects
    Tags: none yet

You: Tag it #vibe #ai-ready

AI: Tagged #42 with #vibe and #ai-ready
```

Or even faster:

```
You: Vibe card: that animation is janky, fix it, #ai-ready

AI: Created #43 "That animation is janky, fix it"
    Tagged: #vibe, #ai-ready
```

## The AI-Ready Pattern

When you tag something `#ai-ready`, you're saying "Claude, you can work on this without asking me a million questions."

This works best when you:

1. **Trust defaults** - Let AI make reasonable decisions
2. **Review later** - Check the work when you're ready, not in real-time
3. **Keep cards small** - One idea per card keeps things moveable

```
You: Show me all #ai-ready cards

AI: Found 3 cards ready for AI work:

    #43 "That animation is janky, fix it"
    #45 "Add loading skeleton to dashboard"  
    #47 "Refactor auth to use new SDK"

    Want me to start on any of these?

You: Yeah, hit #45, you've got good taste

AI: On it. I'll update the card when I'm done.
```

## Handling Blockers

Sometimes vibing hits a wall. That's what `#blocked` is for:

```
AI: Working on #47 "Refactor auth to use new SDK"...

    I need the new API keys for the staging environment.
    Marking this #blocked.

    Card updated:
    - Added #blocked tag
    - Comment: "Need staging API keys for new auth SDK"

You: Oh right, check 1Password under "Staging Creds"

AI: Found them! Removing #blocked, continuing...
```

## Ship It Culture

When something is good enough, tag it `#ship-it`:

```
You: How's #45 looking?

AI: #45 "Add loading skeleton to dashboard" is done:
    - Added skeleton components
    - Matches existing design system
    - Tested on slow 3G connection

You: Ship it

AI: Tagged #45 with #ship-it and moved to "Done".
    Ready for the next one?
```

## Work in Progress

Not everything needs to be finished. `#wip` says "this exists but don't expect it to work yet":

```
You: I started experimenting with a new nav, 
     save it as #wip so I don't lose it

AI: Created #50 "New nav experiment"
    Tagged: #vibe, #wip
    
    Want to add any notes about the direction?

You: Something like vercel but less corporate, 
     more personality

AI: Added note: "Inspired by Vercel nav but with more 
    personality, less corporate feel"
```

## The Vibe Coding Loop

Here's what a good vibe coding session looks like:

1. **Dump ideas** - Quick cards, don't overthink
2. **Tag for AI** - Mark what's `#ai-ready`
3. **Let it cook** - AI works, you do other stuff
4. **Review and ship** - Check work, tag `#ship-it`
5. **Handle blockers** - Clear `#blocked` items as they come
6. **Repeat** - Keep the flow going

```
You: Standup for Vibe Projects

AI: Vibe Projects Standup:

    **Ready to cook (3):**
    - #48 "Better error messages"
    - #49 "Cache invalidation fix"
    - #51 "Mobile nav tweaks"

    **Currently blocked (1):**
    - #47 "Auth SDK refactor" - needs staging keys

    **Work in progress (2):**
    - #50 "New nav experiment"
    - #52 "Dark mode exploration"

    **Shipped today (2):**
    - #45 "Loading skeletons"
    - #46 "Fix that weird padding"

    Good vibes. What's next?
```

## Tips for Maximum Vibe

1. **Keep cards casual** - "Fix the thing" is fine if you both know what "the thing" is

2. **Use conversation context** - "Same board" and "tag it like the last one" work great

3. **Batch similar work** - "Tag all the UI cards #ai-ready" beats doing them one by one

4. **Don't over-organize** - The whole point is low friction

5. **Trust the AI** - If you're second-guessing every decision, you're not vibing

## Coming Soon: Autonomous AI Workflows

Here's where things get really interesting. We're building **webhook support** that will let your AI coding assistant pick up work automatically.

Imagine this:

1. You create cards tagged `#ai-ready`
2. Fizzy fires a webhook to your AI agent
3. Claude picks up the card, does the work, commits the code
4. Card moves to "Review" automatically
5. You review when you're ready

No manual handoff. No "hey Claude, check card #47". The AI just... does the work.

This is the future of vibe coding:

```
// This is coming soon
You: Tag this #ai-ready and #auto-code

AI: Tagged #55 with #ai-ready and #auto-code.
    
    This card will be picked up automatically 
    by your coding agent within the next few minutes.
    
    I'll update the card with a PR link when ready.
```

**Status:** Currently in development. Webhooks are the next major feature.

Want to be notified when this drops? Watch the repo or check the [API documentation](/api/client) for updates.

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related Workflows"
  :items="[
    { title: 'AI-Driven Tasks', link: '/workflows/ai-driven-tasks', description: 'More structured AI patterns' },
    { title: 'Project Management', link: '/workflows/project-management', description: 'When you need more process' },
    { title: 'Team Collaboration', link: '/workflows/team-collaboration', description: 'Multi-person patterns' },
  ]"
/>
