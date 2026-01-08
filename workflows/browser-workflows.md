# Browser Workflows

> Auto-generated workflow documentation for Social Scheduler
> Last updated: 2026-01-07

## Quick Reference

| Workflow | Purpose | Steps |
|----------|---------|-------|
| Dashboard Overview | View stats, recent posts, and navigate | 6 |
| Navigation Flow | Navigate between all app sections | 7 |
| First-Time User Experience | Handle empty states, create first post | 5 |
| Create Twitter Post | Full Twitter post with media | 10 |
| Create LinkedIn Post | LinkedIn post with visibility settings | 9 |
| Create Reddit Post | Multi-subreddit crossposting | 12 |
| Edit Existing Post | Modify content, schedule, campaign | 8 |
| Schedule Post for Future | Date/time selection and scheduling | 6 |
| Publish Post Immediately | Mark as posted workflow | 5 |
| Search and Filter Posts | List/calendar views, filtering, search | 8 |
| Create New Campaign | Modal form submission | 5 |
| Edit Campaign Details | Inline editing name, description, status | 7 |
| Add Posts to Campaign | Link existing or create new posts | 6 |
| Delete Campaign | Confirmation and deletion | 4 |
| Upload Media to Post | Drag-drop or click upload | 7 |
| Remove Media from Post | Delete uploaded media | 4 |
| Change Theme | Light/Dark/System switching | 4 |
| Enable Browser Notifications | Permission request and toggle | 5 |
| Archive and Restore Post | Soft delete and recovery | 6 |

---

## Core Workflows

### Workflow: Dashboard Overview

> Tests the main dashboard view with stats, recent posts, and campaign cards.

**Prerequisites:**
- App running at http://localhost:5173 (or configured URL)
- At least one post and one campaign exist for full testing

1. Navigate to the dashboard
   - Open the app URL in browser
   - Verify the dashboard loads with the header showing "Social Scheduler" logo
   - Verify the gold accent line appears beneath the header

2. Verify stats bar displays correctly
   - Verify "Scheduled" count displays with Calendar icon
   - Verify "Drafts" count displays with FileText icon
   - Verify "Published" count displays with CheckCircle icon
   - Verify "Campaigns" count displays (desktop only)

3. Check recent posts sections
   - Verify "Upcoming" section shows scheduled posts (or empty state)
   - Verify "Drafts" section shows draft posts (or empty state)
   - Verify "Published" section shows published posts (or empty state)
   - Each post card should show platform indicator, content preview, and timestamp

4. Check campaigns section
   - Verify "Campaigns" section shows recent campaigns
   - Each campaign card shows folder icon, name, status badge, and description

5. Test "View all" navigation
   - Click "View all" link in any section
   - Verify navigation to appropriate page (/posts or /campaigns)
   - Verify correct filter is applied via URL parameter

6. Test New Post button (desktop)
   - Verify gold "New Post" button appears in stats bar
   - Click the button
   - Verify navigation to /new editor page

---

### Workflow: Navigation Flow

> Tests all navigation paths between app sections on desktop and mobile.

**Prerequisites:**
- App running and accessible

1. Test header navigation (desktop)
   - Click the logo/title in header
   - Verify navigation to dashboard (/)
   - Click the Campaigns icon in header
   - Verify navigation to /campaigns
   - Click the Settings icon in header
   - Verify navigation to /settings

2. Test bottom navigation (mobile)
   - Resize browser to mobile width (<768px)
   - Verify bottom navigation bar appears
   - Click Home icon, verify navigation to /
   - Click Calendar icon, verify navigation to /posts
   - Click center "+" button, verify navigation to /new
   - Click Folder icon, verify navigation to /campaigns
   - Click More icon, verify navigation to /settings

3. Test FAB button (desktop)
   - Resize browser to desktop width (>=768px)
   - Verify floating action button appears (bottom-right, gold)
   - Hover over FAB, verify scale and rotation animation
   - Click FAB, verify navigation to /new

4. Test back navigation from editor
   - Navigate to /new
   - Verify back arrow appears in header
   - Click back arrow
   - Verify navigation to dashboard

5. Test breadcrumb navigation in campaigns
   - Navigate to /campaigns
   - Click a campaign card
   - Verify navigation to /campaigns/:id
   - Click "Back to Campaigns" link
   - Verify navigation to /campaigns

6. Verify active state indicators
   - Navigate to each section
   - Verify gold highlight on active nav item (bottom nav on mobile)
   - Verify URL matches expected route

