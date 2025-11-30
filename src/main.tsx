// Learn more at developers.reddit.com/docs
import {
  CommentCreate,
  //CommentCreateDefinition,
  CommentDelete,
  Devvit,
  MenuItemOnPressEvent,
  Post,
  //SettingScope,
  TriggerContext,
  //User,
  //useState,
} from "@devvit/public-api";

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
      // Config setting for locking threads when unpinned
      {
        type: "boolean",
        name: "lock-on-unpin",
        label: "Lock threads when unpinned",
        helpText:
          "If enabled, old megathreads will be locked automatically when they are unpinned from the Community Highlights.",
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
          "Limits users to only one comment per thread by removing any duplicate comments.",
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
    label: "Remove comment replies",
    helpText: "Limits threads to top-level comments only by removing replies.",
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
        //defaultValue: 0,
        defaultValue: undefined,
        helpText:
          "Minimum combined post and comment karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum post karma
      {
        type: "number",
        name: "min-post-karma",
        label: "Minimum post karma",
        //defaultValue: 0,
        helpText:
          "Minimum post karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum comment karma
      {
        type: "number",
        name: "min-comment-karma",
        label: "Minimum comment karma",
        //defaultValue: 0,
        helpText:
          "Minimum comment karma a user must have to comment on threads where comment limits are enforced.",
        scope: "installation",
      },
      // Config setting for minimum account age
      {
        type: "number",
        name: "min-account-age-days",
        label: "Minimum account age (days)",
        //defaultValue: 0,
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
          "Removes comments in thread that contain images or reaction gifs. Not necessary if your subreddit does not allow images in comments.",
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
    helpText: "Disable for testing or if your subreddit has many mods, as the latter can affect performance.",
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
    //console.log('Checking if Referral Thread Helper app is enabled');
    const appEnabled = await context.settings.get("enable-app");
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    //console.log('Referral Thread Helper app is enabled and checking new comment');
    // Check if this post flair or title applies
    var forThisPostFlair = false;
    var forThisPostTitle = false;
    const flair = event.post?.linkFlair?.text ?? "";
    const flairListTemp = await context.settings.get("flair-list");
    const flairList = flairListTemp?.toString() ?? "";
    forThisPostFlair =
      flair != "" && flairList != "" && containsFlair(flair, flairList);
    // If not enabled for this post flair, then check post title keywords.
    if (!forThisPostFlair) {
      const title = event.post?.title!;
      const titleListTemp = await context.settings.get("title-list");
      const titleList = titleListTemp?.toString() ?? "";
      forThisPostTitle =
        title != "" && titleList != "" && containsTitle(title, titleList);
    }
    if (!forThisPostFlair && !forThisPostTitle) {
      //return; // Comment later when ready to implement this feature
      // If this post does not match any flair or title keywords, check if the comment is allowed outside of the thread.
      const removeOutsideComments = await context.settings.get("remove-outside-comments")!;
      if (removeOutsideComments) {
        // If the setting is enabled, check if the comment matches any of the domains.
        const domainList = (await context.settings.get("domain-list")) as string;
        if (domainList != undefined && domainList.trim() != "") {
          // If the domain list is not empty, check if the comment contains any of the domains.
          var containsDomain = false;
          var domains = domainList.trim().split(",");
          for (let i = 0; i < domains.length; i++) {
            const domain = domains[i].trim().toLowerCase();
            if (domain != "" && event.comment?.body!.includes(domain)) {
              containsDomain = true;
              break;
            }
          }
          if (containsDomain) {
            // If the comment contains a whitelisted domain, remove it.
            await context.reddit.remove(event.comment?.id!, false);
            // Optionally PM user about removal
            const pmUserSetting = await context.settings.get("pm-user")!;
            if (pmUserSetting) {
              const subredditName = event.subreddit?.name!;
              const postLink = event.post?.permalink!;
              const commentLink = event.comment?.permalink!;
              const userId = event.author?.id!;
              await pmUserOutsideThread(userId, subredditName, commentLink, postLink, context);
            }
          }
        }
      }
      return; // Rest of the code only applies to posts with specified flair or title keywords.
    }
    const removeDuplicates = await context.settings.get("remove-duplicates")!; //check if removing duplicates enabled
    const removeReplies = await context.settings.get("remove-replies")!; //check if removing replies enabled
    // Get comment author info and check if they are a mod
    const userId = event.author?.id!;
    const authorIsMod = await userIsMod(userId, context);
    const modsExempt = await context.settings.get("mods-exempt");
    const passedModCheck = !(authorIsMod && modsExempt);
    // Beginning of temporary variables that will be needed if PM is sent to user
    var commentRemoved = false;
    var commentRemovedReason = "";
    const postId = event.post?.id!;
    const commentId = event.comment?.id!;
    
    // If everything looks good, this is where we remove duplicate comments
    if (removeDuplicates) {
      // Step 1: Get user's comment count in post.
      const key = getKeyForComments(postId); //key is comments:<postId>, field is userId
      const commentCount = await getAuthorsCommentCountInPost(
        key,
        userId,
        postId,
        context
      );
      // Step 2: If user is over limit, remove comment.
      if (commentCount >= 1 && passedModCheck) {
        // Mod check here will depend on the "mods exempt" config setting.
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "duplicate";
      }
      // Step 3: Increment user's comment count in post.
      await context.redis.hIncrBy(key, userId, 1);
      // Even if this comment was removed in Step 2, any new comments will still increment the comment count for this user.
      // For the count to be decremented, the user must delete their comment and "update with comment deletes" must be enabled.
    }
    
    // If the comment was not removed in the previous step, check if we need to remove replies.
    if (removeReplies && !commentRemoved && passedModCheck) {
      //console.log('Checking if comment is a reply');
      var counter = 1;
      var id = event.comment?.parentId!;
      // Keep getting parent IDs until you get to "t3_[whatever]" which indicates the parent post,
      // or until you get to the comment limit of 1 (i.e., only top-level comments allowed).
      while (id.startsWith("t1_") && counter <= 1) {
        //console.log(`Checking parent ID: ${id}`);
        const comment = await context.reddit.getCommentById(id)!;
        id = comment.parentId;
        counter++;
      }
      // If the limit of comment tree growth has been reached, remove comment
      if (counter > 1) {
        // Mod check here will depend on the "mods exempt" config setting.
        context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "reply";
      }
    }
    // If comment was still not removed, check user requirements
    if (!commentRemoved && passedModCheck) {
      const minKarma = (await context.settings.get("min-karma")!) as number; //get minimum user karma
      const minPostKarma = (await context.settings.get("min-subreddit-karma")!) as number; //get minimum post karma
      const minCommentKarma = (await context.settings.get("min-comment-karma")!) as number; //get minimum comment karma
      const minAccountAgeDays = (await context.settings.get("min-account-age-days")!) as number; //get minimum account age
      const requireFlair = await context.settings.get("require-user-flair")!; //get user flair requirement
      const author = await context.reddit.getUserById(userId)!;
      const linkKarma = author?.linkKarma!;
      const commentKarma = author?.commentKarma!;
      const accountCreated = author?.createdAt!;
      // Check combined post/comment karma requirement
      if (isValidKarmaSetting(minKarma)) {
        const totalKarma = linkKarma + commentKarma;
        if (totalKarma < minKarma) {
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "karma";
        }
      }
      // Check post karma requirement
      if (isValidKarmaSetting(minPostKarma) && !commentRemoved) {
        if (linkKarma < minPostKarma) {
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "post-karma";
        }
      }
      // Check comment karma requirement
      if (isValidKarmaSetting(minCommentKarma) && !commentRemoved) {
        if (commentKarma < minCommentKarma) {
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "comment-karma";
        }
      }
      // Check account age requirement
      if (isValidAccountAgeSetting(minAccountAgeDays) && !commentRemoved) {
        const currentDate = new Date();
        const accountAgeMs = currentDate.getTime() - accountCreated.getTime();
        const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
        if (accountAgeDays < minAccountAgeDays) {
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "age";
        }
      }
      // Check user flair requirement
      if (requireFlair && !commentRemoved) {
        const userFlair = event.author?.flair;
        if (userFlair) { // User has flair
          const userFlairCss = userFlair.cssClass ?? "";
          const userFlairCssList = (await context.settings.get("user-flair-css-list")) as string;
          if (userFlairCssList != undefined && userFlairCssList.trim() != "") {
            var flairMatch = false;
            var flairClasses = userFlairCssList.trim().split(",");
            for (let i = 0; i < flairClasses.length; i++) {
              const flairCssFromList = flairClasses[i].trim();
              if (flairCssFromList != "" && userFlairCss == flairCssFromList) {
                flairMatch = true;
                break;
              }
            }
            if (!flairMatch) {
              await context.reddit.remove(commentId, false);
              commentRemoved = true;
              commentRemovedReason = "flair-specific";
            }
          }
        }
        else { // User does not have flair
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "flair";
        }
      }
    }
    // If comment still not removed, check comment content
    if (!commentRemoved && passedModCheck) {
      const commentBody = event.comment?.body!.toString() ?? "";
      // Check if comment contains images
      const removeImages = await context.settings.get("remove-images")!;
      //console.log(`Remove images setting is ${removeImages}`);
      if (removeImages) {
        //console.log('Checking comment for images/gifs');
        const imageRegex = /!\[(img|gif)\]\(([-\w\|]+)\)/;
        const containsImage = imageRegex.test(commentBody);
        //if (event.comment?.hasMedia) {
        if (containsImage) {
          //console.log('Comment contains images/gifs, removing comment');
          await context.reddit.remove(event.comment?.id!, false);
          commentRemoved = true;
          commentRemovedReason = "image";
        }
      }
      // If comment still not removed, check if comment contains required domain
      const requireDomains = await context.settings.get("require-domains")!;
      if (requireDomains) {
        const domainList = (await context.settings.get("domain-list")) as string;
        if (domainList != undefined && domainList.trim() != "" && !commentRemoved) {
          var containsDomain = false;
          var domains = domainList.trim().split(",");
          for (let i = 0; i < domains.length; i++) {
            const domain = domains[i].trim().toLowerCase();
            if (domain != "" && commentBody.includes(domain)) {
              containsDomain = true;
              break;
            }
          }
          if (!containsDomain) {
            await context.reddit.remove(event.comment?.id!, false);
            commentRemoved = true;
            commentRemovedReason = "domain";
          }
        }
      }
      // If comment still not removed, check if comment matches required regex pattern
      const requiredRegex = (await context.settings.get(
        "required-regex"
      )) as string;
      if (
        requiredRegex != undefined &&
        requiredRegex.trim() != "" &&
        !commentRemoved
      ) {
        const commentBody = event.comment?.body!.toString() ?? "";
        if (!matchesRegex(commentBody, requiredRegex)) {
          await context.reddit.remove(event.comment?.id!, false);
          commentRemoved = true;
          commentRemovedReason = "regex";
        }
      }
      // If comment still not removed, check if comment matches restricted regex pattern
      const restrictedRegex = (await context.settings.get(
        "restricted-regex"
      )) as string;
      if (
        restrictedRegex != undefined &&
        restrictedRegex.trim() != "" &&
        !commentRemoved
      ) {
        const commentBody = event.comment?.body!.toString() ?? "";
        if (matchesRegex(commentBody, restrictedRegex)) {
          await context.reddit.remove(event.comment?.id!, false);
          commentRemoved = true;
          commentRemovedReason = "regex";
        }
      }
    }
    // If comment was removed and PM setting is enabled, send PM to user
    if (commentRemoved) {
      // Optional: inform user via PM that they have reached the limit.
      const pmUserSetting = await context.settings.get("pm-user")!;
      if (pmUserSetting) {
        //console.log('Preparing to PM user about comment removal');
        const subredditName = event.subreddit?.name!;
        //const postTitle = event.post?.title!;
        const postLink = event.post?.permalink!;
        const commentLink = event.comment?.permalink!;
        var reason = getReasonForRemoval(commentRemovedReason);
        reason += getReasonScope(forThisPostFlair, forThisPostTitle);
        pmUser(userId, subredditName, commentLink, postLink, reason, context);
      }
      return;
    }
  },
});

