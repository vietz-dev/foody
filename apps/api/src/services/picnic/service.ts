import { Context, Effect, Layer } from 'effect';
import PicnicClient from 'picnic-api';
import { PicnicRepository } from '../../repositories/picnic/repository.js';
import type { PicnicAccount, PicnicProductRef } from '../../repositories/picnic/types.js';
import { getErrorMessage } from '../../repositories/utils.js';
import { PicnicNotConnectedError, PicnicServiceError } from './errors.js';

export type PicnicStatus = {
  status: 'disconnected' | 'pending_2fa' | 'connected';
  email: string | null;
};
export type PicnicConnectResult =
  | { status: 'connected' | '2fa_required' }
  | { status: 'failed'; message: string };
export type PicnicProduct = PicnicProductRef & { price: number; imageId: string | null };
export type PicnicPushItem = { productId: string; count: number };
export type PicnicPushResult = { added: number; cartCount: number };

export type IPicnicService = {
  status: (userId: string) => Effect.Effect<PicnicStatus, PicnicServiceError>;
  connect: (
    userId: string,
    email: string,
    password: string
  ) => Effect.Effect<PicnicConnectResult, PicnicServiceError>;
  verify2fa: (
    userId: string,
    code: string
  ) => Effect.Effect<PicnicConnectResult, PicnicServiceError>;
  disconnect: (userId: string) => Effect.Effect<void, PicnicServiceError>;
  search: (
    userId: string,
    query: string
  ) => Effect.Effect<PicnicProduct[], PicnicServiceError | PicnicNotConnectedError>;
  mapIngredient: (
    householdId: string,
    ingredientId: string,
    product: PicnicProductRef | null
  ) => Effect.Effect<void, PicnicServiceError>;
  pushCart: (
    userId: string,
    items: PicnicPushItem[]
  ) => Effect.Effect<PicnicPushResult, PicnicServiceError | PicnicNotConnectedError>;
};

export class PicnicService extends Context.Tag('PicnicService')<PicnicService, IPicnicService>() {}

const COUNTRY = 'DE';
const client = (account?: Pick<PicnicAccount, 'authKey' | 'countryCode'>) =>
  new PicnicClient({
    countryCode: (account?.countryCode ?? COUNTRY) as 'DE',
    authKey: account?.authKey
  });

const serviceError = (error: unknown) =>
  new PicnicServiceError({ message: getErrorMessage(error), cause: error });

export const PicnicServiceLive = Layer.effect(
  PicnicService,
  Effect.gen(function* () {
    const repository = yield* PicnicRepository;
    const account = (userId: string) =>
      repository.getAccount(userId).pipe(Effect.mapError(serviceError));

    // Runs a Picnic call for a connected user; a rejected token drops the account so the UI asks to reconnect.
    const withClient = <A>(
      userId: string,
      call: (picnic: ReturnType<typeof client>) => Promise<A>
    ) =>
      Effect.gen(function* () {
        const current = yield* account(userId);
        if (!current || current.pendingTwoFactor)
          return yield* new PicnicNotConnectedError({ message: 'Picnic-Konto nicht verbunden.' });
        return yield* Effect.tryPromise({ try: () => call(client(current)), catch: (e) => e }).pipe(
          Effect.catchAll((error) => {
            const message = getErrorMessage(error);
            if (/401|unauthori[sz]ed|auth/i.test(message))
              return repository.deleteAccount(userId).pipe(
                Effect.mapError(serviceError),
                Effect.flatMap(
                  () => new PicnicNotConnectedError({ message: 'Picnic-Sitzung abgelaufen.' })
                )
              );
            return Effect.fail(new PicnicServiceError({ message, cause: error }));
          })
        );
      });

    const service: IPicnicService = {
      status: (userId) =>
        account(userId).pipe(
          Effect.map((current) => ({
            status: !current
              ? 'disconnected'
              : current.pendingTwoFactor
                ? 'pending_2fa'
                : 'connected',
            email: current?.email ?? null
          }))
        ),

      connect: (userId, email, password) =>
        Effect.gen(function* () {
          const picnic = client();
          const login = yield* Effect.tryPromise({
            try: () => picnic.auth.login(email, password),
            catch: (e) => e
          }).pipe(Effect.either);
          if (login._tag === 'Left')
            return { status: 'failed' as const, message: getErrorMessage(login.left) };
          const pending = login.right.second_factor_authentication_required;
          if (pending)
            yield* Effect.tryPromise({
              try: () => picnic.auth.generate2FACode('SMS'),
              catch: serviceError
            });
          yield* repository
            .saveAccount({
              userId,
              email,
              countryCode: COUNTRY,
              authKey: login.right.authKey,
              pendingTwoFactor: pending
            })
            .pipe(Effect.mapError(serviceError));
          return { status: pending ? ('2fa_required' as const) : ('connected' as const) };
        }),

      verify2fa: (userId, code) =>
        Effect.gen(function* () {
          const current = yield* account(userId);
          if (!current) return { status: 'failed' as const, message: 'Bitte zuerst anmelden.' };
          const verified = yield* Effect.tryPromise({
            try: () => client(current).auth.verify2FACode(code),
            catch: (e) => e
          }).pipe(Effect.either);
          if (verified._tag === 'Left')
            return { status: 'failed' as const, message: getErrorMessage(verified.left) };
          yield* repository
            .saveAccount({ ...current, authKey: verified.right.authKey, pendingTwoFactor: false })
            .pipe(Effect.mapError(serviceError));
          return { status: 'connected' as const };
        }),

      disconnect: (userId) =>
        Effect.gen(function* () {
          const current = yield* account(userId);
          if (current && !current.pendingTwoFactor)
            yield* Effect.tryPromise(() => client(current).auth.logout()).pipe(Effect.ignore);
          yield* repository.deleteAccount(userId).pipe(Effect.mapError(serviceError));
        }),

      search: (userId, query) =>
        withClient(userId, async (picnic) => {
          const units = await picnic.catalog.search(query);
          const seen = new Set<string>();
          return units
            .filter((unit) => unit?.id && !seen.has(unit.id) && seen.add(unit.id))
            .slice(0, 20)
            .map((unit) => ({
              id: unit.id,
              name: unit.name,
              unitQuantity: unit.unit_quantity ?? '',
              price: unit.display_price ?? 0,
              imageId: unit.image_id ?? null
            }));
        }),

      mapIngredient: (householdId, ingredientId, product) =>
        repository
          .mapIngredient(householdId, ingredientId, product)
          .pipe(Effect.mapError(serviceError)),

      pushCart: (userId, items) =>
        withClient(userId, async (picnic) => {
          // Only top up what is missing, so pressing the button twice does not double the order.
          const cart = await picnic.cart.getCart();
          const inCart = new Map<string, number>();
          for (const line of cart.analytics_context_data?.items_list ?? [])
            inCart.set(line.product_id, (inCart.get(line.product_id) ?? 0) + line.quantity);
          const missing = items
            .map(({ productId, count }) => ({
              productId,
              quantity: Math.max(0, count - (inCart.get(productId) ?? 0))
            }))
            .filter((item) => item.quantity > 0);
          const updated = missing.length ? await picnic.cart.addProductsToCart(missing) : cart;
          return {
            added: missing.reduce((sum, item) => sum + item.quantity, 0),
            cartCount: updated.total_count
          };
        })
    };
    return PicnicService.of(service);
  })
);
