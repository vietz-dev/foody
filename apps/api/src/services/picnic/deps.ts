import { Layer } from 'effect';
import type { PicnicRepository } from '../../repositories/picnic/repository.js';
import { PicnicService, PicnicServiceLive } from './service.js';

export const makePicnicServiceDeps = (
  picnicRepository: Layer.Layer<PicnicRepository>
): Layer.Layer<PicnicService> => PicnicServiceLive.pipe(Layer.provide(picnicRepository));
