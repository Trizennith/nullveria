import { PrismaClient } from '@prisma/client';
import { authPasswordHasher } from '../../common/libs/hasher';
import Generator from '../../common/utils/generator';

const prisma = new PrismaClient();

async function main() {
  // Seed Admin User
  await prisma.user.create({
    data: {
      userName: '43563456',
      phoneNumber: '0952344325',
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'realuser@example.com',
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
      userName: 'reilivy1234352',
      phoneNumber: '43566435',
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
  await prisma.user.create({
    data: {
      userName: 'nullveria55',
      phoneNumber: '3567',
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

  // Add a new user with a 'moderator' role
  const moderatorUser = await prisma.user.create({
    data: {
      userName: 'moderator_user',
      firstName: 'Moderator',
      lastName: 'User',
      fullName: 'Moderator User',
      email: 'moderator@example.com',
      password: await authPasswordHasher('moderator_password'), // Replace with a hashed password
      role: 'moderator',
      isActive: true,
      isVerified: true,
      totalLogins: 3,
    },
  });

  // Add a new user with a 'developer' role
  const developerUser = await prisma.user.create({
    data: {
      userName: 'developer_user',
      phoneNumber: '1234567890',
      firstName: 'Developer',
      lastName: 'User',
      fullName: 'Developer User',
      email: 'developer@example.com',
      password: await authPasswordHasher('developer_password'), // Replace with a hashed password
      role: 'developer',
      isActive: true,
      isVerified: true,
      totalLogins: 1,
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

  // Seed User Session for Regular User
  await prisma.userSession.create({
    data: {
      userId: moderatorUser.id,
      sessionId: Generator.generateUniqueID(),
      refreshToken: {
        create: {
          fingerprint: Generator.generateUniqueID(),
          hashedToken: Generator.generateUniqueID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          revoked: false,
        },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      location: 'Los Angeles, USA',
      additionalInfo: { metadata: 'Moderator metadata' },
    },
  });

  // Seed User Session for Admin User
  await prisma.userSession.create({
    data: {
      userId: moderatorUser.id,
      sessionId: Generator.generateUniqueID(),
      refreshToken: {
        create: {
          fingerprint: Generator.generateUniqueID(),
          hashedToken: Generator.generateUniqueID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          revoked: false,
        },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      location: 'Los Angeles, USA',
      additionalInfo: { metadata: 'Moderator metadata' },
    },
  });

  // Seed User Address for Moderator User
  await prisma.userAddress.create({
    data: {
      userId: moderatorUser.id,
      address1: '456 Elm St',
      address2: 'Suite 300',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
    },
  });

  // Seed User Session for Moderator User
  await prisma.userSession.create({
    data: {
      userId: moderatorUser.id,
      sessionId: Generator.generateUniqueID(),
      refreshToken: {
        create: {
          fingerprint: Generator.generateUniqueID(),
          hashedToken: Generator.generateUniqueID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          revoked: false,
        },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      location: 'Los Angeles, USA',
      additionalInfo: { metadata: 'Moderator metadata' },
    },
  });

  // Seed User Address for Developer User
  await prisma.userAddress.create({
    data: {
      userId: developerUser.id,
      address1: '789 Tech Lane',
      address2: 'Suite 101',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      country: 'USA',
    },
  });

  // Create RefreshToken for Developer User
  await prisma.refreshToken.create({
    data: {
      userSessionID: developerUser.id, // Link to the user session
      fingerprint: Generator.generateUniqueID(),
      hashedToken: Generator.generateUniqueID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      revoked: false,
    },
  });

  // Seed User Session for Developer User
  await prisma.userSession.create({
    data: {
      userId: moderatorUser.id,
      sessionId: Generator.generateUniqueID(),
      refreshToken: {
        create: {
          fingerprint: Generator.generateUniqueID(),
          hashedToken: Generator.generateUniqueID(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          revoked: false,
        },
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      location: 'Los Angeles, USA',
      additionalInfo: { metadata: 'Moderator metadata' },
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
