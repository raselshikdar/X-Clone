/**
 * Database setup script for X Clone
 * Pushes Prisma schema to Neon PostgreSQL and seeds demo data.
 */

import { execSync } from "child_process";

console.log("[setup-db] Generating Prisma client...");
execSync("npx prisma generate", { stdio: "inherit", cwd: "/vercel/share/v0-project" });

console.log("[setup-db] Pushing Prisma schema to database...");
execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", cwd: "/vercel/share/v0-project" });

console.log("[setup-db] Schema pushed successfully. Now seeding...");

// Dynamic import after generation
const { PrismaClient } = await import("@prisma/client");
const bcrypt = await import("bcrypt");
const db = new PrismaClient();

async function main() {
  // --- Seed users ---
  console.log("[setup-db] Seeding users...");
  const usersData = [
    {
      username: "elonmusk",
      email: "elon@x.com",
      displayName: "Elon Musk",
      bio: "The people have spoken. X is the everything app.",
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
      bio: "CEO of OpenAI. Building safe AGI that benefits all of humanity.",
      password: "Password1",
      verified: true,
      avatar: "https://pbs.twimg.com/profile_images/804990434455887872/BG0Xh3Oa_400x400.jpg",
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const hashed = await bcrypt.default.hash(u.password, 10);
    const existing = await db.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`[setup-db]   @${u.username} already exists.`);
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
    console.log(`[setup-db]   Created @${user.username}`);
  }

  // --- Seed hashtags & trending topics ---
  console.log("[setup-db] Seeding hashtags...");
  const hashtagNames = ["bitcoin", "openai", "grok", "spacex", "tesla", "x", "agi", "ai"];
  const createdHashtags = [];
  for (const name of hashtagNames) {
    const ht = await db.hashtag.upsert({
      where: { name },
      update: {},
      create: { name, tweetCount: Math.floor(Math.random() * 50000) + 1000 },
    });
    createdHashtags.push(ht);
  }
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
  console.log("[setup-db]   Hashtags & trending seeded.");

  // --- Seed tweets ---
  console.log("[setup-db] Seeding tweets...");
  const tweetsData = [
    { authorIndex: 0, content: "X is the everything app. We're just getting started. #x" },
    { authorIndex: 0, content: "The bird is freed. #x" },
    { authorIndex: 1, content: "bitcoin is a new global currency with a fixed supply. #bitcoin" },
    { authorIndex: 1, content: "simplicity is beauty." },
    { authorIndex: 2, content: "We released our most capable model yet. Intelligence is accelerating. #openai #agi" },
    { authorIndex: 2, content: "Intelligence is the most powerful force in the universe. Excited about the future. #ai" },
    { authorIndex: 0, content: "SpaceX Starship flies! Humanity is becoming multiplanetary. #spacex" },
    { authorIndex: 2, content: "Getting closer to AGI every single day. Here we go. #agi" },
    { authorIndex: 1, content: "Open protocols are better than closed ones." },
    { authorIndex: 0, content: "Tesla Autopilot is now far safer than human driving. #tesla" },
  ];
  for (const t of tweetsData) {
    const author = createdUsers[t.authorIndex];
    if (!author) continue;
    const existing = await db.tweet.findFirst({
      where: { authorId: author.id, content: t.content },
    });
    if (!existing) {
      await db.tweet.create({ data: { content: t.content, authorId: author.id } });
      console.log(`[setup-db]   Tweet by @${author.username}`);
    }
  }

  // --- Seed follows ---
  console.log("[setup-db] Seeding follows...");
  const followPairs = [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]];
  for (const [fi, ti] of followPairs) {
    const follower = createdUsers[fi];
    const following = createdUsers[ti];
    if (!follower || !following) continue;
    const existing = await db.follow.findFirst({
      where: { followerId: follower.id, followingId: following.id },
    });
    if (!existing) {
      await db.follow.create({ data: { followerId: follower.id, followingId: following.id } });
    }
  }
  console.log("[setup-db]   Follows seeded.");

  console.log("[setup-db] Done! Demo login -> elon@x.com / Password1");
}

await main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
