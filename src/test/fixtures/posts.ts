// Post fixtures for testing
import { Post, Platform } from '@/lib/posts'

// Base fixture factory
function createBasePost(overrides: Partial<Post> = {}): Post {
  const now = new Date().toISOString()
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    scheduledAt: null,
    status: 'draft',
    platforms: [],
    content: {},
    ...overrides,
  }
}

// ============================================
// Twitter Fixtures
// ============================================

export const twitterDraftFixture: Post = createBasePost({
  id: 'twitter-draft-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: 'This is a test tweet for the social scheduler app. Testing 1, 2, 3...',
    },
  },
})

export const twitterScheduledFixture: Post = createBasePost({
  id: 'twitter-scheduled-1',
  platforms: ['twitter'],
  status: 'scheduled',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  content: {
    twitter: {
      text: 'Scheduled tweet going out tomorrow! Stay tuned for more updates.',
    },
  },
})

export const twitterPublishedFixture: Post = createBasePost({
  id: 'twitter-published-1',
  platforms: ['twitter'],
  status: 'published',
  scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  content: {
    twitter: {
      text: 'This tweet was successfully published!',
    },
  },
  publishResults: {
    twitter: {
      success: true,
      postId: '1234567890123456789',
      postUrl: 'https://twitter.com/testuser/status/1234567890123456789',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  },
})

export const twitterLongTweetFixture: Post = createBasePost({
  id: 'twitter-long-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: 'This is a longer tweet that tests character limits. We want to make sure the app correctly handles tweets that approach the 280 character limit. Here we go with more text to fill it up and see how it displays.',
    },
  },
})

export const twitterWithMediaFixture: Post = createBasePost({
  id: 'twitter-media-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: 'Check out this amazing photo!',
      mediaUrls: ['https://example.com/image.jpg'],
    },
  },
})

// ============================================
// LinkedIn Fixtures
// ============================================

export const linkedinDraftFixture: Post = createBasePost({
  id: 'linkedin-draft-1',
  platforms: ['linkedin'],
  status: 'draft',
  content: {
    linkedin: {
      text: 'Excited to share some thoughts on professional development and career growth.\n\nKey takeaways:\n- Always be learning\n- Network authentically\n- Share your knowledge\n\nWhat are your top career tips?',
      visibility: 'public',
    },
  },
})

export const linkedinConnectionsOnlyFixture: Post = createBasePost({
  id: 'linkedin-connections-1',
  platforms: ['linkedin'],
  status: 'draft',
  content: {
    linkedin: {
      text: 'A more personal update for my network. Sometimes it\'s good to share with just your connections.',
      visibility: 'connections',
    },
  },
})

export const linkedinScheduledFixture: Post = createBasePost({
  id: 'linkedin-scheduled-1',
  platforms: ['linkedin'],
  status: 'scheduled',
  scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
  content: {
    linkedin: {
      text: 'Big announcement coming soon! We\'ve been working on something special and can\'t wait to share it with the LinkedIn community.',
      visibility: 'public',
    },
  },
})