// Update comment count on delete only if the config setting says so
Devvit.addTrigger({
  event: "CommentDelete",
  onEvent: async (event, context) => {
    //console.log(`A new comment was deleted: ${JSON.stringify(event)}`);
    const removeDuplicates = await context.settings.get("remove-duplicates")!; //check if diversification enabled
    if (!removeDuplicates) return; // If not enabled, don't do anything.
    const updateDelete = await context.settings.get("update-comment-delete"); //check if update with delete enabled
    if (!updateDelete) return; // If not enabled, don't do anything.
    const eventSource = event.source;
    const source = eventSource.valueOf(); // 3 = mod; 2 = admin; 1 = user; 0 = unknown; -1 = unrecognized
    if (source != 1) return; // If a comment was not deleted by its author, don't do anything.

    // If we got here, then comment diversification is enabled and "update with comment delete" is enabled.
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
  event: "PostCreate",
  onEvent: async (event, context) => {
    // Check if app is enabled
    const appEnabled = await context.settings.get("enable-app");
    if (!appEnabled) return; // If app is not enabled, don't do anything.
    // Check if removing posts is enabled
    const removePosts = await (context.settings.get("remove-posts")!) as boolean;
    if (! removePosts) return; // If setting is disabled, don't do anything.
    // Check if author is a mod and mods are exempt
    const modsExempt = await context.settings.get("mods-exempt");
    const authorIsMod = await userIsMod(event.author?.id!, context);
    if (authorIsMod && modsExempt) return; // If author is a mod and mods are exempt, don't do anything.
    
    // Check post content for link from domain list
    const domainList = (await context.settings.get("domain-list")) as string;
    var containsDomain = false;
    if (domainList != undefined && domainList.trim() != "") {
      const postTitle = event.post?.title!;
      const postBody = event.post?.selftext!;
      const postLink = event.post?.url!;
      var domains = domainList.trim().split(",");
      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i].trim().toLowerCase();
        if (postTitle.includes(domain) || postBody.includes(domain) || postLink.includes(domain)) {
          containsDomain = true;
          break;
        }
      }
    }
    // If a match was found, remove post and optionally comment on it.
    if (containsDomain) {
      const postId = event.post?.id!;
      // Check if setting to comment on removed posts is enabled.
      const commentOnPosts = await (context.settings.get("comment-on-posts")!) as boolean;
      if (commentOnPosts) // If setting is enabled, proceed with comment.
        await commentOnRemovedPost(postId, context);
      // Check if setting to remove as spam is enabled.
      const removeAsSpam = (await context.settings.get("remove-posts-as-spam")!) as boolean;
      // Remove post and pass spam setting to removal method.
      await context.reddit.remove(postId, removeAsSpam);
    }
  },
});

