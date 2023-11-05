import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function load(path: string, key: string): Promise<unknown> {
  if (!key) {
    console.warn('cache.load(): cache key is falsy, nothing will be loaded');
    return;
  }

  key = Bun.SHA1.hash(key, 'hex');

  try {
    mkdir(path, { recursive: true });
  } catch {
    console.warn(`cache.load(): could not create cache directory; path=${path}`);
  }

  try {
    const data = await readFile(join(path, `${key}.json`), { encoding: 'utf-8' });
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        return typeof parsedData === 'object' && 'ts' in parsedData ? parsedData.data : parsedData;
      } catch (e) {
        console.warn(`cache.load(): error parsing cache data; path=${path}, key=${key}`);
      } finally {
        // console.debug(`cache.load(): cache read; path=${path}, key=${key}`);
      }
    }
  } catch {
    // ignored - file does not exist
  }
}

export async function save(path: string, key: string, data: unknown): Promise<void> {
  if (!key) {
    console.warn('cache.save(): cache key is falsy, nothing will be saved');
    return;
  }

  key = Bun.SHA1.hash(key, 'hex');

  try {
    await writeFile(join(path, `${key}.json`), JSON.stringify({ ts: Date.now(), data }), { encoding: 'utf-8' });
    // console.debug(`cache.save(): cache write; path=${path}, key=${key}`);
  } catch (e) {
    console.warn('cache.save(): could not save data to cache', e);
  }
}