7. Test deep linking
   - Navigate directly to /posts?status=scheduled
   - Verify posts page loads with "Scheduled" filter active
   - Navigate directly to /edit/[valid-post-id]
   - Verify editor loads with post data

---

### Workflow: First-Time User Experience

> Tests empty states and first-time user onboarding flow.

**Prerequisites:**
- Fresh app state with no posts or campaigns

1. View empty dashboard
   - Navigate to /
   - Verify empty state message displays
   - Verify "Create First Post" button appears with Sparkles icon
   - Verify encouraging message about getting started

2. View empty posts page
   - Navigate to /posts
   - Verify empty state with message about no posts
   - Verify "Create your first post" call-to-action

3. View empty campaigns page
   - Navigate to /campaigns
   - Verify empty state displays
   - Verify "New Campaign" button is visible

4. Create first post from empty state
   - Click "Create First Post" button on dashboard
   - Verify navigation to /new
   - Verify editor loads with empty form

5. Verify empty states update after content creation
   - Create and save a draft post
   - Navigate back to dashboard
   - Verify post now appears in "Drafts" section
   - Verify empty state is replaced with post card

---

## Post Management Workflows

### Workflow: Create Twitter Post

> Tests creating a new Twitter/X post with media and scheduling.

**Prerequisites:**
- App running at configured URL
- Test image file available for upload

1. Navigate to post editor
   - Click FAB button (desktop) or "+" button (mobile)
   - Verify /new page loads
   - Verify platform selector shows three options

2. Select Twitter platform
   - Click "Twitter" button in platform selector
   - Verify Twitter button shows checkmark and blue highlight
   - Verify character counter shows "0 / 280"

3. Enter post content
   - Click in the content textarea
   - Type test content (e.g., "This is a test tweet for workflow validation")
   - Verify character counter updates in real-time
   - Verify counter turns yellow when near limit (>252 chars)
   - Verify counter turns red when over limit (>280 chars)

4. Add notes (optional)
   - Click the Notes toggle button (StickyNote icon)
   - Verify notes section expands
   - Type notes text in the textarea
   - Verify gold accent appears when notes has content

5. Upload media
   - Click the media toggle button (Image icon)
   - Verify media upload section expands
   - [MANUAL] Click upload zone or drag image file
   - Verify upload progress bar appears
   - Verify image preview displays after upload
   - Verify media count badge updates on toggle button

6. Add multiple images (Twitter-specific)
   - Upload up to 3 more images
   - Verify grid layout adjusts (2-column for multiple)
   - Verify "Maximum files reached" message when at 4
   - Verify upload zone becomes disabled

7. Set schedule
   - Click the date picker button (Calendar icon)
   - [MANUAL] Select a future date from the date picker
   - Click the time picker button (Clock icon)
   - [MANUAL] Select a time from the time picker
   - Verify selected date and time display in buttons

8. Assign to campaign (optional)
   - Click campaign selector dropdown
   - Verify list of available campaigns appears
   - Click a campaign name
   - Verify campaign name shows in selector

9. Save as draft
   - Click "Save Draft" button
   - Verify toast notification "Post saved as draft"
   - Verify navigation to dashboard
   - Verify post appears in Drafts section

10. Schedule the post
    - Navigate back to edit the draft (/edit/:id)
    - Click "Schedule" button
    - Verify toast notification "Post scheduled"
    - Verify post status changes to "Scheduled"

---

### Workflow: Create LinkedIn Post

> Tests creating a LinkedIn post with visibility settings.

**Prerequisites:**
- App running at configured URL

1. Navigate to post editor
   - Click FAB or "+" button
   - Verify /new page loads

2. Select LinkedIn platform
   - Click "LinkedIn" button
   - Verify LinkedIn button shows checkmark and blue highlight
   - Verify character counter shows "0 / 3,000"

3. Enter post content
   - Type content in the textarea
   - Verify character counter updates
   - Note: LinkedIn allows much longer content than Twitter

4. Configure visibility settings
   - Verify LinkedIn Settings panel appears below content
   - Verify two visibility options: "Public" and "Connections Only"
   - Click "Connections Only"
   - Verify button shows gold highlight when selected

5. Upload media (single file)
   - Click media toggle button
   - [MANUAL] Upload one image or video
   - Verify single preview displays (not grid)
   - Verify upload zone is disabled after one file (LinkedIn limit)

