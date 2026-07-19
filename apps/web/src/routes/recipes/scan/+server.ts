import { error, json } from '@sveltejs/kit';
import { extractRecipeFromImages } from '$lib/server/ai/recipe-extractor';
import { detectMimeType, toJpegBuffer } from '$lib/server/image';
import { requireUser } from '$lib/server/require-user';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	requireUser(locals);

	const formData = await request.formData();
	const imageFiles = formData.getAll('images').filter((value): value is File => value instanceof File);

	if (imageFiles.length === 0) {
		error(400, 'Keine Bilder hochgeladen');
	}

	const imageDataUrls = await Promise.all(
		imageFiles.map(async (file) => {
			let buf: Buffer = Buffer.from(await file.arrayBuffer());
			let mime = detectMimeType(buf);
			if (mime === 'image/heic') {
				buf = await toJpegBuffer(buf);
				mime = 'image/jpeg';
			}
			return `data:${mime};base64,${buf.toString('base64')}`;
		})
	);

	const extracted = await extractRecipeFromImages(imageDataUrls);

	return json(extracted);
};