// Trigger handler for when a mod action is performed on a post, specifically for when a post is unstickied.
Devvit.addTrigger({
  event: 'ModAction',
  onEvent: async (event, context) => {
    // Check if the mod action is a post unsticky and not a comment unsticky.
    if (event.action === 'unsticky') {
      // Check if the app and corresponsing setting are enabled.
      const appEnabled = await context.settings.get("enable-app");
      const lockEnabled = await context.settings.get("lock-on-unpin");
      if (!(appEnabled && lockEnabled))
        return; // If the app or setting is not enabled, do nothing.
      const commentId = event.targetComment?.id ?? '';
      if (commentId !== '')
        return; // If the event is a comment, do nothing.
      const postId = event.targetPost?.id!;
      const thisPost = await context.reddit.getPostById(postId);
      if (thisPost.locked) // If the post is already locked, do nothing.
        return;
      const flair = thisPost.flair?.text ?? '';
      const title = thisPost.title!;
      if (flair != '') { // If the post has a flair, check if it matches the post flair list.
        const flairListTemp = (await context.settings.get("flair-list") ?? '') as string;
        const flairList = flairListTemp.trim();
        if (flairList != '' && containsFlair(flair, flairList))
          thisPost.lock(); // If the post has a flair that matches the archive flair list, lock it.
      }
      if (!thisPost.locked) { // If the post has not already been locked, check if the title matches the post title list.
        const titleListTemp = (await context.settings.get("title-list") ?? '') as string;
        const titleList = titleListTemp.trim();
        if (titleList != '' && containsTitle(title, titleList))
          thisPost.lock(); // If the post title matches the title list, lock it.
      }
      //console.log('Is it locked?: ' + thisPost.isLocked().toString())
    }
  }
});

