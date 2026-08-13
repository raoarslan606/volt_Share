import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin12345', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@voltshare.pk' },
    update: { role: 'ADMIN', isVerified: true },
    create: {
      name: 'System Admin',
      email: 'admin@voltshare.pk',
      phone: '03000000000',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      authProvider: 'LOCAL',
    },
  });

  console.log('✅ Admin user created/updated successfully:');
  console.log('   Email: admin@voltshare.pk');
  console.log('   Password: Admin12345');
  console.log('   Role: ADMIN');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
