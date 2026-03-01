/**
 * Database setup script for X Clone
 * Run with: node scripts/setup-db.mjs
 *
 * This script:
 *  1. Pushes the Prisma schema to the Neon PostgreSQL database
 *  2. Seeds demo users, tweets, follows, trending hashtags
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

async function main() {
  console.log("[setup-db] Pushing Prisma schema to database...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("[setup-db] Schema pushed successfully.");
  } catch (err) {
    console.error("[setup-db] Schema push failed:", err.message);
    process.exit(1);
  }

  // --- Seed users ---
  console.log("[setup-db] Seeding users...");

  const usersData = [
    {
      username: "elonmusk",
      email: "elon@x.com",
      displayName: "Elon Musk",
      bio: "The people have spoken. — X is the everything app.",
      password: "Password1",
      verified: true,
      avatar: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg",
    },
    {
      username: "jack",
      email: "jack@x.com",
      displayName: "jack",
      bio: "#bitcoin",
      password: "Password1",
      verified: true,
      avatar: "https://pbs.twimg.com/profile_images/1115644092329758721/AFjOr-K8_400x400.jpg",
    },
    {
      username: "sama",
      email: "sama@openai.com",
      displayName: "Sam Altman",
      bio: "CEO of OpenAI. building safe AGI that benefits all of humanity.",
      password: "Password1",
      verified: true,
      avatar: "https://pbs.twimg.com/profile_images/804990434455887872/BG0Xh3Oa_400x400.jpg",
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 10);
    const existing = await db.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`[setup-db]   User @${u.username} already exists, skipping.`);
      createdUsers.push(existing);
      continue;
    }
    const user = await db.user.create({
      data: {
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        bio: u.bio,
        password: hashed,
        verified: u.verified,
        avatar: u.avatar,
      },
    });
    createdUsers.push(user);
    console.log(`[setup-db]   Created user @${user.username}`);
  }

  // --- Seed hashtags & trending topics ---
  console.log("[setup-db] Seeding trending hashtags...");
  const hashtagNames = ["Bitcoin", "OpenAI", "Grok", "SpaceX", "Tesla", "X", "AGI", "AI"];
  const createdHashtags = [];
  for (const name of hashtagNames) {
    const ht = await db.hashtag.upsert({
      where: { name: name.toLowerCase() },
      update: { tweetCount: { increment: 1 } },
      create: { name: name.toLowerCase(), tweetCount: Math.floor(Math.random() * 50000) + 1000 },
    });
    createdHashtags.push(ht);
  }

  // Trending topics
  for (let i = 0; i < Math.min(5, createdHashtags.length); i++) {
    const ht = createdHashtags[i];
    const existing = await db.trendingTopic.findFirst({ where: { hashtagId: ht.id } });
    if (!existing) {
      await db.trendingTopic.create({
        data: {
          hashtagId: ht.id,
          tweetVolume: Math.floor(Math.random() * 100000) + 5000,
          rank: i + 1,
          location: "Worldwide",
        },
      });
    }
  }
  console.log("[setup-db]   Trending topics seeded.");

  // --- Seed tweets ---
  console.log("[setup-db] Seeding tweets...");
  const tweetsData = [
    { authorIndex: 0, content: "X is the everything app. We're just getting started. #X" },
    { authorIndex: 0, content: "The bird is freed. #X" },
    { authorIndex: 1, content: "bitcoin is a new global currency with a fixed supply. #Bitcoin" },
    { authorIndex: 1, content: "simplicity is beauty." },
    { authorIndex: 2, content: "we released GPT-5. it is the most capable model we have ever built. #OpenAI #AGI" },
    { authorIndex: 2, content: "intelligence is the most powerful force in the universe. excited about the future. #AI" },
    { authorIndex: 0, content: "SpaceX Starship flies! Humanity is becoming multiplanetary. #SpaceX" },
    { authorIndex: 2, content: "we're getting close to AGI. not sure how to feel about that, but here we go. #AGI" },
    { authorIndex: 1, content: "open protocols are better than closed ones." },
    { authorIndex: 0, content: "Tesla Autopilot is now 10x safer than human driving. #Tesla" },
  ];

  for (const t of tweetsData) {
    const author = createdUsers[t.authorIndex];
    if (!author) continue;
    const existing = await db.tweet.findFirst({
      where: { authorId: author.id, content: t.content },
    });
    if (!existing) {
      await db.tweet.create({
        data: {
          content: t.content,
          authorId: author.id,
        },
      });
    }
  }
  console.log("[setup-db]   Tweets seeded.");

  // --- Seed follows ---
  console.log("[setup-db] Seeding follows...");
  const followPairs = [
    [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1],
  ];
  for (const [fi, ti] of followPairs) {
    const follower = createdUsers[fi];
    const following = createdUsers[ti];
    if (!follower || !following) continue;
    const existing = await db.follow.findFirst({
      where: { followerId: follower.id, followingId: following.id },
    });
    if (!existing) {
      await db.follow.create({
        data: { followerId: follower.id, followingId: following.id },
      });
    }
  }
  console.log("[setup-db]   Follows seeded.");

  console.log("[setup-db] Database setup complete!");
  console.log("[setup-db] Demo login: email=elon@x.com password=Password1");
}

main()
  .catch((err) => {
    console.error("[setup-db] Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
