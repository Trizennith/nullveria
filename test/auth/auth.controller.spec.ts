/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@databases/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { authPasswordHasher } from 'src/common/libs/hasher';
import { LoginResponseDto } from '@api/auth/dto/response/login.dto';
import { UserSessionsResponseBody } from '@api/auth/dto/response/sessions-data';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should signup a new user', async () => {
    // Drop the existing user if it exists
    await prisma.user.deleteMany({
      where: { email: 'new.user@example.com' },
    });

    const signupResponse = await request(app.getHttpServer()).post('/auth/signup').send({
      username: 'newuser123',
      phoneNumber: '32453453',
      email: 'new.user@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body).toHaveProperty('id');
    expect(signupResponse.body).toHaveProperty('email', 'new.user@example.com');
  });

  it('should login and access protected route', async () => {
    async function deleteAll() {
      const user = await prisma.user.findUnique({
        where: { email: 'john.doe@example.com' },
      });

      if (user) {
        await prisma.userAddress.deleteMany({
          where: { userId: user.id },
        });

        await prisma.userSession.deleteMany({
          where: { userId: user.id },
        });

        await prisma.user.delete({
          where: { email: 'john.doe@example.com' },
        });
      }
    }

    await deleteAll();
    await prisma.user.create({
      data: {
        userName: 'lmao1234',
        phoneNumber: '23432324324',
        email: 'john.doe@example.com',
        password: await authPasswordHasher('password'), // In a real-world scenario, ensure this is hashed
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe', // Combine firstName and lastName for fullName
      },
    });
    const loginResponse = await request(app.getHttpServer()).post('/auth/signin').send({
      email: 'john.doe@example.com',
      password: 'password',
    });

    const responseBody = loginResponse.body as LoginResponseDto;
    expect(responseBody).toHaveProperty('data.sessionData.accessToken');
    const accessToken = responseBody.data.sessionData.accessToken;

    const responseData = (
      await request(app.getHttpServer())
        .get('/auth/auth-sessions')
        .set('Authorization', `Bearer ${accessToken}`)
    ).body as UserSessionsResponseBody;

    expect(responseData.data.loginData).toBeInstanceOf(Array);
    expect(responseData.data.totalActiveLogin).toBeGreaterThan(0); // Ensure it has values
  });

  it('should throw Unauthorized accessing protected route without token', async () => {
    const userList = await request(app.getHttpServer()).get('/test-app/users');
    expect(userList.status).toBe(401);
  });

  it('should refresh access token', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/auth/signin').send({
      email: 'john.doe@example.com',
      password: 'password',
    });

    type LoginResponseBody = {
      data: {
        sessionData: {
          refreshToken: string;
        };
      };
    };

    const responseBody = loginResponse.body as LoginResponseBody;
    expect(responseBody).toHaveProperty('data.sessionData.refreshToken');
    const refreshToken = responseBody.data.sessionData.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/auth-refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(201);
    expect(refreshResponse.body).toHaveProperty('accessToken');
  });

  it('should fetch user sessions', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/auth/signin').send({
      email: 'john.doe@example.com',
      password: 'password',
    });

    type LoginResponseBody = {
      data: {
        sessionData: {
          accessToken: string;
        };
      };
    };

    const responseBody = loginResponse.body as LoginResponseBody;
    expect(responseBody).toHaveProperty('data.sessionData.accessToken');
    const accessToken = responseBody.data.sessionData.accessToken;

    const sessionsResponse = await request(app.getHttpServer())
      .get('/auth/auth-sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(sessionsResponse.status).toBe(200);
    expect(sessionsResponse.body).toHaveProperty('data.loginData');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionsResponse.body.data.loginData).toBeInstanceOf(Array);
  });
});
