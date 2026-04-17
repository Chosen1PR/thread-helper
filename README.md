## Features

Do you have referral megathreads in your community for certain products or services? Do you often find a lot of rule-breaking comments in those threads? This app can help! It allows you to:

- Limit users to one comment per referral thread.
- Disable comment replies so that only top-level comments are allowed.
- Disable large header text, images, and reaction gifs only in referral threads.
- Define a maximum number of characters for referral comments.
- Require a minimum post karma, comment karma, combined karma, and/or subreddit-specific karma to comment in referral threads. These user requirements are hidden and never publicly exposed.
- Allow only flaired users to comment in referral threads, and optionally define a list of required flair CSS classes.
- Define a list of acceptable link domains for referral links.
- Require links in thread comments.
- Remove comments from outside the thread that contain a referral link.
- Define regexes that comments must have or must not match.
- Remove posts that contain referral links.
- Message users privately from the bot account (not modmail) when their comment is removed and explain why.
- Comment on posts that contain referral links.
- Receive modmail notifications when a post or comment outside of the designated thread is removed.
- Optionally ban users if they share a referral link outside of the designated thread.

For even further automation with referral threads or other posts, feel free to check out some of my other apps!

- [**Pinned Post Archiver**](https://developers.reddit.com/apps/sticky-archiver) locks pinned posts (such as megathreads) automatically when they are unpinned from the Community Highlights section. Configurable by post flair or title.
- [**Diverse Comments**](https://developers.reddit.com/apps/diverse-comments) allows more comment removal versatility, with a customizable limit on an individual user's comments per post, or a customizable limit on how long comment reply chains can get. Configurable by post flair.
- [**Lock Removed Posts**](https://developers.reddit.com/apps/diverse-comments) locks posts automatically once they are removed by a mod or deleted by the OP. Optionally, it can also remove all comments from spam posts.

---

## Changelog

### [0.1.17] (2026-04-17)

- Minor change to ban message wording.

### [0.1.16] (2026-03-19)

#### Features

- Added the ability to ban users automatically if they share a referral link outside of the designated thread.
- There is now a unified setting to remove both posts and comments outside of the designated thread.

### [0.1.14] (2026-03-04)

#### Features

- Added the ability to require a specific amount of subreddit-specific karma to share referrals.
- Extended the mod note functionality from the previous update to posts and comments *outside* of the designated thread.
- Added the option to receive modmail notifications when a post or comment outside of the designated thread is removed.

### [0.1.10] (2026-02-28)

#### Bug Fixes

- App now applies all rules and settings to edited comments in addition to new comments.

#### Features

- App can now add a mod note to users when their comment is removed from the designated thread with a short 1 to 2 word removal reason.
- Dropped support for post title keyword list due to disuse.

### [0.1.9] (2026-01-15)

- New app icon.

### [0.1.4] (2026-01-02)

#### Features

- Added the ability to remove comments with large, distracting header text.
- Added the ability to set a maximum character count for referral comments.
- Added the word "Settings" to the subreddit-level menu item.
- Updated Devvit version to 0.12.7.
- Bumped minor version.

### [0.0.20] (2025-12-10)

#### Features

- There is now a unified "top-level comments only" setting that locks top-level comments in addition to removing replies.
- Performance improvements and better source code legibility.

### [0.0.18] (2025-11-29)

#### Bug Fixes

- Changed the way comments on referral posts by users work. Now, a post must be removed by the app for a comment to be left on it.
- Fixed the way the app determines who is a mod by including AutoModerator and the -ModTeam account.
- Prevented app from messaging AutoModerator or -ModTeam account.

### [0.0.12] (2025-11-25)

#### Bug Fixes

- Fixed a bug that commented on every post (instead of only posts containing referral links) if the "Comment on posts" setting was enabled.

### [0.0.11] Initial version (2025-11-24)

#### Features

- Limit users to one comment per referral thread.
- Disable comment replies so that only top-level comments are allowed.
- Disable images and reaction gifs in comments only in referral threads.
- Require a minimum post karma, comment karma, and/or combined karma to comment in referral threads. These user requirements are hidden and never publicly exposed.
- Allow only flaired users to comment in referral threads, and optionally define a list of required flair CSS classes.
- Define a list of acceptable link domains for referral links.
- Require links in thread comments.
- Remove comments from outside the thread that contain a referral link.
- Define regexes that comments must have or must not have.
- Optionally message users privately from the bot account (not modmail) when their comment is removed and explain why.
- Remove posts that contain referral links.
- Optionally comment on posts that contain referral links.

#### Bug Fixes

None yet (initial version). Please send a private message to the developer (u/Chosen1PR) to report bugs.