6. Verify live preview (desktop)
   - On desktop, verify right-side preview panel
   - Verify preview shows LinkedIn-style formatting
   - Verify visibility indicator shows in preview

7. Set schedule
   - Select future date and time
   - Verify schedule displays correctly

8. Save and schedule
   - Click "Schedule" button
   - Verify post is saved with status "Scheduled"

9. Verify platform-specific storage
   - Edit the saved post
   - Verify visibility setting persists
   - Verify content and media are intact

---

### Workflow: Create Reddit Post

> Tests creating a Reddit post with multi-subreddit crossposting.

**Prerequisites:**
- App running at configured URL

1. Navigate to post editor
   - Click FAB or "+" button
   - Verify /new page loads

2. Select Reddit platform
   - Click "Reddit" button
   - Verify Reddit button shows checkmark and orange highlight
   - Verify character counter shows "0 / 40,000"

3. Enter post body content
   - Type content in the main textarea
   - This becomes the body text for the Reddit post

4. Add first subreddit
   - Locate subreddit input field with "r/" prefix
   - Type a subreddit name (e.g., "test")
   - Click "Add" button or press Enter
   - Verify subreddit card appears below

5. Configure subreddit-specific settings
   - Verify subreddit card shows "r/test"
   - Click to expand the card (ChevronDown)
   - Verify expanded view shows:
     - Title input (required for Reddit)
     - Optional schedule override (date/time pickers)
     - Flair input (optional)
     - Link URL input (optional)

6. Set subreddit title
   - Type a title in the Title input (e.g., "Test Post Title")
   - Verify character counter shows "0/300"
   - Verify title appears in collapsed card preview

7. Add additional subreddits for crossposting
   - Type another subreddit name (e.g., "testing")
   - Click Add
   - Verify second subreddit card appears
   - Configure title for second subreddit

8. Set per-subreddit schedules (optional)
   - Expand first subreddit card
   - Click date picker, select a date
   - Click time picker, select a time
   - Expand second subreddit
   - Set a different schedule time
   - Verify each card shows its own schedule

9. Set main schedule (fallback)
   - Set date and time in main schedule section
   - This applies to any subreddit without override

10. Test subreddit removal
    - Click X button on one subreddit card
    - Verify card is removed from list

11. Save the multi-subreddit post
    - Click "Schedule" button
    - Verify all subreddit posts are created
    - Note: Each subreddit creates a separate post with shared groupId

12. Verify grouped posts
    - Navigate to /posts
    - Verify multiple Reddit posts appear (one per subreddit)
    - Each should show its configured schedule

---

### Workflow: Edit Existing Post

> Tests editing an existing post's content, schedule, and campaign assignment.

**Prerequisites:**
- At least one saved post exists

1. Navigate to post from dashboard
   - Find a post card in dashboard sections
   - Click the post card
   - Verify navigation to /edit/:id
   - Verify post content loads in editor

2. Modify post content
   - Change the text in content textarea
   - Verify auto-save indicator shows "Saving..." then "Saved"
   - Verify character counter updates

3. Change schedule
   - Click date picker, select different date
   - Click time picker, select different time
   - Verify schedule updates in the form

4. Change campaign assignment
   - Click campaign selector
   - Select a different campaign (or "No Campaign")
   - Verify selection updates

5. Test platform switching (with confirmation)
   - Click a different platform button
   - Verify confirmation dialog appears
   - Dialog warns about content differences
   - Click "Cancel" to keep current platform
   - Click platform again, then "Switch" to change

6. Copy content to clipboard
   - Click copy button (clipboard icon) next to character count
   - Verify button changes to checkmark with "Copied!" state
   - Verify clipboard contains post content

7. Test keyboard shortcuts
   - Press Ctrl+S (Cmd+S on Mac)
   - Verify post saves (toast notification)
   - Press Escape
   - Verify navigation back to dashboard

8. Verify changes persisted
   - Navigate to the post again
   - Verify all changes are intact

---

### Workflow: Schedule Post for Future

> Tests the complete scheduling flow with date/time pickers.

**Prerequisites:**
- Draft post exists or create new post

1. Open post editor
   - Navigate to /new or /edit/:id
   - Verify schedule section is visible

2. Open date picker
   - Click the date button (shows "Select date" or current date)
   - [MANUAL] Native date picker dialog opens
   - Select a future date
   - Verify date button updates to show selected date (format: "Jan 15, 2026")

3. Open time picker
   - Click the time button (shows "Select time" or current time)
   - [MANUAL] Native time picker dialog opens
   - Select a time
   - Verify time button updates to show selected time (format: "2:30 PM")

