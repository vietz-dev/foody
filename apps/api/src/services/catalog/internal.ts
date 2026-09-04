import { CatalogServiceError } from './errors.js';

export const mapCatalogServiceError = (error: { message: string }): CatalogServiceError =>
  new CatalogServiceError({ message: error.message, cause: error });
