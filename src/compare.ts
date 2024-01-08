import { Range, satisfies } from 'semver'
import type { ResolvedVersion } from './resolve'

/**
 * check if target version  satisfy source version restriction
 */
export function compareVersion(target: ResolvedVersion, source: string) {
  try {
    const sourceRange = new Range(source)
    let targetStr = ''
    if (target[4])
      targetStr = `.${target[4]}${targetStr}`

    if (target[3])
      targetStr = `.${target[3]}${targetStr}`

    if (target[2])
      targetStr = `.${target[2]}${targetStr}`

    return satisfies(targetStr.slice(1), sourceRange)
  }
  catch (err: any) {
    throw new Error(err)
  }
}