export const linkedinPublishedFixture: Post = createBasePost({
  id: 'linkedin-published-1',
  platforms: ['linkedin'],
  status: 'published',
  scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
  content: {
    linkedin: {
      text: 'Successfully published LinkedIn post about our team\'s latest achievement!',
      visibility: 'public',
    },
  },
  publishResults: {
    linkedin: {
      success: true,
      postId: 'urn:li:share:7123456789012345678',
      postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:7123456789012345678',
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  },
})

// ============================================
// Reddit Fixtures
// ============================================

export const redditDraftFixture: Post = createBasePost({
  id: 'reddit-draft-1',
  platforms: ['reddit'],
  status: 'draft',
  content: {
    reddit: {
      subreddit: 'programming',
      title: 'Built a social media scheduler with GitHub as the backend',
      body: 'Just finished building a social media scheduler that uses GitHub repos for storage and GitHub Actions for publishing. Would love to get some feedback from the community!\n\nFeatures:\n- Schedule posts to Twitter, LinkedIn, and Reddit\n- Calendar view for managing posts\n- Draft support',
    },
  },
})

export const redditWithFlairFixture: Post = createBasePost({
  id: 'reddit-flair-1',
  platforms: ['reddit'],
  status: 'draft',
  content: {
    reddit: {
      subreddit: 'SideProject',
      title: 'Show and Tell: My weekend project',
      body: 'Spent the weekend building something cool. Let me know what you think!',
      flairId: 'show-and-tell',
      flairText: 'Show and Tell',
    },
  },
})

export const redditLinkPostFixture: Post = createBasePost({
  id: 'reddit-link-1',
  platforms: ['reddit'],
  status: 'draft',
  content: {
    reddit: {
      subreddit: 'webdev',
      title: 'Great article on modern CSS techniques',
      url: 'https://example.com/css-article',
    },
  },
})

export const redditScheduledFixture: Post = createBasePost({
  id: 'reddit-scheduled-1',
  platforms: ['reddit'],
  status: 'scheduled',
  scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
  content: {
    reddit: {
      subreddit: 'startups',
      title: 'Launching next week - would love early feedback',
      body: 'We\'re launching our product next week and would love to get some early adopters from this community.',
    },
  },
})

export const redditPublishedFixture: Post = createBasePost({
  id: 'reddit-published-1',
  platforms: ['reddit'],
  status: 'published',
  scheduledAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
  content: {
    reddit: {
      subreddit: 'learnprogramming',
      title: 'Tips for learning React in 2024',
      body: 'Here are my top recommendations for learning React effectively...',
    },
  },
  publishResults: {
    reddit: {
      success: true,
      postId: 'abc123xyz',
      postUrl: 'https://reddit.com/r/learnprogramming/comments/abc123xyz',
      publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
  },
})

// ============================================
// Multi-platform Fixtures
// ============================================

export const multiPlatformDraftFixture: Post = createBasePost({
  id: 'multi-draft-1',
  platforms: ['twitter', 'linkedin'],
  status: 'draft',
  content: {
    twitter: {
      text: 'Exciting news! Check out our latest update.',
    },
    linkedin: {
      text: 'Exciting news!\n\nWe\'ve just released a major update that we\'ve been working on for months. Here\'s what\'s new:\n\n- Feature A\n- Feature B\n- Feature C\n\nLet us know what you think!',
      visibility: 'public',
    },
  },
})

export const allPlatformsDraftFixture: Post = createBasePost({
  id: 'all-platforms-draft-1',
  platforms: ['twitter', 'linkedin', 'reddit'],
  status: 'draft',
  content: {
    twitter: {
      text: 'Big announcement! We just launched something amazing. Check it out!',
    },
    linkedin: {
      text: 'I\'m thrilled to announce our latest launch!\n\nThis has been a labor of love for our entire team, and we can\'t wait to share it with you.\n\nKey highlights:\n- Improved performance\n- New features\n- Better UX\n\n#launch #announcement',
      visibility: 'public',
    },
    reddit: {
      subreddit: 'webdev',
      title: '[Launch] Our new tool is live!',
      body: 'Hey r/webdev!\n\nWe just launched our new tool and would love to get your feedback. It\'s designed to help developers...',
    },
  },
})

export const allPlatformsScheduledFixture: Post = createBasePost({
  id: 'all-platforms-scheduled-1',
  platforms: ['twitter', 'linkedin', 'reddit'],
  status: 'scheduled',
  scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // In 1 week
  content: {
    twitter: {
      text: 'Product Hunt launch day! Check out what we\'ve been building.',
    },
    linkedin: {
      text: 'Today is the day!\n\nWe\'re live on Product Hunt and would love your support.\n\nLink in comments.',
      visibility: 'public',
    },
    reddit: {
      subreddit: 'SideProject',
      title: 'Launching on Product Hunt today!',
      body: 'After months of work, we\'re finally launching on Product Hunt...',
      flairText: 'Launch',
    },
  },
})

// ============================================
// Edge Case Fixtures
// ============================================

export const emptyContentFixture: Post = createBasePost({
  id: 'empty-content-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: '',
    },
  },
})

export const maxLengthTwitterFixture: Post = createBasePost({
  id: 'max-twitter-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: 'A'.repeat(280), // Exactly 280 characters
    },
  },
})

export const overLengthTwitterFixture: Post = createBasePost({
  id: 'over-twitter-1',
  platforms: ['twitter'],
  status: 'draft',
  content: {
    twitter: {
      text: 'A'.repeat(300), // Over 280 characters
    },
  },
})

// ============================================
// Factory Functions
// ============================================

export function createTwitterPost(text: string, status: Post['status'] = 'draft'): Post {
  return createBasePost({
    platforms: ['twitter'],
    status,
    content: {
      twitter: { text },
    },
  })
}

export function createLinkedInPost(
  text: string,
  visibility: 'public' | 'connections' = 'public',
  status: Post['status'] = 'draft'
): Post {
  return createBasePost({
    platforms: ['linkedin'],
    status,
    content: {
      linkedin: { text, visibility },
    },
  })
}

export function createRedditPost(
  subreddit: string,
  title: string,
  body: string,
  status: Post['status'] = 'draft'
): Post {
  return createBasePost({
    platforms: ['reddit'],
    status,
    content: {
      reddit: { subreddit, title, body },
    },
  })
}

// ============================================
// Collections for testing
// ============================================

export const allTwitterFixtures = [
  twitterDraftFixture,
  twitterScheduledFixture,
  twitterPublishedFixture,
  twitterLongTweetFixture,
  twitterWithMediaFixture,
]

export const allLinkedInFixtures = [
  linkedinDraftFixture,
  linkedinConnectionsOnlyFixture,
  linkedinScheduledFixture,
  linkedinPublishedFixture,
]

export const allRedditFixtures = [
  redditDraftFixture,
  redditWithFlairFixture,
  redditLinkPostFixture,
  redditScheduledFixture,
  redditPublishedFixture,
]

export const allMultiPlatformFixtures = [
  multiPlatformDraftFixture,
  allPlatformsDraftFixture,
  allPlatformsScheduledFixture,
]

export const allDraftFixtures = [
  twitterDraftFixture,
  twitterLongTweetFixture,
  twitterWithMediaFixture,
  linkedinDraftFixture,
  linkedinConnectionsOnlyFixture,
  redditDraftFixture,
  redditWithFlairFixture,
  redditLinkPostFixture,
  multiPlatformDraftFixture,
  allPlatformsDraftFixture,
]

export const allScheduledFixtures = [
  twitterScheduledFixture,
  linkedinScheduledFixture,
  redditScheduledFixture,
  allPlatformsScheduledFixture,
]

export const allPublishedFixtures = [
  twitterPublishedFixture,
  linkedinPublishedFixture,
  redditPublishedFixture,
]

export const allFixtures = [
  ...allTwitterFixtures,
  ...allLinkedInFixtures,
  ...allRedditFixtures,
  ...allMultiPlatformFixtures,
]
