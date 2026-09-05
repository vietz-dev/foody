import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth-next';

export async function requireUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user.householdId) redirect('/login');
	return session.user;
}
