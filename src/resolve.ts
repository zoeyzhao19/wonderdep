import pacote from 'pacote'
import { valid } from 'semver'
import { log } from './log'
import { compareVersion } from './compare'
import { dumpCache, loadCache } from './cache'

export type ResolvedVersion = [string, '^' | '~' | '=' | '<' | '>' | '<=' | '>=', string | undefined, string | undefined, string | undefined]

const modifierReg = /(?:<=)|(?:>=)|(?:[\^~=<>@])/

function ensureSpecifyDepVersion(dep: string) {
  return dep.replace(/(\S+?)[\^~@](.*)/, '$1=$2')
}

function ensureRawName(name: string) {
  const [raw, version] = name.split(modifierReg)
  if (version !== undefined)
    log.warn(`${name} should not append with a version, use ${raw}`)
  return raw
}

async function resolveHostPkgPack(name: string) {
  log.info(`🍳 resolving all available versions of ${name}...`)
  const pack = await pacote.packument(name)
  return pack
}

export async function resolvePkgManifest(name: string) {
  log.info(`🍳 resolving manifest for ${name}...`)
  const manifest = await pacote.manifest(name)
  return manifest
}

function resolveVersion(pkg: string): ResolvedVersion | undefined {
  const [pkgName, pkgVersion] = pkg.split(modifierReg)

  let type: any = pkg.slice(pkgName.length, pkgName.length + 1)

  if (!valid(pkgVersion))
    return

  if (!type || type === '@')
    type = '='

  else if (!['=', '^', '~', '<=', '>='].includes(type))
    log.error(`The type ${type} of ${pkgName} is not supported`)

  if (!pkgVersion)
    return [pkgName, type, undefined, undefined, undefined]

  const [release] = pkgVersion.split(/[-+]/)
  const [major, minor, patch] = release.split('.')

  return [pkgName, type, major, minor, patch]
}

/**
 *
 * @deprecated use `resolveDepsVersion` instead
 */
export async function resolvePkg(hostPkgNameWithV: string, deps: string[]) {
  return resolveHostVersion(hostPkgNameWithV, deps)
}

export async function resolveHostVersion(hostPkgName: string, deps: string[]) {
  hostPkgName = ensureRawName(hostPkgName)
  const pack = await resolveHostPkgPack(hostPkgName)

  const cache = await loadCache()
  let shouldUpdateCache = false

  const result: string[] = []
  for (let dep of deps) {
    dep = ensureSpecifyDepVersion(dep)

    const resolved = resolveVersion(dep) // resolve dep with version info [pkgName, type, major, minor, patch]
    if (!resolved) {
      log.info(`The dep ${dep} is not valid, skip`)
      break
    }

    const packageVersions = Object.keys(pack.versions).reverse()
    let found = false
    for (const packageVersion of packageVersions) {
      if (found)
        break

      let manifestDeps: Record<string, string>
      const packageWithVersion = `${hostPkgName}@${packageVersion}`
      if (!cache[`${packageWithVersion}`]) {
        const hostManifest = await resolvePkgManifest(`${packageWithVersion}`)
        manifestDeps = { ...hostManifest.dependencies, ...hostManifest.devDependencies, ...hostManifest.optionalDependencies }
        shouldUpdateCache = true
        cache[`${packageWithVersion}`] = {
          name: hostManifest.name,
          version: hostManifest.version,
          dependencies: hostManifest.dependencies,
          devDependencies: hostManifest.devDependencies,
          optionalDependencies: hostManifest.optionalDependencies,
        }
      }
      else {
        const cacheInfo = cache[`${packageWithVersion}`]
        manifestDeps = { ...cacheInfo.dependencies, ...cacheInfo.devDependencies, ...cacheInfo.optionalDependencies }
      }

      const cacheName = cache[`${packageWithVersion}`].name
      const cacheVersion = cache[`${packageWithVersion}`].version

      if (manifestDeps[resolved[0]]) {
        if (compareVersion(resolved, manifestDeps[resolved[0]])) {
          result.push(`${cacheName}=${cacheVersion} => ${resolved[0]}${manifestDeps[resolved[0]]?.trim()}`)
          found = true
          break
        }
      }
      else {
        log.info(`The dep ${dep} is not specified in ${packageWithVersion}, abort to resolve more`)
        break
      }
    }
  }

  shouldUpdateCache && await dumpCache()

  if (result.length) {
    log.success('package resolved succeed')
    log.success(`Found the nearest ${hostPkgName} version for ${deps.join(', ')}`)
    log.success(`${result.join('\n  ')}\n`)
  }

  return result
}
