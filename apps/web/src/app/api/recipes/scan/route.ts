import { headers } from 'next/headers';
import { auth } from '@/lib/server/auth-next';
import { extractRecipeFromImages } from '@/lib/server/recipe-extractor';

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

	const formData = await request.formData();
	const images = formData.getAll('images').filter((v): v is File => v instanceof File);
	if (images.length === 0)
		return Response.json({ error: 'Keine Bilder hochgeladen' }, { status: 400 });

	// ponytail: HEIC (iPhone) nicht konvertiert – Claude nimmt nur jpeg/png/gif/webp.
	// Bei Bedarf sharp/heic-convert davor schalten.
	return Response.json(await extractRecipeFromImages(images));
}
