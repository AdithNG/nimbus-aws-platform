import { seedDatabase } from "../src/lib/seed";

async function main() {
  console.log("Seeding database...");
  const result = await seedDatabase({ reset: true });
  console.log("Seed complete:", result);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
