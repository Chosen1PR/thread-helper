import {
  TriggerContext,
} from "@devvit/public-api";

import {
    getKeyForComments,
    isValidKarmaSetting,
    isValidAccountAgeSetting,
    matchesRegex,
    textHasMatchInList,
    textContainsKeywordFromList
} from "./utils.js"

// Remove comments outside of megathread.
export async function removeCommentOutsideThread(
  commentId: string,
  commentBody: string,
  username: string,
  postLink: string,
  commentLink: string,
  context: TriggerContext
) {
  const removeOutsideComments = await context.settings.get("remove-outside-comments") as boolean;
  if (removeOutsideComments) {
    // If the setting is enabled, check if the comment matches any of the domains.
    const domainList = (await context.settings.get("domain-list")) as string;
    if (domainList != undefined && domainList.trim() != "") {
      // If the domain list is not empty, check if the comment contains any of the domains.
      var containsDomain = false;
      var domains = domainList.trim().split(",");
      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i].trim().toLowerCase();
        if (domain != "" && commentBody.includes(domain)) {
          containsDomain = true;
          break;
        }
      }
      if (containsDomain) {
        // If the comment contains a whitelisted domain, remove it.
        await context.reddit.remove(commentId, false);
        // Optionally PM user about removal
        const pmUserSetting = (await context.settings.get("pm-user")) as boolean;
        if (pmUserSetting) {
          const subredditName = context.subredditName!;
          //const postLink = event.post?.permalink!;
          //const commentLink = event.comment?.permalink!;
          //const username = event.author?.name!;
          await pmUserOutsideThread(username, subredditName, commentLink, postLink, context);
        }
      }
    }
  }
}

// Remove duplicate comments in a single thread.
// Returns true if comment was removed, false otherwise.
export async function removeDuplicateComment(
  userId: string,
  postId: string,
  commentId: string,
  userIsExempt: boolean,
  context: TriggerContext
) {
  var commentRemoved = false;
  // Step 1: Get user's comment count in post.
  const key = getKeyForComments(postId); //key is comments:<postId>, field is userId
  const commentCount = await getAuthorsCommentCountInPost(key, userId, postId, context);
  // Step 2: If user is over limit, remove comment.
  if (commentCount >= 1 && !userIsExempt) {
    // Mod check here will depend on the "mods exempt" config setting.
    await context.reddit.remove(commentId, false);
    commentRemoved = true;
  }
  // Step 3: Increment user's comment count in post.
  await context.redis.hIncrBy(key, userId, 1);
  // Even if this comment was removed in Step 2, any new comments will still increment the comment count for this user.
  // For the count to be decremented, the user must delete their comment and "update with comment deletes" must be enabled.
  return commentRemoved;
}

// Allow top-level comments only by locking top-level comment or removing a comment that is a reply to another comment.
// Returns true if comment was removed, false otherwise.
export async function lockTopLevelCommentOrRemoveReply(
  commentId: string,
  userIsExempt: boolean,
  context: TriggerContext
) {
  const comment = await context.reddit.getCommentById(commentId);
  if (!comment) return false; // If comment wasn't found, do nothing.
  var commentRemoved = false;
  if (comment.parentId.startsWith('t3_')) // Top-level comment, since parent is post.
    await comment.lock();
  else if (!userIsExempt) { // Not a top-level comment. Proceed with removal if user is not exempt.
    await comment.remove(false);
    commentRemoved = true;
  }
  return commentRemoved;
}

