import { Layer } from 'effect';
import type { PlanRepository } from '../../repositories/plan/repository.js';
import { PlanService, PlanServiceLive } from './service.js';

export const makePlanServiceDeps = (
  planRepository: Layer.Layer<PlanRepository>
): Layer.Layer<PlanService> => PlanServiceLive.pipe(Layer.provide(planRepository));
