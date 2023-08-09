// https://github.com/antfu/taze/src/io/resolves.ts
import { resolve } from 'node:path'
import os from 'node:os'
import { existsSync, promises as fs } from 'node:fs'
import { consola } from 'consola'

let cache: Record<string, Record<string, any>> = {}

const cacheDir = resolve(os.tmpdir(), 'wonder-dep')
const cachePath = resolve(cacheDir, 'cache.json')

export async function loadCache() {
  if (existsSync(cachePath)) {
    consola.info(`cache loaded from ${cachePath}`)
    cache = JSON.parse(await fs.readFile(cachePath, 'utf-8'))
  }
  return cache
}

export async function dumpCache() {
  try {
    await fs.mkdir(cacheDir, { recursive: true })
    await fs.writeFile(cachePath, JSON.stringify(cache), 'utf-8')
    consola.info(`cache saved to ${cachePath}`)
  }
  catch (err) {
    consola.warn('Failed to save cache')
    consola.warn(err)
  }
}
