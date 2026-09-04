import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/server/auth-next';
export const { GET, POST } = toNextJsHandler(auth);
