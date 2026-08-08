import sharp from 'sharp';
import { statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const files = ['rr-ice2.png', 'rr-ice3.png', 'rr-ice4.png'];

for (const file of files) {
  const input = resolve(publicDir, file);
  const output = input.replace(/\.png$/i, '.webp');
  const beforeKB = Math.round(statSync(input).size / 1024);

  await sharp(input)
    .resize({ width: 2000, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(output);

  const afterKB = Math.round(statSync(output).size / 1024);
  const pct = Math.round((1 - afterKB / beforeKB) * 100);
  console.log(`${file}: ${beforeKB} KB → ${afterKB} KB (-${pct}%)`);
}
