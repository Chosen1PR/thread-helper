// Learn more at developers.reddit.com/docs
import {
  Devvit
} from "@devvit/public-api";

import {
    getKeyForComments,
    getReasonScope,
    getReasonForRemoval,
    postContainsBannedDomain,
} from "./utils.js"

import {
  removeCommentOutsideThread,
  removeDuplicateComment,
  lockTopLevelCommentOrRemoveReply,
  removeCommentAccordingToUserRequirements,
  removeCommentAccordingToContentRequirements,
  isPostFlairApplicable,
  isPostTitleApplicable,
  pmUser,
  commentOnRemovedPost,
  userIsMod,
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
      "Enables the Referral Thread Helper app to limit comments on threads based on flair or title keywords.",
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
      // Config setting for post title keyword list
      {
        type: "paragraph",
        name: "title-list",
        label: "Post title keyword list",
        helpText:
          "Comma (,) delimited list of post title keywords or phrases (case-sensitive) for threads where you want to limit comments.",
        defaultValue: "",
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
        label: "Remove domain-matching posts",
        helpText:
          "Remove posts outside of the thread that contain a link from one of the above domains.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for marking removed posts as spam
      {
        type: "boolean",
        name: "remove-posts-as-spam",
        label: "Remove posts as spam",
        helpText:
          `If enabled, "Spam" will be the removal reason for removed posts.`,
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
    label: "Duplicate Comments Settings",
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
        label: "Update with comment deletes",
        defaultValue: true,
        helpText:
          "Update a user's comment count in a thread when they delete their comment(s). Turn this off if you think users will abuse this and spend their time deleting and making comments over and over again.",
        scope: "installation",
      },
    ],
  },
  // Config setting for removing comment replies
  {
    type: "boolean",
    name: "remove-replies",
    label: "Allow top-level comments only",
    helpText: "Lock top-level comments in thread and remove replies on any unlocked comments.",
    defaultValue: false,
    scope: "installation",
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
        label: "Require links from domain list",
        helpText:
          "If enabled, comments in thread must contain at least one link from the domain list above to avoid removal.",
        defaultValue: false,
        scope: "installation",
      },
      // Config setting for removing domain-matching comments outside of thread
      {
        type: "boolean",
        name: "remove-outside-comments",
        label: "Remove links outside of thread",
        helpText:
          "If enabled, comments outside of the thread (elsewhere in the subreddit) that contain one of the listed domains will be removed.",
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

// Button for config settings on devvit site
Devvit.addMenuItem({
  label: "Referral Thread Helper",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (event, context) => {
    const subredditName = context.subredditName!;
    context.ui.navigateTo(
      `https://developers.reddit.com/r/${subredditName}/apps/thread-helper`
    );
  },
});

// Diversify comments: comment trigger handler
Devvit.addTrigger({
  event: "CommentCreate",
  onEvent: async (event, context) => {
    // Check if app is enabled
    const appEnabled = await context.settings.get("enable-app");
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    // Check if this post flair or title applies
    const postFlairIsApplicable = await isPostFlairApplicable(event.post?.linkFlair?.text ?? "", context);
    var postTitleIsApplicable = false;
    if (!postFlairIsApplicable)
      postTitleIsApplicable = await isPostTitleApplicable(event.post?.title!, context);
    if (!(postFlairIsApplicable || postTitleIsApplicable)) {
      // If this post does not match any flair or title keywords, check if the comment is allowed outside of the thread.
      await removeCommentOutsideThread(
        event.comment?.id!,
        event.comment?.body!,
        event.author?.name!,
        event.post?.permalink!,
        event.comment?.permalink!,
        context
      );
      return; // Rest of the code only applies to posts with specified flair or title keywords.
    }
    // Get comment author info and check if they are a mod
    const userId = event.author?.id!;
    const username = event.author?.name!;
    const authorIsMod = await userIsMod(username, context);
    const modsExempt = (await context.settings.get("mods-exempt")) as boolean;
    const userIsExempt = authorIsMod && modsExempt;
    var commentRemoved = false;
    var commentRemovedReason = ""; // needed if PM is sent to user
    const postId = event.post?.id!;
    const commentId = event.comment?.id!;
    // If everything looks good, this is where we remove duplicate comments
    const removeDuplicates = await context.settings.get("remove-duplicates") as boolean; //check if removing duplicates enabled
    if (removeDuplicates) {
      commentRemoved = await removeDuplicateComment(userId, postId, commentId, userIsExempt, context);
      if (commentRemoved) commentRemovedReason = "duplicate";
    }
    // If the comment was not removed in the previous step, check if we need to remove replies.
    if (!commentRemoved && !userIsExempt) {
      const removeReplies = await context.settings.get("remove-replies") as boolean; //check if removing replies enabled
      if (removeReplies) {
        commentRemoved = await lockTopLevelCommentOrRemoveReply(commentId, userIsExempt, context);
        if (commentRemoved) commentRemovedReason = "reply";
      }
    }
    // If comment was still not removed, check user requirements
    if (!commentRemoved && !userIsExempt) {
      const userFlair = event.author?.flair;
      const karma = event.author?.karma!;
      commentRemovedReason = await removeCommentAccordingToUserRequirements(commentId, userId, userFlair, karma, context);
      commentRemoved = (commentRemovedReason != "");
    }
    // If comment still not removed, check comment content
    if (!commentRemoved && !userIsExempt) {
      commentRemovedReason = await removeCommentAccordingToContentRequirements(event.comment?.id!, event.comment?.body!, context);
      commentRemoved = (commentRemovedReason != "");
    }
    // If comment was removed and PM setting is enabled, send PM to user
    if (commentRemoved) {
      // Optional: inform user via PM that they have reached the limit.
      const pmUserSetting = (await context.settings.get("pm-user")) as boolean;
      if (pmUserSetting) {
        const subredditName = context.subredditName!;
        const postLink = event.post?.permalink!;
        const commentLink = event.comment?.permalink!;
        var reason = getReasonForRemoval(commentRemovedReason);
        reason += getReasonScope(postFlairIsApplicable, postTitleIsApplicable);
        pmUser(username, subredditName, commentLink, postLink, reason, context);
      }
    }
  },
});

// Update comment count on delete only if the config setting says so
Devvit.addTrigger({
  event: "CommentDelete",
  onEvent: async (event, context) => {
    //console.log(`A new comment was deleted: ${JSON.stringify(event)}`);
    const removeDuplicates = (await context.settings.get("remove-duplicates")) as boolean; //check if duplicate removal enabled
    if (!removeDuplicates) return; // If not enabled, don't do anything.
    const updateDelete = await context.settings.get("update-comment-delete"); //check if update with delete enabled
    if (!updateDelete) return; // If not enabled, don't do anything.
    const source = event.source.valueOf(); // 3 = mod; 2 = admin; 1 = user; 0 = unknown; -1 = unrecognized
    if (source != 1) return; // If a comment was not deleted by its author, don't do anything.

    // If we got here, then "remove duplicates" is enabled and "update with comment deletes" is enabled.
    const userId = event.author?.id!;
    const postId = event.postId!;
    const key = getKeyForComments(postId); //key is comments:<postId>
    const countString = (await context.redis.hGet(key, userId)) ?? ""; // Look up user's comment count in this post
    if (countString != "") {
      // If user has a comment count in this post, update it.
      const commentCount = Number(countString);
      if (commentCount == 1)
        // If this was the last comment, delete the redis hash for this user.
        await context.redis.hDel(key, [userId]);
      else if (commentCount > 1)
        // If there are more comments, just decrement the count by 1.
        await context.redis.hIncrBy(key, userId, -1);
    }
  },
});

// Remove posts outside of thread: post trigger handler
Devvit.addTrigger({
  event: "PostSubmit",
  onEvent: async (event, context) => {
    // Check if app is enabled
    const appEnabled = (await context.settings.get("enable-app")) as boolean;
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    // Check if removing posts is enabled
    const removePosts = await (context.settings.get("remove-posts")) as boolean;
    if (! removePosts) return; // If setting is disabled, don't do anything.
    // Check if author is a mod and mods are exempt
    const modsExempt = (await context.settings.get("mods-exempt")) as boolean;
    const authorIsMod = await userIsMod(event.author?.name!, context);
    if (authorIsMod && modsExempt) return; // If author is a mod and mods are exempt, don't do anything.
    // Check post content for link from domain list
    const domainList = (await context.settings.get("domain-list")) as string;
    var containsDomain = postContainsBannedDomain(
      event.post?.title!,
      event.post?.selftext,
      event.post?.url,
      domainList
    );
    // If a match was found, remove post and optionally comment on it.
    if (containsDomain) {
      const postId = event.post?.id!;
      // Check if setting to comment on removed posts is enabled.
      if (await context.settings.get("comment-on-posts"))
        await commentOnRemovedPost(postId, context); // If setting is enabled, leave a comment.
      // Check if setting to remove as spam is enabled.
      const removeAsSpam = (await context.settings.get("remove-posts-as-spam")) as boolean;
      // Remove post and pass spam setting to removal method.
      await context.reddit.remove(postId, removeAsSpam);
    }
  },
});

export default Devvit;