// Checks user requirements and removes comments accordingly.
// Returns a reason codeword for comment removal, or an empty string if the comment was not removed.
export async function removeCommentAccordingToUserRequirements(
  commentId: string,
  userId: string,
  userFlair: any,
  totalKarma: number,
  context: TriggerContext
) {
  var commentRemoved = false;
  var commentRemovedReason = "";
  // Check combined post/comment karma requirement.
  const minKarma = (await context.settings.get("min-karma")) as number; //get minimum user karma
  if (isValidKarmaSetting(minKarma)) {
    if (totalKarma < minKarma) {
      await context.reddit.remove(commentId, false);
      commentRemoved = true;
      commentRemovedReason = "karma";
    }
  }
  // Get author's user object.
  const author = await context.reddit.getUserById(userId);
  if (!author) return "";
  const linkKarma = author?.linkKarma!;
  const commentKarma = author?.commentKarma!;
  //const subredditKarma = author?.getUserKarmaForCurrentSubreddit();
  const accountCreated = author?.createdAt!;
  // If comment not removed yet, check post karma requirement.
  if (!commentRemoved) {
    const minPostKarma = (await context.settings.get("min-post-karma")) as number; //get minimum post karma
    if (isValidKarmaSetting(minPostKarma)) {
      if (linkKarma < minPostKarma) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "post-karma";
      }
    }
  }
  // If comment still not removed, check comment karma requirement.
  if (!commentRemoved) {
    const minCommentKarma = (await context.settings.get("min-comment-karma")) as number; //get minimum comment karma
    if (isValidKarmaSetting(minCommentKarma)) {
      if (commentKarma < minCommentKarma) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "comment-karma";
      }
    }
  }
  // If comment still not removed, check account age requirement.
  if (!commentRemoved) {
    const minAccountAgeDays = (await context.settings.get("min-account-age-days")) as number; //get minimum account age
    if (isValidAccountAgeSetting(minAccountAgeDays)) {
      const currentDate = new Date();
      const accountAgeMs = currentDate.getTime() - accountCreated.getTime();
      const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
      if (accountAgeDays < minAccountAgeDays) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "age";
      }
    }
  }
  // If comment still not removed, check user flair requirement.
  if (!commentRemoved) {
    const requireFlair = (await context.settings.get("require-user-flair")) as boolean; //get user flair requirement
    if (requireFlair) {
      if (userFlair) { // User has flair
        const userFlairCssList = (await context.settings.get("user-flair-css-list")) as string;
        if (userFlairCssList != undefined && userFlairCssList.trim() != "") {
          const userFlairCss = userFlair.cssClass ?? "";
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
  // Check user flair requirement
  return commentRemovedReason;
}

// Remove comments according to content requirements.
// Returns a reason codeword for comment removal, or an empty string if the comment was not removed.
export async function removeCommentAccordingToContentRequirements(
  commentId: string,
  commentBody: string,
  context: TriggerContext
) {
  var commentRemoved = false;
  var commentRemovedReason = "";
  // Check if comment contains images
  const removeImages = (await context.settings.get("remove-images")) as boolean;
  if (removeImages) {
    //console.log('Checking comment for images/gifs');
    const imageRegex = /!\[(img|gif)\]\(([-\w\|]+)\)/;
    const containsImage = imageRegex.test(commentBody);
    //if (event.comment?.hasMedia) {
    if (containsImage) {
      //console.log('Comment contains images/gifs, removing comment');
      await context.reddit.remove(commentId, false);
      commentRemoved = true;
      commentRemovedReason = "image";
    }
  }
  // If comment not removed yet, check if comment contains large header text
  if (!commentRemoved) {
    const removeHeaders = (await context.settings.get("remove-headers")) as boolean;
    if (removeHeaders) {
      const headerRegex = /(^|\n)#{1,6}\s*.+/;
      const containsHeader = headerRegex.test(commentBody);
      if (containsHeader) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "header";
      }
    }
  }
  // If comment still not removed, check comment length
  if (!commentRemoved) {
    const maxLength = (await context.settings.get("max-length")) as number;
    if (isValidKarmaSetting(maxLength) && maxLength > 0) { // reuse karma setting validator for non-negative numbers
      if (commentBody.length > maxLength) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "length";
      }
    }
  }
  // If comment still not removed, check if comment contains required domain
  if (!commentRemoved) {
    const requireDomains = (await context.settings.get("require-domains")) as boolean;
    if (requireDomains) {
      const domainList = (await context.settings.get("domain-list")) as string;
      if (domainList != undefined && domainList.trim() != "") {
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
          await context.reddit.remove(commentId, false);
          commentRemoved = true;
          commentRemovedReason = "domain";
        }
      }
    }
  }
  // If comment still not removed, check if comment matches required regex pattern
  if (!commentRemoved) {
    const requiredRegex = (await context.settings.get("required-regex")) as string;
    if (requiredRegex != undefined && requiredRegex.trim() != "") {
      if (!matchesRegex(commentBody, requiredRegex)) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "regex";
      }
    }
  }
  // If comment still not removed, check if comment matches restricted regex pattern
  if (!commentRemoved) {
    const restrictedRegex = (await context.settings.get("restricted-regex")) as string;
    if (restrictedRegex != undefined && restrictedRegex.trim() != "") {
      if (matchesRegex(commentBody, restrictedRegex)) {
        await context.reddit.remove(commentId, false);
        commentRemoved = true;
        commentRemovedReason = "regex";
      }
    }
  }
  return commentRemovedReason;
}

// Helper function to determine if a post's flair corresponds to an applicable thread
export async function isPostFlairApplicable(flairText: string, context: TriggerContext) {
  const flairList = (await context.settings.get("flair-list") as string) ?? "";
  return (flairText != "" && flairList != "" && textHasMatchInList(flairText, flairList));
}

