/**
 * Database migration: create all tables for X Clone using raw SQL via Neon serverless.
 * This matches the Prisma schema exactly (PostgreSQL dialect).
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("[migrate] Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "displayName" TEXT,
      "bio" TEXT,
      "avatar" TEXT,
      "banner" TEXT,
      "location" TEXT,
      "website" TEXT,
      "birthDate" TIMESTAMP,
      "verified" BOOLEAN NOT NULL DEFAULT false,
      "verifiedAt" TIMESTAMP,
      "verificationStatus" TEXT NOT NULL DEFAULT 'none',
      "isPrivate" BOOLEAN NOT NULL DEFAULT false,
      "role" TEXT NOT NULL DEFAULT 'user',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "userAgent" TEXT,
      "ipAddress" TEXT,
      "device" TEXT,
      "browser" TEXT,
      "os" TEXT,
      "location" TEXT,
      "lastActive" TIMESTAMP NOT NULL DEFAULT NOW(),
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "UserSettings" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "darkMode" BOOLEAN NOT NULL DEFAULT false,
      "theme" TEXT NOT NULL DEFAULT 'system',
      "fontSize" TEXT NOT NULL DEFAULT 'medium',
      "displayLanguage" TEXT NOT NULL DEFAULT 'en',
      "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
      "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
      "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
      "notifyLikes" BOOLEAN NOT NULL DEFAULT true,
      "notifyRetweets" BOOLEAN NOT NULL DEFAULT true,
      "notifyFollows" BOOLEAN NOT NULL DEFAULT true,
      "notifyMentions" BOOLEAN NOT NULL DEFAULT true,
      "notifyReplies" BOOLEAN NOT NULL DEFAULT true,
      "notifyDMs" BOOLEAN NOT NULL DEFAULT true,
      "dmFromAnyone" BOOLEAN NOT NULL DEFAULT true,
      "showReadReceipts" BOOLEAN NOT NULL DEFAULT true,
      "allowTagging" BOOLEAN NOT NULL DEFAULT true,
      "whoCanReply" TEXT NOT NULL DEFAULT 'everyone',
      "locationEnabled" BOOLEAN NOT NULL DEFAULT false,
      "phone" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_userId_key" ON "UserSettings"("userId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Verification" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "verifiedAt" TIMESTAMP,
      "expiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "businessName" TEXT,
      "businessWebsite" TEXT,
      "businessCategory" TEXT,
      "documentsUrl" TEXT,
      "officialEmail" TEXT,
      "agencyName" TEXT,
      "notes" TEXT,
      "rejectionReason" TEXT,
      CONSTRAINT "Verification_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Verification_userId_key" ON "Verification"("userId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Tweet" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "content" TEXT,
      "authorId" TEXT NOT NULL,
      "inReplyToId" TEXT,
      "quotedTweetId" TEXT,
      "isThread" BOOLEAN NOT NULL DEFAULT false,
      "threadOrder" INT,
      "retweetOfId" TEXT,
      "communityId" TEXT,
      "hasMedia" BOOLEAN NOT NULL DEFAULT false,
      "sensitiveContent" BOOLEAN NOT NULL DEFAULT false,
      "views" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Tweet_inReplyToId_fkey" FOREIGN KEY ("inReplyToId") REFERENCES "Tweet"("id") ON DELETE SET NULL,
      CONSTRAINT "Tweet_quotedTweetId_fkey" FOREIGN KEY ("quotedTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL,
      CONSTRAINT "Tweet_retweetOfId_fkey" FOREIGN KEY ("retweetOfId") REFERENCES "Tweet"("id") ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "TweetMedia" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "tweetId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "thumbnailUrl" TEXT,
      "width" INT,
      "height" INT,
      "altText" TEXT,
      "order" INT NOT NULL DEFAULT 0,
      CONSTRAINT "TweetMedia_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "TweetMedia_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Hashtag" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL,
      "tweetCount" INT NOT NULL DEFAULT 0,
      "trendingAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Hashtag_name_key" ON "Hashtag"("name")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "TweetHashtag" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "tweetId" TEXT NOT NULL,
      "hashtagId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "TweetHashtag_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "TweetHashtag_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE CASCADE,
      CONSTRAINT "TweetHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "TweetHashtag_tweetId_hashtagId_key" ON "TweetHashtag"("tweetId","hashtagId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Like" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "tweetId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Like_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Like_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Like_userId_tweetId_key" ON "Like"("userId","tweetId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Retweet" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "tweetId" TEXT NOT NULL,
      "quoteText" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Retweet_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Retweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Retweet_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Retweet_userId_tweetId_key" ON "Retweet"("userId","tweetId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Bookmark" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "tweetId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Bookmark_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_userId_tweetId_key" ON "Bookmark"("userId","tweetId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Follow" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "followerId" TEXT NOT NULL,
      "followingId" TEXT NOT NULL,
      "approved" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Follow_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON "Follow"("followerId","followingId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Block" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "blockerId" TEXT NOT NULL,
      "blockedId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Block_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Block_blockerId_blockedId_key" ON "Block"("blockerId","blockedId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Mute" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "muterId" TEXT NOT NULL,
      "mutedId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Mute_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Mute_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Mute_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Mute_muterId_mutedId_key" ON "Mute"("muterId","mutedId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "type" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "tweetId" TEXT,
      "read" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Notification_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "participant1Id" TEXT NOT NULL,
      "participant2Id" TEXT NOT NULL,
      "lastMessageAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Conversation_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Conversation_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_p1_p2_key" ON "Conversation"("participant1Id","participant2Id")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "DirectMessage" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "senderId" TEXT NOT NULL,
      "recipientId" TEXT NOT NULL,
      "content" TEXT,
      "conversationId" TEXT NOT NULL,
      "hasMedia" BOOLEAN NOT NULL DEFAULT false,
      "mediaUrl" TEXT,
      "readAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedForSender" BOOLEAN NOT NULL DEFAULT false,
      "deletedForRecipient" BOOLEAN NOT NULL DEFAULT false,
      CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "List" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "ownerId" TEXT NOT NULL,
      "isPrivate" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "List_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "List_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "ListMember" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "listId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "addedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "ListMember_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE,
      CONSTRAINT "ListMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "ListMember_listId_userId_key" ON "ListMember"("listId","userId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "Community" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "banner" TEXT,
      "icon" TEXT,
      "rules" TEXT,
      "ownerId" TEXT NOT NULL,
      "isPrivate" BOOLEAN NOT NULL DEFAULT false,
      "memberCount" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Community_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Community_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "Community_name_key" ON "Community"("name")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "CommunityMember" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "communityId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE,
      CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "CommunityMember_communityId_userId_key" ON "CommunityMember"("communityId","userId")`;

  await sql`
    CREATE TABLE IF NOT EXISTS "TrendingTopic" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "hashtagId" TEXT NOT NULL,
      "location" TEXT,
      "tweetVolume" INT NOT NULL DEFAULT 0,
      "rank" INT,
      "promotedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "TrendingTopic_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "TrendingTopic_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Report" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "type" TEXT NOT NULL,
      "reportedId" TEXT NOT NULL,
      "reporterId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "description" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "reviewedBy" TEXT,
      "reviewedAt" TIMESTAMP,
      "action" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "action" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "details" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Suspension" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
      "endDate" TIMESTAMP NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "suspendedBy" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Suspension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "Suspension_suspendedBy_fkey" FOREIGN KEY ("suspendedBy") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `;

  // Add communityId FK to Tweet after Community table exists
  try {
    await sql`ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL`;
  } catch {
    // Constraint already exists
  }

  console.log("[migrate] All tables created successfully.");
}

run().catch((e) => { console.error("[migrate] Error:", e.message); process.exit(1); });
