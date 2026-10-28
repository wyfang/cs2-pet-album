import './build.mjs';
import { access, copyFile, mkdir } from 'node:fs/promises';

const siteRoot = new URL('../../steam.pet/', import.meta.url);
await access(new URL('.git', siteRoot));
await mkdir(new URL('cs2-pet-album/', siteRoot), { recursive: true });
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('cs2-pet-album/index.html', siteRoot));
console.log('已同步：../steam.pet/cs2-pet-album/index.html');
