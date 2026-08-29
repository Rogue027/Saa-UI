import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const sourceDirectory = path.join(projectRoot, 'Launch');
const publicDirectory = path.join(projectRoot, 'public', 'launch');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const sourceFiles = (await readdir(sourceDirectory))
  .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));

if (!sourceFiles.length) {
  throw new Error('No launch frames were found in the Launch directory.');
}

// Frames after this inspected cut contain baked-in promotional copy. The cinematic
// sequence intentionally ends on the final clean frame so site copy remains live text.
const cleanSequence = sourceFiles.slice(0, Math.min(216, sourceFiles.length));

await mkdir(publicDirectory, { recursive: true });

await Promise.all(cleanSequence.map(async (fileName) => {
  const source = path.join(sourceDirectory, fileName);
  const destination = path.join(publicDirectory, fileName);
  const sourceStats = await stat(source);
  const destinationStats = await stat(destination).catch(() => null);

  if (!destinationStats || destinationStats.size !== sourceStats.size) {
    await copyFile(source, destination);
  }
}));

const manifest = {
  frames: cleanSequence.map((fileName) => `/launch/${encodeURIComponent(fileName)}`),
  sourceFrameCount: sourceFiles.length,
  playbackFrameCount: cleanSequence.length,
};

await writeFile(
  path.join(publicDirectory, 'frames.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(`Prepared ${manifest.playbackFrameCount} ordered launch frames.`);
