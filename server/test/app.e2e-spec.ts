import { INestApplication, Injectable, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import request from 'supertest';
import {
  ApiEnvelopeInterceptor,
  GlobalExceptionFilter,
} from '../src/common/api.js';
import { User } from '../src/database/schemas.js';
import { PlanningModule } from '../src/planning/planning.module.js';

const TEST_ACCESS_SECRET = 'test-access-secret-at-least-32-characters';

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: TEST_ACCESS_SECRET,
    });
  }

  validate(payload: { sub: string; email: string; sid: string }) {
    return { id: payload.sub, email: payload.email, sessionId: payload.sid };
  }
}

describe('Lifeloom API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let tokenA: string;
  let tokenB: string;
  let goalId: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.APP_ENV = 'test';
    process.env.MONGODB_URI = mongo.getUri();
    process.env.MONGODB_DB_NAME = 'lifeloom-test';
    process.env.ACCESS_TOKEN_SECRET = TEST_ACCESS_SECRET;
    process.env.REFRESH_TOKEN_SECRET =
      'test-refresh-secret-at-least-32-characters';
    process.env.GOOGLE_ALLOWED_AUDIENCES = 'test-client';
    process.env.AWS_S3_BUCKET = 'test-bucket';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot(process.env.MONGODB_URI, {
          dbName: process.env.MONGODB_DB_NAME,
        }),
        PassportModule,
        JwtModule.register({ secret: TEST_ACCESS_SECRET }),
        PlanningModule,
      ],
      providers: [TestJwtStrategy],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    const users = app.get<Model<User>>(getModelToken(User.name));
    const jwt = app.get(JwtService);
    const [userA, userB] = await users.create([
      {
        googleSubject: 'google-a',
        email: 'a@example.test',
        emailVerified: true,
        displayName: 'A',
      },
      {
        googleSubject: 'google-b',
        email: 'b@example.test',
        emailVerified: true,
        displayName: 'B',
      },
    ]);
    tokenA = await jwt.signAsync(
      { sub: userA._id.toString(), email: userA.email, sid: 'session-a' },
      { secret: process.env.ACCESS_TOKEN_SECRET },
    );
    tokenB = await jwt.signAsync(
      { sub: userB._id.toString(), email: userB.email, sid: 'session-b' },
      { secret: process.env.ACCESS_TOKEN_SECRET },
    );
  });

  it('wraps successful API responses', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/goals')
      .set('authorization', `Bearer ${tokenA}`)
      .send({ title: 'Learn a language', deadlineType: 'none' })
      .expect(201)
      .expect(({ body }) => expect(body.success).toBe(true));
    goalId = response.body.data._id;
  });

  it('rejects unexpected properties', () =>
    request(app.getHttpServer())
      .post('/api/v1/goals')
      .set('authorization', `Bearer ${tokenA}`)
      .send({ title: 'Goal', deadlineType: 'none', ownerId: 'forged' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.success).toBe(false);
        expect(body.error.fieldErrors).toBeDefined();
      }));

  it('does not expose another user goal', () =>
    request(app.getHttpServer())
      .get(`/api/v1/goals/${goalId}`)
      .set('authorization', `Bearer ${tokenB}`)
      .expect(404)
      .expect(({ body }) =>
        expect(body.error.code).toBe('RESOURCE_NOT_FOUND'),
      ));

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });
});
