import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to neonDB...");
  
  // Create a user
  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: "Neon Test User",
    },
  });
  console.log("✅ Successfully created user:", user);

  // Fetch users
  const users = await prisma.user.findMany();
  console.log(`✅ Successfully fetched ${users.length} user(s) from the database.`);

  // Clean up
  await prisma.user.delete({
    where: { id: user.id },
  });
  console.log("✅ Successfully cleaned up test user.");
}

main()
  .catch(e => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