4. Verify schedule validation
   - Note: Schedule button should be enabled only when both date and time are set
   - Clear the date (if possible) and verify Schedule button shows validation tooltip

5. Click Schedule button
   - Click the blue "Schedule" button
   - Verify toast notification "Post scheduled successfully"
   - Verify navigation to dashboard or posts list

6. Verify scheduled status
   - Find the post in the Posts list
   - Verify status badge shows "Scheduled" with Calendar icon
   - Verify scheduled time displays correctly

---

### Workflow: Publish Post Immediately

> Tests publishing a post for immediate posting.

**Prerequisites:**
- Draft or scheduled post exists

1. Open post editor
   - Navigate to /edit/:id with a draft post

2. Click Publish Now
   - Click the "Publish Now" button (Send icon)
   - Verify post is scheduled with current timestamp
   - Verify toast notification appears

3. Mark as Posted (alternative flow)
   - Open a scheduled post
   - Click "Mark as Posted" button (CheckCircle icon, green)
   - Verify post status changes to "Published"
   - Verify publishedAt timestamp is set

4. Add published URL
   - After marking as posted, expand "Published Links" section
   - Enter the live URL where post was published
   - Verify URL is saved with the post

5. Verify published state
   - Navigate to /posts
   - Filter by "Published" status
   - Verify post appears with CheckCircle icon and green badge

---

### Workflow: Search and Filter Posts

> Tests list view, calendar view, filtering, and search functionality.

**Prerequisites:**
- Multiple posts exist with different statuses

1. Navigate to Posts page
   - Click /posts in navigation
   - Verify posts list loads

2. Test status filter tabs
   - Click "All" tab, verify all posts show
   - Click "Draft" tab, verify only drafts show
   - Click "Scheduled" tab, verify only scheduled posts show
   - Click "Published" tab, verify only published posts show
   - Note: "Failed" and "Archived" tabs only appear if posts exist with those statuses

3. Test search functionality
   - Type search query in search input
   - Verify posts filter by content match
   - Verify search also matches notes content
   - Verify result count shows (e.g., "3 results")
   - Click X button to clear search
   - Verify all posts return

4. Switch to Calendar view
   - Click "Calendar" view button (grid icon)
   - Verify calendar grid displays with current month
   - Verify scheduled posts appear as pills on their dates

5. Navigate calendar months
   - Click left arrow to go to previous month
   - Click right arrow to go to next month
   - Click "Today" button to return to current month
   - Verify post pills update for visible month

6. Create post from calendar date
   - Click on a future date cell (not past)
   - Verify navigation to /new?date=YYYY-MM-DD
   - Verify date picker is pre-filled with clicked date

7. Edit post from calendar
   - Click a post pill in the calendar
   - Verify navigation to /edit/:id

8. Switch back to List view
   - Click "List" view button
   - Verify list view displays again with cards

---

## Campaign Workflows

### Workflow: Create New Campaign

> Tests creating a new campaign via the modal form.

1. Navigate to Campaigns page
   - Click Campaigns in navigation
   - Verify /campaigns page loads

2. Open new campaign modal
   - Click "New Campaign" button (gold, with Plus icon)
   - Verify modal appears with overlay
   - Verify modal has scale-in animation

3. Fill campaign form
   - Verify name input is focused (autofocus)
   - Type campaign name (e.g., "Q1 Marketing Campaign")
   - Type description in textarea (optional)

4. Submit the form
   - Click "Create Campaign" button
   - Verify modal closes
   - Verify toast notification "Campaign created"
   - Verify new campaign appears in list

5. Verify campaign details
   - Click the new campaign card
   - Verify navigation to /campaigns/:id
   - Verify name and description display correctly
   - Verify initial status is "Draft"

---

### Workflow: Edit Campaign Details

> Tests inline editing of campaign metadata and status.

**Prerequisites:**
- At least one campaign exists

1. Navigate to campaign detail
   - Go to /campaigns
   - Click a campaign card
   - Verify /campaigns/:id loads

2. Enter edit mode
   - Click Edit button (Edit2 icon) next to campaign name
   - Verify form switches to edit mode
   - Verify name input appears with current value
   - Verify description textarea appears

3. Edit campaign name
   - Clear and type new name
   - Verify input accepts changes

4. Edit description
   - Modify description text
   - Verify textarea accepts changes

5. Save changes
   - Click "Save" button
   - Verify form switches back to view mode
   - Verify new name and description display

