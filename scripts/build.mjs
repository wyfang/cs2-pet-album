import { mkdir, readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const script = html.match(/<script id="app-script">([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('应用脚本缺失，无法构建。');
new vm.Script(script, { filename: 'index.html' });
await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/index.html', root), html);
console.log('构建完成：dist/index.html（独立单文件，无运行时依赖）');
