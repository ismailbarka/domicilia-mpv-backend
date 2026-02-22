const prisma = require("./prismaClient");

async function main() {
  // 1. Create Categories if they don't exist
  const categories = [
    { name: "Cleaner" },
    { name: "Nanny" },
    { name: "Plumber" },
    { name: "Electrician" },
    { name: "Gardener" },
    { name: "Painter" }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: {},
      create: { name: cat.name }
    });
  }

  const createdCategories = await prisma.category.findMany();

  // 2. Generate 50 Providers
  const providers = [];
  const baseLat = 33.5731; // Casablanca
  const baseLng = -7.5898;

  for (let i = 1; i <= 50; i++) {
    const randomCat = createdCategories[Math.floor(Math.random() * createdCategories.length)];
    // Randomize position within ~20km
    const lat = baseLat + (Math.random() - 0.5) * 0.2;
    const lng = baseLng + (Math.random() - 0.5) * 0.2;

    providers.push({
      name: `Provider ${i}`,
      phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
      description: `Description for provider ${i}, offering ${randomCat.name} services in Casablanca and surrounding areas.`,
      latitude: lat,
      longitude: lng,
      categoryId: randomCat.id,
      isActive: true
    });
  }

  await prisma.provider.createMany({
    data: providers
  });

  console.log("Successfully seeded 6 categories and 50 providers!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
