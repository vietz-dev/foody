import type { Effect } from 'effect';
import type { PicnicRepositoryError } from './errors.js';

export type PicnicAccount = {
  userId: string;
  email: string;
  countryCode: string;
  /** Decrypted Picnic session token. */
  authKey: string;
  pendingTwoFactor: boolean;
};

export type PicnicProductRef = { id: string; name: string; unitQuantity: string };

export type IPicnicRepository = {
  getAccount: (userId: string) => Effect.Effect<PicnicAccount | null, PicnicRepositoryError>;
  saveAccount: (account: PicnicAccount) => Effect.Effect<void, PicnicRepositoryError>;
  deleteAccount: (userId: string) => Effect.Effect<void, PicnicRepositoryError>;
  mapIngredient: (
    householdId: string,
    ingredientId: string,
    product: PicnicProductRef | null
  ) => Effect.Effect<void, PicnicRepositoryError>;
};
