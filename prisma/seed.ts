import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all records in the correct order
  await prisma.course.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  // Create Categories and SubCategories
  const categories = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.category.create({
        data: {
          name: `Category ${i + 1}`,
          subCategories: {
            create: Array.from({ length: 3 }).map((_, j) => ({
              name: `SubCategory ${i + 1}-${j + 1}`,
            })),
          },
        },
        include: { subCategories: true },
      })
    )
  );

  // Create Tags
  const tags = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.tag.create({
        data: { name: `Tag ${i + 1}` },
      })
    )
  );

  // Create Courses
  for (let i = 0; i < 20; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomSubCategory =
      randomCategory.subCategories[Math.floor(Math.random() * randomCategory.subCategories.length)];
    const randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 3);

    await prisma.course.create({
      data: {
        title: `Course ${i + 1}`,
        isFree: Math.random() > 0.5,
        postDate: new Date(),
        categoryId: randomCategory.id,
        subCategoryId: randomSubCategory.id,
        tags: {
          connect: randomTags.map((tag) => ({ id: tag.id })),
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
