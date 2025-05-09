import { QueryInterface, QueryTypes } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { UserAddressAttributes } from '../models/UserAddress';
import { UserAuthAttributes } from '../models/UserAuth';
import { UserAttributes } from '../models/Users';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert sample users
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'Nicolas',
        lastName: 'Post',
        fullName: 'Nicolas Post',
        email: 'nicolaspost@yahoo.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserAttributes,
    ]);

    // Retrieve the inserted user ID
    const users: { id: number }[] = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE email = 'nicolaspost@yahoo.com'",
      { type: QueryTypes.SELECT },
    );

    if (!users.length) {
      throw new Error('No user found with the specified email.');
    }

    const userId: number = users[0].id;

    // Insert sample UserAuth data
    await queryInterface.bulkInsert('UserAuth', [
      {
        userId: userId, // Ensure this matches the foreign key in the UserAuth model
        refreshToken: 'sampleRefreshToken1', // Replace with a valid refresh token
        loginData: {
          metadata: {
            ip: '192.168.1.1',
            device: 'Chrome Browser',
          },
        }, // Ensure this matches the expected structure in UserAuthAttributes
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserAuthAttributes,
    ]);

    // Insert sample UserAddresses data
    await queryInterface.bulkInsert('UserAddresses', [
      {
        userId: userId, // Ensure this matches the foreign key in the UserAddresses model
        address1: '10450 County Road 15',
        address2: '',
        city: 'Longmont',
        state: 'CO',
        postalCode: '80504',
        country: 'US',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserAddressAttributes,
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('UserAddresses', {});
    await queryInterface.bulkDelete('UserAuth', {});
    await queryInterface.bulkDelete('Users', {});
  },
};
