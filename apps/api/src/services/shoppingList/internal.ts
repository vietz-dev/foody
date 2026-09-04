import { ShoppingListServiceError } from './errors.js';

export const mapShoppingListServiceError = (error: { message: string }): ShoppingListServiceError =>
  new ShoppingListServiceError({ message: error.message, cause: error });