6. Change campaign status
   - In view mode, locate status buttons (Draft, Active, Completed, Archived)
   - Click "Active" button
   - Verify button shows gold highlight
   - Verify status badge updates

7. Cancel edit without saving
   - Enter edit mode again
   - Make changes
   - Click "Cancel" button
   - Verify original values are restored

---

### Workflow: Add Posts to Campaign

> Tests linking existing posts and creating new posts within a campaign.

**Prerequisites:**
- Campaign exists
- At least one post exists without a campaign

1. Navigate to campaign detail
   - Go to /campaigns/:id

2. Add existing post via modal
   - Click "Add Existing Post" button (only visible if unassigned posts exist)
   - Verify modal opens with list of available posts
   - Verify posts show platform, status, and content preview

3. Select a post to add
   - Click a post in the modal list
   - Verify modal closes
   - Verify post now appears in campaign's post list
   - Verify toast notification confirms addition

4. Create new post in campaign
   - Click "New Post" button (gold gradient)
   - Verify navigation to /new?campaign=:campaignId
   - Verify campaign selector shows the current campaign

5. Save the new post
   - Fill in post content
   - Save or schedule the post
   - Navigate back to campaign detail
   - Verify new post appears in campaign's post list

6. Remove post from campaign
   - In campaign detail, find a post card
   - Click X button on the post card
   - Verify post is removed from campaign (unlinked, not deleted)
   - Verify post still exists in main posts list

---

### Workflow: Delete Campaign

> Tests campaign deletion with confirmation.

**Prerequisites:**
- Campaign exists (preferably one created for testing)

1. Navigate to campaign detail
   - Go to /campaigns/:id

2. Initiate deletion
   - Click Delete button (Trash2 icon, red, top-right)
   - Verify confirmation dialog appears
   - Verify dialog shows warning message

3. Cancel deletion
   - Click "Cancel" or "Keep" button
   - Verify dialog closes
   - Verify campaign still exists

4. Confirm deletion
   - Click Delete button again
   - Click "Delete" in confirmation dialog
   - Verify navigation to /campaigns
   - Verify campaign no longer appears in list
   - Note: Posts previously in campaign remain but are unlinked

---

## Media Workflows

### Workflow: Upload Media to Post

> Tests the complete media upload flow with progress and preview.

**Prerequisites:**
- Test image and video files available
- Post editor open with Twitter or LinkedIn selected

1. Open media section
   - Click media toggle button (Image icon)
   - Verify upload zone expands
   - Verify dashed border upload area displays

2. Upload via click
   - Click anywhere in the upload zone
   - [MANUAL] File picker dialog opens
   - Select an image file
   - Verify upload progress bar appears with percentage
   - Verify image preview displays after completion

3. Upload via drag and drop
   - [MANUAL] Drag an image file from file explorer
   - Verify upload zone border color changes on drag-over
   - [MANUAL] Drop the file
   - Verify upload processes and preview appears

4. View upload progress
   - During upload, verify:
     - Filename displays
     - Progress bar fills
     - Percentage number updates
     - Spinner animation shows

5. Verify media preview
   - Verify uploaded image shows as thumbnail
   - Verify aspect ratio is maintained
   - Hover over preview to reveal delete button

6. Test file type validation
   - [MANUAL] Attempt to upload an unsupported file type (e.g., .pdf)
   - Verify error message appears
   - Verify error can be dismissed with X button

7. Test file size validation
   - [MANUAL] Attempt to upload an oversized file
   - Verify error message shows size limit

---

### Workflow: Remove Media from Post

> Tests removing uploaded media from a post.

**Prerequisites:**
- Post with uploaded media in editor

1. View current media
   - Verify media preview is visible
   - Verify delete button appears on hover

2. Remove media
   - Hover over the media preview card
   - Click the X (delete) button
   - Verify media is removed from preview
   - Verify upload zone becomes active again

3. Verify removal persists
   - Save the post
   - Reload the editor
   - Verify media is no longer attached

4. Re-upload media
   - Upload a new file
   - Verify upload works after removal

---

## Settings Workflows

### Workflow: Change Theme

> Tests theme switching between Light, Dark, and System modes.

1. Navigate to Settings
   - Click Settings in navigation
   - Verify /settings page loads

2. View current theme
   - Locate Appearance section
   - Verify three theme buttons: Light (Sun), Dark (Moon), System (Monitor)
   - Verify current theme has highlighted border

