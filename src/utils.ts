// Helper function to get key for redis hash that handles comments on posts
export function getKeyForComments(postId: string) {
  return `comments:${postId}`;
}

// Alternative helper function for redis key-value pair that handles comments on posts
export function getKeyForComments2(postId: string, userId: string) {
  return `${postId}:${userId}`;
}

// Helper function for redis key-value pair that handles manual post diversification
export function getKeyForDiversifyPosts(postId: string) {
  return `diversify:${postId}`;
}

// Helper function for redis key-value pair that handles manual post pruning
export function getKeyForPrunePosts(postId: string) {
  return `prune:${postId}`;
}

// Helper function that tells you if the current comment limit in the config settings is even valid
export function commentLimitIsValid(
  commentLimit: string | number | boolean | string[] | undefined
) {
  return (
    commentLimit != undefined &&
    !Number.isNaN(commentLimit) &&
    Number(commentLimit) >= 1
  );
}

// Helper function to see if the post has a link from a banned domain anywhere in it.
export function postContainsBannedDomain(postTitle: string, postBody: string | undefined, url: string | undefined, domainList: string) {
  if (domainList == undefined || domainList.trim() == "") return false;
  if (!postBody) postBody = "";
  if (!url) url = "";
  const domains = domainList.trim().split(',');
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i].trim();
    if (postTitle.includes(domain) || postBody.includes(domain) || url.includes(domain))
      return true; // match found
  }
  // reached end of list, no match
  return false;
}

// Helper function for text match from a given list
export function textHasMatchInList(text: string, textList: string) {
  text = text.trim(); //trim unneeded white space
  var textsFromList = textList.split(","); //separate items in list
  for (let i = 0; i < textsFromList.length; i++) {
    const textFromList = textsFromList[i].trim(); //for each item in the list, trim white space as well
    if (text == textFromList) return true; // match found
  }
  //reached end of list, no match
  return false;
}

// Helper function to get reason for why a comment was removed
export function getReasonForRemoval(reasonWord: string, subredditName: string) {
  var reason = "";
  switch (reasonWord) {
    case "duplicate": reason += "- Comments on this post are limited to one per user."; break;
    case "reply": reason += "- Comment replies are disabled on this post."; break;
    case "image": reason += "- Comments containing images or reaction gifs are not allowed on this post."; break;
    case "header": reason += "- Comments containing large header text are not allowed on this post."; break;
    case "length": reason += "- Your comment is too long."; break;
    case "karma": reason += "- You do not meet the minimum total karma requirement to comment on this post."; break;
    case "post-karma": reason += "- You do not meet the minimum post karma requirement to comment on this post."; break;
    case "comment-karma": reason += "- You do not meet the minimum comment karma requirement to comment on this post."; break;
    case "subreddit-karma": reason += `- Your karma in r/${subredditName} is less than the minimum community karma required to comment on this post.`; break;
    case "account-age": reason += "- You do not meet the minimum account age requirement to comment on this post."; break;
    case "flair-required": reason += "- You must have user flair to comment on this post."; break;
    case "flair-specific": reason += "- You do not have the required user flair to comment on this post."; break;
    case "domain-required": reason += "- Your comment does not contain any of the required link domains."; break;
    case "regex": reason += "- Your comment does not match the required format."; break;
  }
  if (reason != "") return reason;
  else return reasonWord;
}

// Helper function to get the full text for which post(s) the comment removal reason applies
export function getReasonScope(flairText: string) {
  return ` This limit or requirement applies across all posts with the "${flairText}" flair.`;
}

// Helper function to validate karma setting
export function isValidKarmaSetting(
  karmaSetting: string | number | boolean | string[] | undefined
) {
  return (
    karmaSetting != undefined &&
    !Number.isNaN(karmaSetting) &&
    Number(karmaSetting) != 0
  );
}

// Helper function to validate account age setting
export function isValidAccountAgeSetting(
  accountAgeSetting: string | number | boolean | string[] | undefined
) {
  return (
    accountAgeSetting != undefined &&
    !Number.isNaN(accountAgeSetting) &&
    Number(accountAgeSetting) > 0
  );
}

// Helper function to check if a string matches a regex pattern
export function matchesRegex(input: string, regex: string) {
  try {
    const pattern = new RegExp(regex);
    return pattern.test(input);
  } catch (error) {
    console.error(`Invalid regex: ${regex}`, error);
    return false;
  }
}