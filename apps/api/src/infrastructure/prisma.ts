import { PrismaPg } from '@prisma/adapter-pg';
import { Context, Effect, Layer } from 'effect';
import { PrismaClient } from '../generated/prisma/client.js';

export class PrismaService extends Context.Tag('PrismaService')<PrismaService, PrismaClient>() {}

export const PrismaLive = Layer.scoped(
  PrismaService,
  Effect.acquireRelease(
    Effect.sync(
      () =>
        new PrismaClient({
          adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
        })
    ),
    (client) => Effect.promise(() => client.$disconnect())
  )
);

export const dbEffect = <A>(run: (db: PrismaClient) => Promise<A>) =>
  Effect.gen(function* () {
    const db = yield* PrismaService;
    return yield* Effect.tryPromise({ try: () => run(db), catch: (error) => error });
  });
