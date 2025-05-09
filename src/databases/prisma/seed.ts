import { PrismaClient } from '@prisma/client';
import { authPasswordHasher } from '../../common/libs/hasher';

const prisma = new PrismaClient();

async function main() {
  // Seed Admin User
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: await authPasswordHasher('admin_password'), // Replace with a hashed password
      role: 'admin',
      isActive: true,
      isVerified: true,
      totalLogins: 5,
    },
  });

  // Seed Regular User
  const regularUser = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      password: await authPasswordHasher('password'), // Replace with a hashed password
      role: 'user',
      isActive: true,
      isVerified: false,
      totalLogins: 2,
    },
  });

  // Seed Guest User
  const guestUser = await prisma.user.create({
    data: {
      firstName: 'Guest',
      lastName: 'User',
      fullName: 'Guest User',
      email: 'guest@example.com',
      password: await authPasswordHasher('password'), // Replace with a hashed password
      role: 'guest',
      isActive: true,
      isVerified: false,
      totalLogins: 0,
    },
  });

  // Seed User Address for Regular User
  await prisma.userAddress.create({
    data: {
      userId: regularUser.id,
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
  });

  // Seed UserSession for Regular User
  await prisma.userSession.create({
    data: {
      userId: regularUser.id,
      refreshToken: 'sample_refresh_token',
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      location: 'New York, USA',
      additionalInfo: { metadata: 'Sample metadata' },
    },
  });

  // Seed UserSession for Admin User
  await prisma.userSession.create({
    data: {
      userId: adminUser.id,
      refreshToken: 'admin_refresh_token',
      refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      location: 'Admin Location',
      additionalInfo: { metadata: 'Admin metadata' },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((e) => {
      console.error('Error during disconnection:', e);
    });
  });