// Helper function to determine if a post's title corresponds to an applicable thread
export async function isPostTitleApplicable(title: string, context: TriggerContext) {
  const titleList = (await context.settings.get("title-list") as string) ?? "";
  return (title != "" && titleList != "" && textContainsKeywordFromList(title, titleList));
}

// Helper function for getting user's comment count
export async function getAuthorsCommentCountInPost(
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
export async function pmUser(
  username: string,
  subredditName: string,
  commentLink: string,
  postLink: string,
  reason: string,
  context: TriggerContext
) {
  if (username == "AutoModerator" || username == (subredditName + "-ModTeam"))
    return; // If user is known bot, do nothing.
  const subjectText = `Your comment in r/${subredditName} was removed`;
  var messageText = `Hi, [your comment](${commentLink}) in [this post](${postLink}) was removed due to the following reason:\n\n`;
  const commentCountDislaimer = `\n\nTo reduce your comment count so it is once again under the limit, you can delete your comment(s).`;
  const inboxDisclaimer = `\n\n*This inbox is not monitored. If you have any questions, please message the moderators of r/${subredditName}.*`;
  var reasonIsDuplicate = reason.startsWith("- Comments on this post are limited to one");
  if (reasonIsDuplicate) {
    reasonIsDuplicate = (await context.settings.get("update-comment-delete")) as boolean;
  } // Only send the comment count disclaimer if the setting to update with comment deletes is enabled.
  if (reasonIsDuplicate) messageText += reason + commentCountDislaimer + inboxDisclaimer;
  // any other reason besides removing duplicate comments
  else messageText += reason + inboxDisclaimer;
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
      if (error == "NOT_WHITELISTED_BY_USER_MESSAGE")
        console.log(`Error: u/${username} might have messaging disabled or might be blocking the u/${context.appName} app account.`);
      else console.log(`Error sending PM to u/${username}: ${error}`);
    }
  } else {
    console.log(`Error: User not found. Cannot send PM.`);
  }
}

// Helper function to PM users who comment disallowed links outside of the designated megathread
export async function pmUserOutsideThread(
  username: string,
  subredditName: string,
  commentLink: string,
  postLink: string,
  context: TriggerContext
) {
  if (username == "AutoModerator" || username == (subredditName + "-ModTeam"))
    return; // If user is known bot, do nothing
  const subjectText = `Your comment in r/${subredditName} was removed`;
  var messageText = `Hi, [your comment](${commentLink}) in [this post](${postLink}) was removed because it was identified as being outside of the designated thread.`;
  const inboxDisclaimer = `\n\n*This inbox is not monitored. If you have any questions, please message the moderators of r/${subredditName}.*`;
  messageText = messageText + inboxDisclaimer;
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

// Helper function to comment on removed posts
export async function commentOnRemovedPost(postId: string, context: TriggerContext) {
  const commentText =
    `Your post was removed because it contains a link from a domain that is restricted to an already existing thread.\n\n` +
    `Please post such links only in the designated thread.`;
  const newComment = await context.reddit.submitComment({id: postId, text: commentText});
  await newComment.distinguish(true); // always distinguish as mod and pin comment
  await newComment.lock(); // always lock comment
}

// Helper function for determining if comment author is a moderator
export async function userIsMod(username: string, context: TriggerContext) {
  // If user not found, return false.
  if (username == undefined || username == null ||  username == "") return false;
  const subredditName = context.subredditName!;
  // Check if known bot.
  if (username == "AutoModerator" || username == (subredditName + "-ModTeam") || username == context.appName)
    return true; // Return true for known bots that are mods.
  const user = await context.reddit.getUserByUsername(username);
  if (!user) return false; // If user not found, return false.
  const modPermissions = await user.getModPermissionsForSubreddit(subredditName);
  if (!modPermissions) return false; // For no permissions object, return false.
  else if (modPermissions.length < 1) return false; // For no permissions in the object, return false.
  else return true; // Otherwise, it's a mod; return true.
}

// Helper function for determining if comment author is a moderator
/*export async function userIsModLegacy(username: string, context: TriggerContext) {
  // If user not found, return false.
  if (username == undefined || username == null ||  username == "") return false; 
  const subredditName = context.subredditName!;
  // Check if known bot.
  if (username == "AutoModerator" || username == (subredditName + "-ModTeam"))
    return true; // Return true for known bots that are mods.
  const modList = context.reddit.getModerators({ subredditName: subredditName }!);
  const mods = await modList.all();
  var isMod = false;
  //for each mod in the list, check if their user id matches the comment author's user id
  for (let i = 0; i < mods.length; i++) {
    if (username == mods[i].username) {
      isMod = true;
      break;
    }
  }
  return isMod;
}*/

