'use server';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';

const revalidate = () => ['/settings', '/plan/einkaufsliste'].forEach((p) => revalidatePath(p));

export async function connectPicnic(email: string, password: string) {
	await requireUser();
	const result = await api.picnic.connect({ email, password });
	revalidate();
	return result;
}

export async function verifyPicnic2fa(code: string) {
	await requireUser();
	const result = await api.picnic.verify2fa({ code });
	revalidate();
	return result;
}

export async function disconnectPicnic() {
	await requireUser();
	await api.picnic.disconnect({});
	revalidate();
}
