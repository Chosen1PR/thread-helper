import {
  TriggerContext,
} from "@devvit/public-api";

// Helper function to get key for redis hash that handles comments on a specific post by a specific user
function getKeyForCommentCount(postId: string, userId?: string) {
  return `postCommentCount:${postId}`;
}

// Helper function to get key for redis hash that handles a comment's "seen" state
function getKeyForCommentSeenState(commentId: string) {
  return `comment:${commentId}`;
}

// Helper function for getting user's comment count in a post.
// Returns 0 if there are no comments but there *is* a Redis object.
// Returns -1 if there is not Redis object.
export async function getAuthorsCommentCount(
  userId: string,
  postId: string,
  context: TriggerContext
) {
  try {
    const key = getKeyForCommentCount(postId, userId);
    var countString = (await context.redis.hGet(key, userId)) ?? "";
    if (countString == "") return -1;
    const commentCount = Number(countString);
    return commentCount;
  }
  catch { return 0; }
}

export async function resetAuthorsCommentCount(
  userId: string,
  postId: string,
  context: TriggerContext
) {
  try {
    const key = getKeyForCommentCount(postId, userId);
    await context.redis.hSet(key, { [userId]: "0" });
  }
  catch {} // do nothing
}

// Helper function for deleting a user's comment count in a post.
// Useful if the comment count has reached 0.
export async function deleteAuthorsCommentCount(
  userId: string,
  postId: string,
  context: TriggerContext
) {
  try {
    const key = getKeyForCommentCount(postId, userId);
    await context.redis.hDel(key, [userId]);
  }
  catch {} // do nothing
}

// Helper function for updating a user's comment count in a post.
export async function updateAuthorsCommentCount(
  userId: string,
  postId: string,
  increment: number,
  context: TriggerContext
) {
  try {
    const key = getKeyForCommentCount(postId, userId);
    await context.redis.hIncrBy(key, userId, increment);
  }
  catch {} // do nothing
}

// Helper function to get a comment creation event's "seen" state.
// 'new' means a comment has never been seen before.
// 'seen' means this app has already processed this comment before.
// 'error' indicates a likely redis failure.
export async function getSeenStateForCommentCreate(commentId: string, context: TriggerContext): Promise<'new' | 'seen' | 'error'> {
  try {
    const key = getKeyForCommentSeenState(commentId);
    const result = await context.redis.hSetNX(key, 'creationSeen', '1');
    if (result == 1) return 'new'; // new comment, successfully marked as seen
    else return 'seen'; // old comment, already seen
  }
  catch {
    return 'error'; // redis failure
  }
}

// Helper function to get a comment deletion event's "seen" state.
// 'new' means a comment has never been seen before.
// 'seen' means this app has already processed this comment before.
// 'error' indicates a likely redis failure.
export async function getSeenStateForCommentDelete(commentId: string, context: TriggerContext): Promise<'new' | 'seen' | 'error'> {
  try {
    const key = getKeyForCommentSeenState(commentId);
    const result = await context.redis.hSetNX(key, 'deletionSeen', '1');
    if (result == 1) return 'new'; // new comment deletion event, successfully marked as seen
    else return 'seen'; // old comment deletion event, already seen
  }
  catch {
    return 'error'; // redis failure
  }
}