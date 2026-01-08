const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. Tạo Admin
  const hashedPassword = await bcrypt.hash('123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Tạo Bàn mẫu
  await prisma.table.createMany({
    data: [
      { name: 'Bàn 1', capacity: 4, location: 'Trong nhà', qrToken: 'seed-token-1', qrVersion: 1, status: 'ACTIVE' },
      { name: 'Bàn 2', capacity: 2, location: 'Ngoài trời', qrToken: 'seed-token-2', qrVersion: 1, status: 'ACTIVE' },
    ],
    skipDuplicates: true, 
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());