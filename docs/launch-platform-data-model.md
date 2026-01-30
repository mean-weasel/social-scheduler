# Launch Platform Post Types - Data Model

This document outlines the required fields for each launch platform to support drafting launch campaign content in Bullhorn.

---

## 1. Hacker News (Show HN / Ask HN)

**Platform URL:** https://news.ycombinator.com

**API Access:** None - manual posting only

### Post Types

#### Show HN
For showcasing projects you've built.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | Must start with "Show HN: ", ~80 char max |
| `url` | string | Yes | Link to the project/demo |
| `text` | string | No | Not typically used for Show HN |

#### Ask HN
For asking questions to the community.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | Must start with "Ask HN: ", ~80 char max |
| `url` | string | No | Usually omitted for Ask HN |
| `text` | string | Yes | The question body |

#### Link Post
Standard link submission.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | ~80 char max |
| `url` | string | Yes | Link being shared |

### Notes
- Posts without URLs get penalized in rankings
- Account must have some karma to submit
- Title editing possible shortly after posting

---

## 2. Product Hunt

**Platform URL:** https://www.producthunt.com

**API Access:** None for posting - manual launch only

### Required Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `tagline` | string | Yes | One-line description, ~60 chars |
| `description` | string | Yes | 260 char max |
| `url` | string | Yes | Direct link to product (not press/blog) |
| `thumbnail` | image | Yes | 240x240 square, GIF allowed (<3MB) |
| `gallery` | image[] | Yes | 1270x760 recommended, multiple images |
| `pricing` | enum | Yes | "free" / "paid" / "freemium" |
| `status` | enum | No | "available" / "beta" / "coming_soon" |
| `makers` | string[] | No | Product Hunt usernames |
| `twitterHandle` | string | No | Product's Twitter/X account |
| `promoCode` | string | No | Discount code for PH community |
| `promoDescription` | string | No | What the promo offers |
| `promoExpiry` | date | No | When promo expires |
| `firstComment` | string | Yes | Maker's introductory comment (critical!) |
| `interactiveDemo` | string | No | Arcade/Storylane/Supademo URL |
| `appStoreUrl` | string | No | iOS App Store link |
| `playStoreUrl` | string | No | Google Play Store link |

### Notes
- Must use personal account (not company/branded)
- Account must be >1 week old
- Can schedule launch up to 1 month in advance
- 70% of top products have maker first comment
- Launches happen at 12:01am PT

---

## 3. Dev Hunt

**Platform URL:** https://devhunt.org

**API Access:** GitHub PR-based submissions

### Required Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Tool name |
| `description` | string | Yes | What the tool does |
| `url` | string | Yes | Link to the tool |
| `logo` | image | Yes | Tool logo/icon |
| `screenshots` | image[] | No | Product screenshots |
| `githubUrl` | string | No | GitHub repository |
| `category` | string | Yes | Dev tool category |
| `founderStory` | string | No | Background on creation |

### Notes
- Requires GitHub authentication
- Free submissions have waiting period
- Paid sponsorship for faster review
- Developer-focused audience

---

## 4. BetaList

**Platform URL:** https://betalist.com

**API Access:** None - manual submission

### Required Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Startup name |
| `url` | string | Yes | Must be custom landing page |
| `oneSentencePitch` | string | Yes | Shared on Twitter, ~140 chars |
| `description` | string | Yes | Short and to the point |
| `logo` | image | Yes | Startup logo |
| `screenshots` | image[] | No | Product screenshots |
| `category` | string | Yes | Tech category |

### Eligibility Requirements
- Must be recently launched or unreleased
- Tech startup (hardware or software)
- No blogs, courses, books, newsletters
- Custom landing page (not LaunchRock/Unbounce templates)
- Must have email signup or social connect

### Notes
- Free submission: ~2 month wait
- Paid ($99): ~2 day review
- Each startup gets 2 feature opportunities
- Custom design significantly improves chances

---

## 5. Indie Hackers

**Platform URL:** https://www.indiehackers.com/products

**API Access:** None - manual listing

### Required Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `shortDescription` | string | Yes | Brief pitch |
| `longDescription` | string | No | Detailed description |
| `url` | string | Yes | Must start with https:// |
| `revenue` | string | No | Monthly revenue (transparency encouraged) |
| `affiliateUrl` | string | No | Optional affiliate link |

### Notes
- Community focused on profitable businesses
- Revenue transparency is valued
- Good for ongoing milestone updates

---

## Unified Bullhorn Schema

For the Bullhorn app, we can create a unified `LaunchPost` type:

```typescript
type LaunchPlatform =
  | 'hacker_news_show'
  | 'hacker_news_ask'
  | 'hacker_news_link'
  | 'product_hunt'
  | 'dev_hunt'
  | 'beta_list'
  | 'indie_hackers'

interface LaunchPost {
  id: string
  platform: LaunchPlatform
  status: 'draft' | 'scheduled' | 'posted'

  // Common fields
  title: string              // All platforms
  url: string                // All platforms (optional for Ask HN)
  description: string        // Product Hunt, Dev Hunt, BetaList, Indie Hackers

  // Hacker News specific
  hnText?: string            // For Ask HN body text

  // Product Hunt specific
  phTagline?: string         // 60 char tagline
  phThumbnail?: string       // 240x240 image URL
  phGallery?: string[]       // Gallery image URLs
  phPricing?: 'free' | 'paid' | 'freemium'
  phStatus?: 'available' | 'beta' | 'coming_soon'
  phMakers?: string[]        // PH usernames
  phTwitter?: string         // Product Twitter handle
  phPromoCode?: string
  phPromoDescription?: string
  phPromoExpiry?: string     // ISO date
  phFirstComment?: string    // Critical maker comment
  phInteractiveDemo?: string
  phAppStoreUrl?: string
  phPlayStoreUrl?: string

  // Dev Hunt specific
  dhLogo?: string
  dhScreenshots?: string[]
  dhGithubUrl?: string
  dhCategory?: string
  dhFounderStory?: string

  // BetaList specific
  blOneSentencePitch?: string  // ~140 chars, used on Twitter
  blLogo?: string
  blScreenshots?: string[]
  blCategory?: string

  // Indie Hackers specific
  ihShortDescription?: string
  ihLongDescription?: string
  ihRevenue?: string
  ihAffiliateUrl?: string

  // Metadata
  campaignId?: string
  scheduledAt?: string       // When to remind user to post
  postedAt?: string          // When actually posted
  notes?: string             // Internal notes
  createdAt: string
  updatedAt: string
}
```

---

## Character Limits Summary

| Platform | Field | Limit |
|----------|-------|-------|
| Hacker News | Title | ~80 chars |
| Product Hunt | Tagline | ~60 chars |
| Product Hunt | Description | 260 chars |
| BetaList | One-sentence pitch | ~140 chars |

---

## Reminder System

Since these platforms don't have APIs for posting, Bullhorn should support:

1. **Scheduled reminders** - Email/push notification when it's time to post
2. **Launch checklist** - Platform-specific checklist for launch day
3. **Copy buttons** - One-click copy for each field to paste into platform
4. **Platform links** - Direct links to each platform's submission page

---

## Sources

- [How to Submit a Show HN](https://gist.github.com/tzmartin/88abb7ef63e41e27c2ec9a5ce5d9b5f9)
- [Product Hunt Launch Guide](https://www.producthunt.com/launch)
- [How to post a product - Product Hunt Help](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)
- [DevHunt GitHub](https://github.com/MarsX-dev/devhunt)
- [BetaList Submission Guidelines](https://betalist.com/criteria)
- [Indie Hackers Products](https://www.indiehackers.com/products)