// Helper function to get key for redis hash that handles comments on posts
function getKeyForComments(postId: string) {
  return `comments:${postId}`;
}

// Alternative helper function for redis key-value pair that handles comments on posts
function getKeyForComments2(postId: string, userId: string) {
  return `${postId}:${userId}`;
}

// Helper function for redis key-value pair that handles manual post diversification
function getKeyForDiversifyPosts(postId: string) {
  return `diversify:${postId}`;
}

// Helper function for redis key-value pair that handles manual post pruning
function getKeyForPrunePosts(postId: string) {
  return `prune:${postId}`;
}

// Helper function that tells you if the current comment limit in the config settings is even valid
function commentLimitIsValid(
  commentLimit: string | number | boolean | string[] | undefined
) {
  return (
    commentLimit != undefined &&
    !Number.isNaN(commentLimit) &&
    Number(commentLimit) >= 1
  );
}

// Helper function for getting user's comment count
async function getAuthorsCommentCountInPost(
  key: string,
  userId: string,
  postId: string,
  context: TriggerContext
) {
  var countString = (await context.redis.hGet(key, userId)) ?? "";
  if (countString == "") {
    // User hasn't commented here before. Adding redis hash with comment count of 0.
    countString = "0";
    await context.redis.hSet(key, { userId: countString });
  }
  const commentCount = Number(countString);
  return commentCount;
}