3. Switch to Dark theme
   - Click "Dark" button
   - Verify immediate theme change (dark background, light text)
   - Verify Dark button shows active state

4. Switch to Light theme
   - Click "Light" button
   - Verify immediate theme change (light background, dark text)
   - Verify Light button shows active state

5. Switch to System theme
   - Click "System" button
   - Verify theme matches OS preference
   - Verify System button shows active state

6. Verify theme persistence
   - Refresh the page
   - Verify theme selection persists

---

### Workflow: Enable Browser Notifications

> Tests the notification permission flow and toggle.

**Prerequisites:**
- Browser supports notifications
- Notifications not yet granted for this site

1. Navigate to Settings
   - Go to /settings
   - Locate Notifications section

2. View initial state
   - If not granted: "Enable Notifications" button should display
   - If blocked: Alert message with instructions should display

3. Request notification permission
   - Click "Enable Notifications" button
   - [MANUAL] Browser permission prompt appears
   - [MANUAL] Click "Allow" in browser prompt

4. Verify enabled state
   - Verify green checkmark and "Browser notifications enabled" message
   - Verify toggle switch for "Post reminders" appears

5. Toggle post reminders
   - Click the toggle switch
   - Verify switch animates to off position
   - Verify Bell icon changes to BellOff
   - Click again to re-enable
   - Verify switch animates to on position

---

## Edge Case Workflows

### Workflow: Archive and Restore Post

> Tests the archive/restore flow for soft-deleting and recovering posts.

**Prerequisites:**
- At least one non-archived post exists

1. Open post for archiving
   - Navigate to /edit/:id with a draft or scheduled post
   - Verify "Archive" button is visible (not "Restore")

2. Archive the post
   - Click "Archive" button
   - Verify confirmation dialog appears
   - Click "Archive" to confirm
   - Verify toast notification "Post archived"
   - Verify navigation away from editor

3. Find archived post
   - Navigate to /posts
   - Click "Archived" tab (appears when archived posts exist)
   - Verify archived post appears in list

4. Open archived post
   - Click the archived post card
   - Verify editor opens
   - Verify "Restore" and "Delete" buttons are visible
   - Verify "Archive" button is hidden

5. Restore the post
   - Click "Restore" button
   - Verify toast notification "Post restored"
   - Verify post status changes to "Draft"
   - Verify "Archive" button reappears

6. Permanently delete (optional)
   - Archive the post again
   - Open the archived post
   - Click "Delete" button
   - Verify confirmation dialog with warning
   - Click "Delete" to confirm
   - Verify post is permanently removed

---

### Workflow: Handle Empty States

> Verifies proper empty state displays across all pages.

1. Empty Dashboard
   - With no posts/campaigns, verify:
     - Sparkles icon displays
     - Encouraging message shows
     - "Create First Post" CTA button appears

2. Empty Posts List
   - Navigate to /posts with no posts
   - Verify empty state message
   - Verify list view shows appropriate empty state
   - Switch to calendar view, verify empty state handling

3. Empty Campaigns List
   - Navigate to /campaigns with no campaigns
   - Verify empty state with "New Campaign" prompt

4. Empty Campaign Detail
   - Create a campaign with no posts
   - Navigate to its detail page
   - Verify "No posts in this campaign yet" message
   - Verify "New Post" button is visible

5. Empty Search Results
   - Navigate to /posts with existing posts
   - Search for a term that matches no posts
   - Verify "No posts found" or similar message
   - Clear search, verify posts return

---

## Automation Notes

### Known Limitations

These interactions require `[MANUAL]` intervention:

| Feature | Limitation | Workaround |
|---------|------------|------------|
| File upload dialogs | Native OS dialogs cannot be automated | Mark as [MANUAL], pre-stage files |
| Date/time pickers | Native browser pickers | Use keyboard input or mark [MANUAL] |
| Browser permission prompts | OS-level dialogs | Pre-configure permissions or mark [MANUAL] |
| Clipboard operations | May require permissions | Verify via paste into test field |

### Keyboard Shortcuts (Editor)

| Shortcut | Action |
|----------|--------|
| Ctrl+S / Cmd+S | Save Draft |
| Ctrl+Enter / Cmd+Enter | Schedule Post |
| Escape | Return to dashboard |

### Test Data Recommendations

- Create at least 5 posts across different platforms and statuses
- Create 2-3 campaigns with varying statuses
- Upload test media files (images and video) for media workflows
- Test with both empty and populated states
