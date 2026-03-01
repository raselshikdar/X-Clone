import { neon } from "@neondatabase/serverless";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("[seed] Seeding database...");

  const password = await bcrypt.hash("Password123", 10);

  // Insert demo users (upsert by username)
  const usersData = [
    {
      username: "elonmusk",
      displayName: "Elon Musk",
      email: "elon@xtest.io",
      avatar: "https://unavatar.io/twitter/elonmusk",
      bio: "X, SpaceX, Tesla, Boring Co, Neuralink",
      verified: true,
    },
    {
      username: "jack",
      displayName: "jack",
      email: "jack@xtest.io",
      avatar: "https://unavatar.io/twitter/jack",
      bio: "#bitcoin",
      verified: true,
    },
    {
      username: "sama",
      displayName: "Sam Altman",
      email: "sam@xtest.io",
      avatar: "https://unavatar.io/twitter/sama",
      bio: "CEO of OpenAI",
      verified: true,
    },
    {
      username: "naval",
      displayName: "Naval",
      email: "naval@xtest.io",
      avatar: "https://unavatar.io/twitter/naval",
      bio: "Founder, investor. AngelList co-founder.",
      verified: false,
    },
  ];

  const userIds = {};
  for (const u of usersData) {
    // Use gen_random_uuid() so PostgreSQL generates the ID
    const rows = await sql`
      INSERT INTO "User" (id, username, "displayName", email, password, avatar, bio, verified, "isPrivate", role, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${u.username},
        ${u.displayName},
        ${u.email},
        ${password},
        ${u.avatar},
        ${u.bio},
        ${u.verified},
        false,
        'user',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        avatar = EXCLUDED.avatar,
        bio = EXCLUDED.bio,
        verified = EXCLUDED.verified,
        "updatedAt" = NOW()
      RETURNING id, username
    `;
    userIds[u.username] = rows[0].id;
    console.log(`[seed] Upserted @${rows[0].username} (id: ${rows[0].id})`);
  }

  // Sample tweets
  const tweets = [
    { user: "elonmusk", content: "The thing I find most surprising about AI is how quickly it's improving. We may be approaching a moment of profound change." },
    { user: "jack", content: "Bitcoin is the most important invention of our lifetime. It's digital gold and the best form of money humans have ever created. #Bitcoin" },
    { user: "sama", content: "We may be approaching a moment where AI systems can do the work of a brilliant scientist or engineer. The implications are enormous." },
    { user: "naval", content: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep. Money is how we transfer time and wealth." },
    { user: "elonmusk", content: "Free speech is the bedrock of democracy. X is committed to being the world's most trusted real-time information source." },
    { user: "jack", content: "The simplest advice I give: focus on doing one thing really well before doing many things. #startups" },
    { user: "sama", content: "The next decade will bring more scientific progress than the previous century. We're going to cure diseases, understand the brain, and much more." },
    { user: "naval", content: "Happiness is a choice and a skill, not something that happens to you. You can train yourself to be happier with time and practice." },
    { user: "elonmusk", content: "Going to Mars is important to make humanity multi-planetary. We need a backup for civilization. #SpaceX" },
    { user: "sama", content: "The companies that will matter most in the next decade are the ones building AI at the frontier. #AI #OpenAI" },
  ];

  for (const t of tweets) {
    const authorId = userIds[t.user];
    if (!authorId) continue;
    await sql`
      INSERT INTO "Tweet" (id, content, "authorId", views, "hasMedia", "isThread", "sensitiveContent", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${t.content},
        ${authorId},
        ${Math.floor(Math.random() * 2000000 + 50000)},
        false,
        false,
        false,
        NOW() - (random() * interval '5 days'),
        NOW()
      )
    `;
    console.log(`[seed] Tweet created for @${t.user}`);
  }

  // Trending hashtags
  const hashtags = [
    { name: "#AI", tweetCount: 245000 },
    { name: "#Bitcoin", tweetCount: 182000 },
    { name: "#OpenAI", tweetCount: 94000 },
    { name: "#Tesla", tweetCount: 67000 },
    { name: "#SpaceX", tweetCount: 45000 },
    { name: "#Web3", tweetCount: 38000 },
    { name: "#Startups", tweetCount: 29000 },
    { name: "#Tech", tweetCount: 198000 },
  ];

  for (const tag of hashtags) {
    await sql`
      INSERT INTO "Hashtag" (id, name, "tweetCount", "createdAt")
      VALUES (gen_random_uuid(), ${tag.name}, ${tag.tweetCount}, NOW())
      ON CONFLICT (name) DO UPDATE SET "tweetCount" = EXCLUDED."tweetCount"
    `;
  }
  console.log("[seed] Hashtags seeded.");

  // Follow relationships
  const follows = [
    ["elonmusk", "jack"],
    ["elonmusk", "sama"],
    ["jack", "elonmusk"],
    ["sama", "elonmusk"],
    ["naval", "sama"],
    ["naval", "jack"],
  ];

  for (const [follower, following] of follows) {
    const followerId = userIds[follower];
    const followingId = userIds[following];
    if (!followerId || !followingId) continue;
    await sql`
      INSERT INTO "Follow" (id, "followerId", "followingId", "createdAt")
      VALUES (gen_random_uuid(), ${followerId}, ${followingId}, NOW())
      ON CONFLICT ("followerId", "followingId") DO NOTHING
    `;
  }
  console.log("[seed] Follow relationships seeded.");

  console.log("[seed] Done!");
}

seed().catch((err) => {
  console.error("[seed] Error:", err.message || err);
  process.exit(1);
});
