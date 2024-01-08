// https://github.com/antfu/taze/src/io/resolves.ts
import { resolve } from 'node:path'
import os from 'node:os'
import { existsSync, promises as fs } from 'node:fs'
import { log } from './log'

let cache: Record<string, Record<string, any>> = {}

const cacheDir = resolve(os.tmpdir(), 'wonder-dep')
const cachePath = resolve(cacheDir, 'cache.json')

export async function loadCache() {
  if (existsSync(cachePath)) {
    const content = await fs.readFile(cachePath, 'utf-8')
    cache = JSON.parse(content || '{}')
  }
  return cache
}

export async function dumpCache() {
  try {
    if (!existsSync(cachePath))
      await fs.mkdir(cacheDir, { recursive: true })

    await fs.writeFile(cachePath, JSON.stringify(cache), 'utf-8')
    log.info(`cache saved to ${cachePath}`)
  }
  catch (err) {
    log.warn('Failed to save cache')
    log.warn(err)
  }
}

export async function cleanCache() {
  try {
    if (existsSync(cachePath)) {
      await fs.truncate(cachePath, 0)
      log.success('cache cleaned')
    }
  }
  catch (err) {
    log.warn('Failed to clean cache')
    log.warn(err)
  }
}