// Helper function to PM a user when their comment is removed
async function pmUser(
  userId: string,
  subredditName: string,
  commentLink: string,
  postLink: string,
  reason: string,
  context: TriggerContext
) {
  const subjectText = `Your comment in r/${subredditName} was removed`;
  var messageText = `Hi, [your comment](${commentLink}) in [this post](${postLink}) was removed due to the following reason:\n\n`;
  const commentCountDislaimer = `\n\nTo reduce your comment count so it is once again under the limit, you can delete your comment(s).`;
  const inboxDisclaimer = `\n\n*This inbox is not monitored. If you have any questions, please message the moderators of r/${subredditName}.*`;
  if (reason.startsWith("- Comments on this post are limited to one"))
    // only when removing duplicate comments
    messageText =
      messageText + reason + commentCountDislaimer + inboxDisclaimer;
  // any other reason besides removing duplicate comments
  else messageText = messageText + reason + inboxDisclaimer;
  const thisUser = await context.reddit.getUserById(userId);
  const username = thisUser?.username;
  if (username) {
    // If you want to send a PM as the subreddit, uncomment the line below and comment out the next line
    //await context.reddit.sendPrivateMessageAsSubreddit({
    //console.log(`PMing user u/${username} about comment removal`);
    try {
      await context.reddit.sendPrivateMessage({
        subject: subjectText,
        text: messageText,
        to: username,
        //fromSubredditName: subredditName,
      });
    } catch (error) {
      console.log(`Error sending PM to u/${username}: ${error}`);
    }
  } else {
    console.log(`Error: User not found. Cannot send PM.`);
  }
}

async function pmUserOutsideThread(
  userId: string,
  subredditName: string,
  commentLink: string,
  postLink: string,
  context: TriggerContext
) {
  const subjectText = `Your comment in r/${subredditName} was removed`;
  var messageText = `Hi, [your comment](${commentLink}) in [this post](${postLink}) was removed because it was identified as being outside of the designated thread.`;
  const inboxDisclaimer = `\n\n*This inbox is not monitored. If you have any questions, please message the moderators of r/${subredditName}.*`;
  messageText = messageText + inboxDisclaimer;
  const thisUser = await context.reddit.getUserById(userId);
  const username = thisUser?.username;
  if (username) {
    // If you want to send a PM as the subreddit, uncomment the line below and comment out the next line
    //await context.reddit.sendPrivateMessageAsSubreddit({
    //console.log(`PMing user u/${username} about comment removal`);
    try {
      await context.reddit.sendPrivateMessage({
        subject: subjectText,
        text: messageText,
        to: username,
        //fromSubredditName: subredditName,
      });
    } catch (error) {
      console.log(`Error sending PM to u/${username}: ${error}`);
    }
  } else {
    console.log(`Error: User not found. Cannot send PM.`);
  }
}

// Helper function for verifying if post flair is included in the list of flairs in the config settings
function containsFlair(flair: string, flairList: string) {
  flair = flair.trim(); //trim unneeded white space
  var flairs = flairList.split(","); //separate flairs in list
  for (let i = 0; i < flairs.length; i++) {
    flairs[i] = flairs[i].trim(); //for each flair in the list, trim white space as well
    if (flairs[i] == flair)
      //check if flairs match
      return true;
  }
  //reached end of list, no match
  return false;
}

