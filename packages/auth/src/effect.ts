import { Context, Data, Effect, Layer } from 'effect';
import { createAuth, type AuthInstance, type Session } from './auth';
import type { AuthConfig } from './config';

export class AuthError extends Data.TaggedError('AuthError')<{ message: string; cause: unknown }> {}

/**
 * Effect service. Resolve sessions from request headers (cookie forwarded by the
 * caller) and derive the default context:
 *
 * ```ts
 * const Auth = AuthTag<'teamId'>();
 * const program = Effect.flatMap(Auth, (auth) => auth.resolveContext(request.headers));
 * // -> { teamId: string } | null
 * ```
 */
export type IAuth<Field extends string = string> = {
  instance: AuthInstance<Field>;
  getSession: (headers: Headers) => Effect.Effect<Session<Field> | null, AuthError>;
  resolveContext: (headers: Headers) => Effect.Effect<Record<Field, string> | null, AuthError>;
};

/** Same tag id for every `Field`, so `AuthTag<F>()` matches the layer built by `AuthLive`. */
export const AuthTag = <Field extends string>() =>
  Context.GenericTag<IAuth<Field>>('@vietz/auth/Auth');

export const makeAuthService = <Field extends string>(
  instance: AuthInstance<Field>,
  field: Field
): IAuth<Field> => {
  const getSession: IAuth<Field>['getSession'] = (headers) =>
    Effect.tryPromise({
      try: () => instance.api.getSession({ headers }) as Promise<Session<Field> | null>,
      catch: (cause) =>
        new AuthError({ message: cause instanceof Error ? cause.message : String(cause), cause })
    });
  return {
    instance,
    getSession,
    resolveContext: (headers) =>
      getSession(headers).pipe(
        Effect.map((session) => {
          const id = session?.user[field];
          if (!id) return null;
          const context = {} as Record<Field, string>;
          context[field] = id;
          return context;
        })
      )
  };
};

/**
 * Layer providing `IAuth<Field>`. To reuse a Prisma client that lives in another layer:
 *
 * ```ts
 * Layer.unwrapEffect(Effect.map(PrismaService, (prisma) => AuthLive(config(prisma))))
 * ```
 */
export const AuthLive = <Field extends string>(
  config: AuthConfig<Field>
): Layer.Layer<IAuth<Field>> =>
  Layer.succeed(AuthTag<Field>(), makeAuthService(createAuth(config), config.context.field));
