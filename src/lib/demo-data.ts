// Mock data for demo mode
import { Post } from './posts'

const now = new Date()

// Helper to get a date at a specific day offset with a given hour
function getDate(dayOffset: number, hour: number = 10): Date {
  const date = new Date(now)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, 0, 0, 0)
  return date
}

export const DEMO_POSTS: Post[] = [
  // === SCHEDULED POSTS (spread across upcoming days) ===
  {
    id: 'demo-1',
    createdAt: getDate(-2).toISOString(),
    updatedAt: getDate(-2).toISOString(),
    scheduledAt: getDate(0, 14).toISOString(), // Today at 2pm
    status: 'scheduled',
    platforms: ['twitter', 'linkedin'],
    content: {
      twitter: {
        text: "Just shipped a new feature that's been months in the making! 🚀 Can't wait to see what you all build with it. Thread incoming with all the details...",
      },
      linkedin: {
        text: "Excited to announce a major milestone for our team!\n\nAfter months of hard work, we've just shipped a feature that will fundamentally change how developers interact with our platform.\n\nKey highlights:\n• 10x faster performance\n• New API endpoints\n• Improved developer experience\n\nCheck out the full announcement on our blog.",
        visibility: 'public',
      },
    },
  },
  {
    id: 'demo-2',
    createdAt: getDate(-5).toISOString(),
    updatedAt: getDate(-1).toISOString(),
    scheduledAt: getDate(1, 9).toISOString(), // Tomorrow at 9am
    status: 'scheduled',
    platforms: ['twitter'],
    content: {
      twitter: {
        text: "Hot take: The best code is the code you don't write. 🔥\n\nEvery line of code is a liability. Embrace simplicity.",
      },
    },
  },
  {
    id: 'demo-8',
    createdAt: getDate(-1).toISOString(),
    updatedAt: getDate(-1).toISOString(),
    scheduledAt: getDate(2, 11).toISOString(), // In 2 days at 11am
    status: 'scheduled',
    platforms: ['linkedin'],
    content: {
      linkedin: {
        text: "The most underrated skill in tech? Writing.\n\nClear documentation, concise emails, and well-structured PRs will accelerate your career faster than learning another framework.\n\nInvest in your communication skills. Your future self will thank you.",
        visibility: 'public',
      },
    },
  },
  {
    id: 'demo-9',
    createdAt: getDate(-3).toISOString(),
    updatedAt: getDate(-3).toISOString(),
    scheduledAt: getDate(3, 15).toISOString(), // In 3 days at 3pm
    status: 'scheduled',
    platforms: ['reddit'],
    content: {
      reddit: {
        subreddit: 'reactjs',
        title: 'Show r/reactjs: Built a calendar component with drag-and-drop scheduling',
        body: "Been working on a calendar component for my side project and wanted to share the approach.\n\nFeatures:\n- Drag and drop events\n- Multi-day events\n- Responsive design\n- Dark mode support\n\nWould love feedback on the UX!",
      },
    },
  },
  {
    id: 'demo-10',
    createdAt: getDate(-2).toISOString(),
    updatedAt: getDate(-2).toISOString(),
    scheduledAt: getDate(5, 10).toISOString(), // In 5 days at 10am
    status: 'scheduled',
    platforms: ['twitter', 'linkedin', 'reddit'],
    content: {
      twitter: {
        text: "Launching on Product Hunt next week! 🚀\n\nAfter 6 months of building in public, we're finally ready. Follow along for updates!",
      },
      linkedin: {
        text: "Exciting news! We're launching on Product Hunt next week.\n\n6 months ago, this was just an idea. Today, it's a product used by hundreds of developers.\n\nThe journey:\n📝 Month 1-2: Validation\n⚙️ Month 3-4: MVP\n🧪 Month 5: Beta testing\n✨ Month 6: Polish\n\nCan't wait to share it with the world!",
        visibility: 'public',
      },
      reddit: {
        subreddit: 'startups',
        title: 'After 6 months of building, we are launching next week - lessons learned',
        body: "Hey r/startups!\n\nWe're launching our developer tool on Product Hunt next week. Wanted to share some lessons from the journey:\n\n1. Start with a small, focused problem\n2. Build in public - the feedback is invaluable\n3. Don't wait for perfect\n\nHappy to answer any questions about the process!",
      },
    },
  },
  {
    id: 'demo-11',
    createdAt: getDate(-1).toISOString(),
    updatedAt: getDate(-1).toISOString(),
    scheduledAt: getDate(7, 12).toISOString(), // In 1 week at noon
    status: 'scheduled',
    platforms: ['twitter'],
    content: {
      twitter: {
        text: "Weekend project idea: Build something that solves YOUR problem.\n\nThe best side projects come from scratching your own itch. What's annoying you today that you could fix with code?",
      },
    },
  },
  {
    id: 'demo-12',
    createdAt: getDate(0).toISOString(),
    updatedAt: getDate(0).toISOString(),
    scheduledAt: getDate(10, 9).toISOString(), // In 10 days at 9am
    status: 'scheduled',
    platforms: ['linkedin'],
    content: {
      linkedin: {
        text: "Hiring update: We're looking for a Senior Frontend Engineer!\n\nWhat we're building: Developer tools that make engineers more productive.\n\nWhat we offer:\n🌍 Fully remote\n💰 Competitive salary\n📈 Equity\n🏖️ Unlimited PTO\n\nDM me if interested or tag someone who might be a good fit!",
        visibility: 'public',
      },
    },
  },

  // === DRAFT POSTS ===
  {
    id: 'demo-3',
    createdAt: getDate(-3).toISOString(),
    updatedAt: getDate(-3).toISOString(),
    scheduledAt: null,
    status: 'draft',
    platforms: ['reddit'],
    content: {
      reddit: {
        subreddit: 'programming',
        title: 'What are your favorite underrated developer tools?',
        body: "I've been curating a list of lesser-known developer tools that have significantly improved my workflow. Would love to hear what gems the community has discovered!\n\nI'll start:\n- **Zoxide** - A smarter cd command\n- **Atuin** - Magical shell history\n- **Delta** - Better git diffs",
      },
    },
  },
  {
    id: 'demo-5',
    createdAt: getDate(-1).toISOString(),
    updatedAt: getDate(-1).toISOString(),
    scheduledAt: null,
    status: 'draft',
    platforms: ['linkedin'],
    content: {
      linkedin: {
        text: "5 lessons I learned from leading my first engineering team:\n\n1. Trust > Micromanagement\n2. Clear communication prevents 90% of issues\n3. Celebrate small wins\n4. Technical debt is real debt\n5. Your team's growth = your success",
        visibility: 'connections',
      },
    },
  },
  {
    id: 'demo-7',
    createdAt: getDate(0, 8).toISOString(),
    updatedAt: getDate(0, 8).toISOString(),
    scheduledAt: null,
    status: 'draft',
    platforms: ['twitter', 'linkedin', 'reddit'],
    content: {
      twitter: {
        text: "Thread: How to build a side project in 30 days 🧵\n\n1/ Start with a problem you actually have...",
      },
      linkedin: {
        text: "I'm challenging myself to build and launch a side project in 30 days.\n\nHere's my framework:\n\nWeek 1: Problem validation\nWeek 2: MVP development\nWeek 3: User testing\nWeek 4: Launch prep\n\nFollow along for daily updates!",
        visibility: 'public',
      },
      reddit: {
        subreddit: 'SideProject',
        title: '30-Day Side Project Challenge - Day 1',
        body: "Starting a public build challenge! Will document everything here.\n\nGoal: Launch a fully functional product in 30 days.\n\nDay 1: Identifying the problem space and validating demand.",
      },
    },
  },
  {
    id: 'demo-13',
    createdAt: getDate(-2).toISOString(),
    updatedAt: getDate(-2).toISOString(),
    scheduledAt: null,
    status: 'draft',
    platforms: ['twitter'],
    content: {
      twitter: {
        text: "Unpopular opinion: You don't need to learn every new JavaScript framework.\n\nMaster the fundamentals. The frameworks will come and go, but the core concepts remain.",
      },
    },
  },

  // === PUBLISHED POSTS (spread across past days) ===
  {
    id: 'demo-4',
    createdAt: getDate(-7).toISOString(),
    updatedAt: getDate(-7).toISOString(),
    scheduledAt: getDate(-6, 10).toISOString(),
    status: 'published',
    platforms: ['twitter', 'linkedin'],
    content: {
      twitter: {
        text: "We're hiring! Looking for passionate engineers who want to build the future of developer tools. Remote-first, async culture. DM me or check out our careers page 👇",
      },
      linkedin: {
        text: "📢 We're Growing Our Team!\n\nWe're looking for talented engineers who are passionate about developer experience.\n\nWhat we offer:\n✅ Remote-first culture\n✅ Competitive compensation\n✅ Meaningful impact on developer tools used by millions\n\nInterested? Drop a comment or send me a message!",
        visibility: 'public',
      },
    },
    publishResults: {
      twitter: {
        success: true,
        postId: '1234567890',
        postUrl: 'https://twitter.com/example/status/1234567890',
        publishedAt: getDate(-6, 10).toISOString(),
      },
      linkedin: {
        success: true,
        postId: 'urn:li:share:987654321',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:987654321',
        publishedAt: getDate(-6, 10).toISOString(),
      },
    },
  },
  {
    id: 'demo-6',
    createdAt: getDate(-10).toISOString(),
    updatedAt: getDate(-10).toISOString(),
    scheduledAt: getDate(-9, 14).toISOString(),
    status: 'published',
    platforms: ['reddit'],
    content: {
      reddit: {
        subreddit: 'webdev',
        title: 'Built a social media scheduler that uses GitHub as a backend',
        body: "After getting frustrated with existing scheduling tools, I built my own using React and GitHub Actions.\n\nFeatures:\n- Schedule posts to Twitter, LinkedIn, and Reddit\n- GitHub repo as the database\n- GitHub Actions for automated publishing\n- Free hosting on GitHub Pages\n\nThoughts?",
      },
    },
    publishResults: {
      reddit: {
        success: true,
        postId: 'abc123',
        postUrl: 'https://reddit.com/r/webdev/comments/abc123',
        publishedAt: getDate(-9, 14).toISOString(),
      },
    },
  },
  {
    id: 'demo-14',
    createdAt: getDate(-4).toISOString(),
    updatedAt: getDate(-4).toISOString(),
    scheduledAt: getDate(-3, 11).toISOString(),
    status: 'published',
    platforms: ['twitter'],
    content: {
      twitter: {
        text: "Just hit 1000 users! 🎉\n\nStarted this project 3 months ago as a weekend hack. Now it's becoming something real.\n\nThank you to everyone who believed in us early. This is just the beginning.",
      },
    },
    publishResults: {
      twitter: {
        success: true,
        postId: '9876543210',
        postUrl: 'https://twitter.com/example/status/9876543210',
        publishedAt: getDate(-3, 11).toISOString(),
      },
    },
  },
  {
    id: 'demo-15',
    createdAt: getDate(-2).toISOString(),
    updatedAt: getDate(-2).toISOString(),
    scheduledAt: getDate(-1, 16).toISOString(),
    status: 'published',
    platforms: ['linkedin'],
    content: {
      linkedin: {
        text: "Reflecting on my first year as a tech lead.\n\nBiggest surprise? The job is 80% communication, 20% code.\n\nSkills that mattered most:\n• Active listening\n• Giving constructive feedback\n• Running effective meetings\n• Writing clear documentation\n\nThe code writes itself once the team is aligned.",
        visibility: 'public',
      },
    },
    publishResults: {
      linkedin: {
        success: true,
        postId: 'urn:li:share:111222333',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:111222333',
        publishedAt: getDate(-1, 16).toISOString(),
      },
    },
  },
  {
    id: 'demo-16',
    createdAt: getDate(-5).toISOString(),
    updatedAt: getDate(-5).toISOString(),
    scheduledAt: getDate(-4, 9).toISOString(),
    status: 'published',
    platforms: ['reddit'],
    content: {
      reddit: {
        subreddit: 'typescript',
        title: 'PSA: Use satisfies instead of type annotations when you want type checking without widening',
        body: "Quick tip that took me way too long to learn:\n\n```typescript\n// This widens the type\nconst config: Config = { ... }\n\n// This preserves the literal types\nconst config = { ... } satisfies Config\n```\n\nThe satisfies operator gives you the best of both worlds: type checking AND preserved literal types.",
      },
    },
    publishResults: {
      reddit: {
        success: true,
        postId: 'xyz789',
        postUrl: 'https://reddit.com/r/typescript/comments/xyz789',
        publishedAt: getDate(-4, 9).toISOString(),
      },
    },
  },
]

// Get posts filtered by status for demo mode
export function getDemoPostsByStatus(status?: 'draft' | 'scheduled' | 'published' | 'failed'): Post[] {
  if (!status) return DEMO_POSTS
  return DEMO_POSTS.filter((p) => p.status === status)
}

// Get a single demo post by ID
export function getDemoPost(id: string): Post | undefined {
  return DEMO_POSTS.find((p) => p.id === id)
}
