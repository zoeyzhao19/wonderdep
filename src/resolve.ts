import { consola } from 'consola'
import pacote from 'pacote'
import { compareVersion } from './compare'
import { dumpCache, loadCache } from './cache'

export type ResolvedVersion = [string, '@' | '^' | '~', number | undefined, number | undefined, number | undefined]

function ensureSpecifyDep(dep: string) {
  return dep.replace(/(\S+?)[\^~](.*)/, '$1@$2')
}

async function resolveHostPkgPack(name: string) {
  consola.info(`🍳 resolving all available versions of ${name}...`)
  const pack = await pacote.packument(name)
  return pack
}

async function resolveHostPkgManifest(name: string) {
  consola.info(`🍳 resolving manifest for ${name}...`)
  const manifest = await pacote.manifest(name)
  return manifest
}

function resolveVersion(pkg: string): ResolvedVersion {
  const [pkgName, pkgVersion] = pkg.split(/[@^~]/)
  let type: any = pkg.slice(pkgName.length, pkgName.length + 1)

  if (!type)
    type = '@'

  else if (!['@', '^', '~'].includes(type))
    consola.error(`The type ${type} of ${pkgName} is not supported`)

  if (!pkgVersion)
    return [pkgName, type, undefined, undefined, undefined]

  const [release] = pkgVersion.split(/[-+]/)
  const [major, minor, patch] = release.split('.')

  return [pkgName, type, +major, +minor, +patch]
}

/**
 *
 * @deprecated use `resolveDepsVersion` instead
 */
export async function resolvePkg(hostPkgNameWithV: string, deps: string[]) {
  return resolveDepsVersion(hostPkgNameWithV, deps)
}

export async function resolveDepsVersion(hostPkgNameWithV: string, deps: string[]) {
  const pack = await resolveHostPkgPack(hostPkgNameWithV)

  const cache = await loadCache()
  let shouldUpdateCache = false

  const result: string[] = []
  for (let dep of deps) {
    dep = ensureSpecifyDep(dep)
    let found = false
    const resolved = resolveVersion(dep) // resolve dep with version info [pkgName, type, major, minor, patch]

    const packageVersions = Object.keys(pack.versions).reverse()
    for (const packageVersion of packageVersions) {
      if (found)
        break
      let manifestDeps: Record<string, string>
      const packageWithVersion = hostPkgNameWithV.split('@')[1] ? hostPkgNameWithV : `${hostPkgNameWithV}@${packageVersion}`
      if (!cache[`${packageWithVersion}`]) {
        const hostManifest = await resolveHostPkgManifest(`${packageWithVersion}`)
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
        const depVersions = manifestDeps[resolved[0]]?.trim().split('||')
        for (let depVersion of depVersions) {
          depVersion = /^d+/.test(depVersion) ? `@${depVersion}` : depVersion
          if (!resolved[2]) {
            // deps that does not specify the version would resolved directly
            result.push(`${cacheName}@${cacheVersion} => ${resolved[0]}${manifestDeps[resolved[0]]?.trim()}`)
            found = true
            break
          }
          else if (compareVersion(resolved, resolveVersion(`${resolved[0]}${depVersion}`))) {
            result.push(`${cacheName}@${cacheVersion} => ${resolved[0]}${manifestDeps[resolved[0]]?.trim()}`)
            found = true
            break
          }
        }
      }
      else {
        consola.info(`The dep ${dep} is not specified in the latest ${packageWithVersion}, abort to resolve more`)
        break
      }
    }
  }

  shouldUpdateCache && await dumpCache()

  if (result.length) {
    consola.success('package resolved succeed')
    consola.success(`Found the nearest ${hostPkgNameWithV} version for ${deps.join(', ')}`)
    consola.success(`${result.join('\n  ')}\n`)
  }

  return result
}
