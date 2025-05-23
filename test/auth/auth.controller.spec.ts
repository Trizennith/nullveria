/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@databases/prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { authPasswordHasher } from 'src/common/libs/hasher';
import { LoginResponseDto } from '@api/auth/dto/response/login.dto';
import { UserSessionsResponseBody } from '@api/auth/dto/response/sessions-data';
import { COOKIE_ATTR_JWT_FINGERPRINT } from 'src/api/auth/constants/constant';

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

    const signupResponse = await request(app.getHttpServer()).post('/auth/sign-up').send({
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
        const userSessions = await prisma.userSession.findMany({
          where: { userId: user.id },
        });

        await prisma.refreshToken.deleteMany({
          where: { userSessionID: { in: userSessions.map((session) => session.id) } },
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
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
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
    const userList = await request(app.getHttpServer()).get('/auth/auth-sessions');
    expect(userList.status).toBe(401);
  });

  it('should refresh access token', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'john.doe@example.com',
      password: 'password',
    });
    const cookieValues = getCookie(
      loginResponse.headers['set-cookie'],
      COOKIE_ATTR_JWT_FINGERPRINT.JWT,
    );

    const loginResBody = loginResponse.body as LoginResponseDto;
    expect(loginResBody).toHaveProperty('data.sessionData.refreshToken');
    const refreshToken = loginResBody.data.sessionData.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .get('/auth/auth-sessions')
      .set('Authorization', `Bearer ${loginResBody.data.sessionData.accessToken}`)
      .set('Cookie', cookieValues); // Set the cookie here

    const refreshResponseBody = refreshResponse.body as LoginResponseDto;
    expect(refreshResponseBody).toHaveProperty('data.sessionData.accessToken');
    expect(refreshResponseBody.data.sessionData.accessToken).not.toBe(refreshToken);
    expect(refreshResponseBody.status).toBe(201);
    expect(refreshResponseBody.data.sessionData).toHaveProperty('accessToken');
  });

  it('should fetch user sessions', async () => {
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'john.doe@example.com',
      password: 'password',
    });

    // Extract the cookie string from the set-cookie header

    const cookieValue = getCookie(
      loginResponse.headers['set-cookie'],
      COOKIE_ATTR_JWT_FINGERPRINT.JWT,
    );

    const responseBody = loginResponse.body as LoginResponseDto;
    expect(responseBody).toHaveProperty('data.sessionData.accessToken');
    const accessToken = responseBody.data.sessionData.accessToken;

    const sessionsResponse = await request(app.getHttpServer())
      .get('/auth/auth-sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookieValue); // Set the cookie here

    expect(sessionsResponse.status).toBe(200);
    expect(sessionsResponse.body).toHaveProperty('data.loginData');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionsResponse.body.data.loginData).toBeInstanceOf(Array);
  });
});

function getCookie(setCookieHeader: any, cookieName: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cookiesArray: string[] = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : typeof setCookieHeader === 'string'
      ? [setCookieHeader]
      : [];

  const cookie = cookiesArray.find((cookie) => cookie.startsWith(`${cookieName}=`));

  const cookieValue = cookie ? cookie.split('=')[1].split(';')[0] : undefined;

  if (!cookieValue) {
    throw new Error('JWT cookie not found in login response');
  }

  return cookieValue;
}