// Helper function for verifying if post title has a match in the list of title keywords in the config settings
function containsTitle(title: string, titleList: string) {
  title = title.trim(); //trim unneeded white space
  var titleKeywords = titleList.split(","); //separate title keywords in list
  for (let i = 0; i < titleKeywords.length; i++) {
    titleKeywords[i] = titleKeywords[i].trim(); //for each keyword in the list, trim white space as well
    if (title.includes(titleKeywords[i]))
      //check if title includes keyword
      return true;
  }
  //reached end of list, no match
  return false;
}

// Helper function for determining if comment author is a moderator
async function userIsMod(userId: string, context: TriggerContext) {
  const modList = context.reddit.getModerators({ subredditName: context.subredditName! }!);
  const mods = await modList.all();
  var isMod = false;
  //for each mod in the list, check if their user id matches the comment author's user id
  for (let i = 0; i < mods.length; i++) {
    if (userId == mods[i].id) {
      isMod = true;
      break;
    }
  }
  return isMod;
}

// Helper function to get reason for why a comment was removed
function getReasonForRemoval(reasonWord: string) {
  var reason = "";
  if (reasonWord == "duplicate") {
    reason += "- Comments on this post are limited to one per user.";
  } else if (reasonWord == "reply") {
    reason += "- Comment replies are disabled on this post.";
  } else if (reasonWord == "image") {
    reason +=
      "- Comments containing images or reaction gifs are not allowed on this post.";
  } else if (reasonWord == "karma") {
    reason +=
      "- You do not meet the minimum total karma requirement to comment on this post.";
  } else if (reasonWord == "post-karma") {
    reason +=
      "- You do not meet the minimum post karma requirement to comment on this post.";
  } else if (reasonWord == "comment-karma") {
    reason +=
      "- You do not meet the minimum comment karma requirement to comment on this post.";
  } else if (reasonWord == "age") {
    reason +=
      "- You do not meet the minimum account age requirement to comment on this post.";
  } else if (reasonWord == "flair") {
    reason +=
      "- You must have user flair to comment on this post.";
  } else if (reasonWord == "flair-specific") {
    reason +=
      "- You do not have the required user flair to comment on this post.";
  } else if (reasonWord == "domain") {
    reason +=
      "- Your comment does not contain any of the required link domains.";
  } else if (reasonWord == "regex") {
    reason += "- Your comment does not match the required format.";
  }
  return reason;
}

// Helper function to get the full text for which post(s) the comment removal reason applies
function getReasonScope(forThisPostFlair: boolean, forThisPostTitle: boolean) {
  var scope = "";
  if (forThisPostFlair)
    scope +=
      " Currently, this limit or requirement applies across all posts with this post's flair.";
  else if (forThisPostTitle)
    scope +=
      " Currently, this limit or requirement applies across all posts with a similar post title.";
  return scope;
}

// Helper function to validate karma setting
function isValidKarmaSetting(
  karmaSetting: string | number | boolean | string[] | undefined
) {
  return (
    karmaSetting != undefined &&
    !Number.isNaN(karmaSetting) &&
    Number(karmaSetting) != 0
  );
}

// Helper function to validate account age setting
function isValidAccountAgeSetting(
  accountAgeSetting: string | number | boolean | string[] | undefined
) {
  return (
    accountAgeSetting != undefined &&
    !Number.isNaN(accountAgeSetting) &&
    Number(accountAgeSetting) > 0
  );
}

// Helper function to check if a string matches a regex pattern
function matchesRegex(input: string, regex: string) {
  try {
    const pattern = new RegExp(regex);
    return pattern.test(input);
  } catch (error) {
    console.error(`Invalid regex: ${regex}`, error);
    return false;
  }
}

async function commentOnRemovedPost(postId: string, context: TriggerContext) {
  const commentText =
    `Your post was removed because it contains a link from a domain that is restricted to an already existing thread.\n\n` +
    `Please post such links only in the designated thread.`;
  const newComment = await context.reddit.submitComment({id: postId, text: commentText});
  await newComment.distinguish(true); // always distinguish as mod and pin comment
  await newComment.lock(); // always lock comment
}

export default Devvit;