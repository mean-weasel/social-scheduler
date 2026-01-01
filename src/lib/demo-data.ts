// Mock data for demo mode
import { Post } from './posts'

const now = new Date()
const oneHour = 60 * 60 * 1000
const oneDay = 24 * oneHour

export const DEMO_POSTS: Post[] = [
  {
    id: 'demo-1',
    createdAt: new Date(now.getTime() - 2 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * oneDay).toISOString(),
    scheduledAt: new Date(now.getTime() + 2 * oneHour).toISOString(),
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
    createdAt: new Date(now.getTime() - 5 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * oneDay).toISOString(),
    scheduledAt: new Date(now.getTime() + 1 * oneDay + 3 * oneHour).toISOString(),
    status: 'scheduled',
    platforms: ['twitter'],
    content: {
      twitter: {
        text: "Hot take: The best code is the code you don't write. 🔥\n\nEvery line of code is a liability. Embrace simplicity.",
      },
    },
  },
  {
    id: 'demo-3',
    createdAt: new Date(now.getTime() - 3 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 3 * oneDay).toISOString(),
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
    id: 'demo-4',
    createdAt: new Date(now.getTime() - 7 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 7 * oneDay).toISOString(),
    scheduledAt: new Date(now.getTime() - 6 * oneDay).toISOString(),
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
        publishedAt: new Date(now.getTime() - 6 * oneDay).toISOString(),
      },
      linkedin: {
        success: true,
        postId: 'urn:li:share:987654321',
        postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:987654321',
        publishedAt: new Date(now.getTime() - 6 * oneDay).toISOString(),
      },
    },
  },
  {
    id: 'demo-5',
    createdAt: new Date(now.getTime() - 1 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * oneDay).toISOString(),
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
    id: 'demo-6',
    createdAt: new Date(now.getTime() - 10 * oneDay).toISOString(),
    updatedAt: new Date(now.getTime() - 10 * oneDay).toISOString(),
    scheduledAt: new Date(now.getTime() - 9 * oneDay).toISOString(),
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
        publishedAt: new Date(now.getTime() - 9 * oneDay).toISOString(),
      },
    },
  },
  {
    id: 'demo-7',
    createdAt: new Date(now.getTime() - 4 * oneHour).toISOString(),
    updatedAt: new Date(now.getTime() - 4 * oneHour).toISOString(),
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
