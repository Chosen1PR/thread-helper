// Learn more at developers.reddit.com/docs
import {
  Devvit
} from "@devvit/public-api";

import {
  removeCommentInsideThread,
  removeCommentOutsideThread,
  removePostOutsideThread,
  updateCommentCountOnDelete,
  isPostFlairApplicable,
} from "./utils-async.js"

Devvit.configure({
  redis: true,
  redditAPI: true,
});

Devvit.addSettings([
  // Config setting for enabling/disabling the app
  {
    type: "boolean",
    name: "enable-app",
    label: "Enable Referral Thread Helper",
    helpText:
      "Enables the Referral Thread Helper app to limit comments on threads based on post flair.",
    defaultValue: true,
    scope: "installation",
  },
  {
    type: "group",
    label: "Thread/Post Settings",
    helpText:
      "Leave below settings blank to disable.",
    fields: [
      // Config setting for post flair list
      {
        type: "paragraph",
        name: "flair-list",
        label: "Post flair list",
        helpText:
          "Comma (,) delimited list of post flairs (case-sensitive) for threads where you want to limit comments.",
        defaultValue: "",
        scope: "installation",
      },
      // Config setting for thread archiving (locking)
      {
        type: "boolean",
        name: "lock-on-unpin",
        label: "Lock threads on unpin",
        helpText:
          `If enabled, pinned (stickied) threads with the above post flair(s) will be locked when they are unpinned (useful for recurring threads). Also unlocks threads when they are pinned (useful for accidental unpins).`,
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for domain whitelist
      {
        type: "paragraph",
        name: "domain-list",
        label: "Domain list",
        helpText:
          `Comma (,) delimited list of acceptable link domains for referral links. You can also use slightly more complex phrases like "example.com/refer/" (without quotes).`,
        defaultValue: "",
        scope: "installation",
      },
      
      // Config setting for removing posts outside of thread
      {
        type: "boolean",
        name: "remove-posts",
        label: "Remove domain-matching posts/comments outside thread",
        helpText:
          "Remove posts and comments outside of the thread that contain a link from one of the above domains.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for marking removed posts as spam
      {
        type: "boolean",
        name: "remove-as-spam",
        label: "Remove posts/comments outside thread as Spam",
        helpText:
          `If enabled, "Spam" will be the removal reason for removed posts and comments outside of the designated thread.`,
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for comment on posts outside of thread
      {
        type: "boolean",
        name: "comment-on-posts",
        label: "Comment on removed posts",
        helpText:
          "Comment on removed posts with a message saying to use the designated thread.",
        defaultValue: false,
        scope: "installation",
      },
    ],
  },
  {
    type: "group",
    label: "Duplicate and Child Comments",
    fields: [
      // Config setting for removing duplicate comments
      {
        type: "boolean",
        name: "remove-duplicates",
        label: "Remove duplicate comments",
        helpText:
          "Limit users to only one comment per thread by removing any duplicate comments.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for updating comment count on comment delete
      {
        type: "boolean",
        name: "update-comment-delete",
        label: "Update comment count with deletes",
        defaultValue: true,
        helpText:
          "Update a user's comment count in a thread when they delete their comment(s). Disable this if you think users will abuse it and delete/create comments over and over again.",
        scope: "installation",
      },
      // Config setting for removing comment replies
      {
        type: "boolean",
        name: "remove-replies",
        label: "Allow top-level comments only",
        helpText: "Lock top-level comments in a thread and remove replies on any unlocked comments.",
        defaultValue: false,
        scope: "installation",
      }   
    ],
  },
  {
    type: "group",
    label: "User Requirements",
    helpText: "Leave below settings at 0 or blank to disable.",
    fields: [
      // Config setting for minimum user karma
      {
        type: "number",
        name: "min-karma",
        label: "Minimum user karma",
        defaultValue: 0,
        helpText:
          "Minimum combined post and comment karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum post karma
      {
        type: "number",
        name: "min-post-karma",
        label: "Minimum post karma",
        defaultValue: 0,
        helpText:
          "Minimum post karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum comment karma
      {
        type: "number",
        name: "min-comment-karma",
        label: "Minimum comment karma",
        defaultValue: 0,
        helpText:
          "Minimum comment karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum subreddit karma
      {
        type: "number",
        name: "min-sub-karma",
        label: "Minimum subreddit karma",
        defaultValue: 0,
        helpText:
          "Minimum subreddit-specific karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum account age
      {
        type: "number",
        name: "min-account-age-days",
        label: "Minimum account age (days)",
        defaultValue: 0,
        helpText:
          "Minimum account age in days a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for user flair requirement
      {
        type: "boolean",
        name: "require-user-flair",
        label: "Require user flair",
        defaultValue: false,
        helpText:
          "If enabled, only flaired users will be allowed to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      {
        type: "paragraph",
        name: "user-flair-css-list",
        label: "User flair CSS class list",
        defaultValue: "",
        helpText:
          "Comma (,) delimited list of CSS classes for flairs which users must have to comment on threads. Leave blank to allow any flair.",
        scope: "installation",
      },
    ],
  },
  {
    type: "group",
    label: "Comment Content Requirements",
    fields: [
      // Config setting for requiring domain-matching comments
      {
        type: "boolean",
        name: "require-domains",
        label: "Require links from domain list in thread",
        helpText:
          "If enabled, comments in thread must contain at least one link from the domain list above to avoid removal.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for removing comments with images
      {
        type: "boolean",
        name: "remove-images",
        label: "Remove comments with images",
        helpText:
          "Remove comments in thread that contain images or reaction gifs. Not necessary if your subreddit does not allow images in comments.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for removing comments with large header text
      {
        type: "boolean",
        name: "remove-headers",
        label: "Remove comments with large header text",
        helpText:
          "Remove comments in thread that contain large header text (e.g., '# Header' in markdown).",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for comment character length
      {
        type: "number",
        name: "max-length",
        label: "Maximum comment length (characters)",
        helpText:
          "Maximum number of characters allowed for comments in thread. Set to 0 to disable.",
        scope: "installation",
      },
      // Config setting for comment regex pattern
      {
        type: "paragraph",
        name: "required-regex",
        label: "Required comment regex pattern",
        helpText:
          "A regex pattern that comments in thread must match to avoid removal. Leave blank to disable.",
        defaultValue: "",
        scope: "installation",
      },
      // Config setting for comment regex pattern 2
      {
        type: "paragraph",
        name: "restricted-regex",
        label: "Restricted comment regex pattern",
        helpText:
          "A regex pattern that comments in thread must not match to avoid removal. Leave blank to disable.",
        defaultValue: "",
        scope: "installation",
      },
    ],
  },
  {
    type: "group",
    label: "User Interaction",
    fields: [
      // Config setting for PMing a user when their comment is removed
      {
        type: "boolean",
        name: "pm-user",
        label: "Message users about comment removal",
        defaultValue: false,
        helpText:
          "Message users privately from the bot account (not modmail) when their comment is removed and explain why.",
        scope: "installation",
      },
      // Config setting for mod note
      {
        type: "boolean",
        name: "add-mod-note",
        label: "Add mod note to users after removal",
        defaultValue: false,
        helpText:
          "Add a mod note to users when their comment is removed and include a short removal reason. " +
          "A regular note with no label will be added for comments removed inside the designated thread, " +
          "while a note with the 'SPAM_WARNING' label will be added for posts or comments removed outside the thread.",
        scope: "installation",
      },
      // Config setting for modmail
      {
        type: "boolean",
        name: "warn-modmail",
        label: "Notify mods of removal outside of thread",
        defaultValue: false,
        helpText:
          "Send a notification modmail to mods when a post or comment is removed outside of the designated thread.",
        scope: "installation",
      },
      // Config setting for banning a user
      {
        type: "boolean",
        name: "ban-user",
        label: "Ban users after removal outside of thread",
        defaultValue: false,
        helpText:
          "Ban users when their post or comment is removed outside of the designated thread. Only works if 'Remove domain-matching posts/comments outside thread' is enabled.",
        scope: "installation",
      },
      // Config setting for ban duration
      {
        type: "number",
        name: "ban-days",
        label: "Ban duration (days)",
        defaultValue: 1,
        helpText:
          "Duration of ban in days (1-999, whole numbers only). Set to 0 for permanent. This only applies if the ban setting above is enabled.",
        scope: "installation",
      }
    ]
  },
  // Config setting for exempting moderators to all rules
  {
    type: "boolean",
    name: "mods-exempt",
    label: "Moderators exempt",
    defaultValue: true,
    helpText: "Disable for testing, but most mods should leave this enabled.",
    scope: "installation",
  },
]);

// Button for config settings on Devvit site
// Currently disabled (probably not needed)
/*
Devvit.addMenuItem({
  label: "Referral Thread Helper",
  description: "Settings",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (event, context) => {
    context.ui.navigateTo(
      `https://developers.reddit.com/r/${context.subredditName!}/apps/${context.appSlug}`
    );
  },
});
*/

// Create comment trigger handler
Devvit.addTrigger({
  events: ["CommentCreate", "CommentUpdate"],
  onEvent: async (event, context) => {
    // Check if app is enabled
    const appEnabled = await context.settings.get("enable-app");
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    // Check if this post flair applies
    const postFlairIsApplicable = await isPostFlairApplicable(event.post?.linkFlair?.text ?? "", context);
    if (!postFlairIsApplicable) {
      // If this post does not match any flair, check if the comment is allowed outside of the thread.
      await removeCommentOutsideThread(
        event.comment?.id!,
        event.comment?.body!,
        event.author?.name!,
        event.post?.permalink!,
        event.comment?.permalink!,
        context
      );
      return; // Rest of the code only applies to posts with specified flair.
    }
    await removeCommentInsideThread(
      event.comment?.id!,
      event.comment?.body!,
      event.comment?.permalink!,
      event.post?.id!,
      event.post?.linkFlair?.text ?? "",
      event.post?.permalink!,
      event.author?.id!,
      event.author?.name!,
      event.author?.karma!,
      event.author?.flair?.text,
      event.type,
      context
    );
  },
});

// Update comment count on delete only if the config setting says so
Devvit.addTrigger({
  event: "CommentDelete",
  onEvent: async (event, context) => {
    //console.log(`A new comment was deleted: ${JSON.stringify(event)}`);
    const source = event.source.valueOf(); // 3 = mod; 2 = admin; 1 = user; 0 = unknown; -1 = unrecognized
    if (source != 1) return; // If a comment was not deleted by its author, don't do anything.
    // Check if app is enabled
    const appEnabled = await context.settings.get("enable-app");
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    const removeDuplicates = (await context.settings.get("remove-duplicates")) as boolean; //check if duplicate removal enabled
    if (!removeDuplicates) return; // If not enabled, don't do anything.
    const updateDelete = await context.settings.get("update-comment-delete"); //check if update with delete enabled
    if (!updateDelete) return; // If not enabled, don't do anything.
    // If we got here, then "remove duplicates" is enabled and "update with comment deletes" is enabled.
    const userId = event.author?.id!;
    const postId = event.postId!;
    const commentId = event.commentId!;
    await updateCommentCountOnDelete(commentId, postId, userId, context);
  },
});

// Remove posts outside of thread: post trigger handler
Devvit.addTrigger({
  events: ["PostSubmit", "PostUpdate"],
  onEvent: async (event, context) => {
    // Check if app is enabled
    const appEnabled = (await context.settings.get("enable-app")) as boolean;
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    // Check if removing posts is enabled
    const removePosts = await (context.settings.get("remove-posts")) as boolean;
    if (!removePosts) return; // If setting is disabled, don't do anything.
    // If we got here, we use the below function to determine if a post should be removed.
    await removePostOutsideThread(
      event.post?.id!,
      event.post?.title ?? "",
      event.post?.selftext ?? "",
      event.post?.url ?? "",
      event.post?.permalink!,
      event.author?.name ?? "",
      event.post?.crosspostParentId ?? "",
      context
    );
  },
});

// Lock referral threads when unpinned; unlock when pinned.
Devvit.addTrigger({
  events: ["ModAction"],
  onEvent: async (event, context) => {
    //console.log(event.action);
    if (event.action == "sticky" || event.action == "unsticky") {
      const commentId = event.targetComment?.id;
      if (commentId) return; // If a comment is being pinned or unpinned instead of a post, do nothing.
      const postFlairText = event.targetPost?.linkFlair?.text ?? "";
      if (postFlairText == "") return; // If the post has no flair, do nothing.
      const appEnabled = (await context.settings.get("enable-app")) as boolean;
      if (!appEnabled) return; // If the app is not enabled, do nothing.
      const lockOnUnsticky = (await context.settings.get("lock-on-unpin")) as boolean;
      if (!lockOnUnsticky) return; // If the setting for locking is not enabled, do nothing.
      const postLockStateShouldChange = await isPostFlairApplicable(postFlairText, context);
      if (!postLockStateShouldChange) return; // If the post flair is not applicable, do nothing.
      // If we're here, time to lock/unlock the post.
      const postId = event.targetPost?.id!;
      const post = await context.reddit.getPostById(postId);
      const postIsLocked = post.isLocked();
      if (event.action == "sticky" && postIsLocked) {
        await post.unlock();
      }
      else if (event.action == "unsticky" && !postIsLocked) {
        await post.lock();
      }
    }
  },
});

export default Devvit;