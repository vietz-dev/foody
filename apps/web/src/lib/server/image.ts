import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function detectMimeType(buf: Buffer): string {
	if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
	if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
	if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
	if (
		buf[0] === 0x52 &&
		buf[1] === 0x49 &&
		buf[2] === 0x46 &&
		buf[3] === 0x46 &&
		buf[8] === 0x57 &&
		buf[9] === 0x45 &&
		buf[10] === 0x42 &&
		buf[11] === 0x50
	)
		return 'image/webp';
	// HEIC/HEIF: ftyp box at offset 4
	const ftyp = buf.subarray(4, 8).toString('ascii');
	if (ftyp === 'ftyp') return 'image/heic';
	return 'image/jpeg';
}

export async function toJpegBuffer(buf: Buffer): Promise<Buffer> {
	const dir = mkdtempSync(join(tmpdir(), 'foody-'));
	const src = join(dir, 'input.heic');
	const out = join(dir, 'output.jpg');
	try {
		writeFileSync(src, buf);
		await execFileAsync('sips', ['-s', 'format', 'jpeg', '-Z', '2000', src, '--out', out]);
		return readFileSync(out);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
