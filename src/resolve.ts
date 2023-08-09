import { consola } from 'consola'
import pacote from 'pacote'
import { compareVersion } from './compare'
import { dumpCache, loadCache } from './cache'

export type ResolvedVersion = [string, '@' | '^' | '~', number | undefined, number | undefined, number | undefined]

async function resolveHostPkgPack(name: string) {
  const pack = await pacote.packument(name)
  return pack
}

async function resolveHostPkgManifest(name: string) {
  const manifest = await pacote.manifest(name)
  return manifest
}

function resolveVersion(pkg: string): ResolvedVersion {
  const [pkgName, pkgVersion] = pkg.split(/[@^~]/)
  let type: any = pkg.slice(pkgName.length, pkgName.length + 1)

  if (!type) {
    consola.warn(`The type of ${pkgName} is not specified, use the latest version of ${pkg}`)
    type = '@'
  }
  else if (!['@', '^', '~'].includes(type)) {
    consola.error(`The type ${type} of ${pkgName} is not supported`)
  }

  if (!pkgVersion)
    return [pkgName, type, undefined, undefined, undefined]

  const [release] = pkgVersion.split(/[-+]/)
  const [major, minor, patch] = release.split('.')

  return [pkgName, type, +major, +minor, +patch]
}

export async function resolvePkg(packageName: string, deps: string[]) {
  consola.start(`resolving all available versions of ${packageName}...`)

  const pack = await resolveHostPkgPack(packageName)

  const cache = await loadCache()
  let shouldUpdateCache = false

  const result: string[] = []
  for (const dep of deps) {
    let found = false
    const depVersion = resolveVersion(dep)
    if (depVersion[1] !== '@') {
      consola.error(`Please use @ to specify the exact version of ${dep}`)
      break
    }

    const packageVersions = Object.keys(pack.versions).reverse()
    for (const packageVersion of packageVersions) {
      if (found)
        break
      let manifestDeps: Record<string, string>
      if (!cache[`${packageName}@${packageVersion}`]) {
        consola.start(`resolving manifest for ${packageName}@${packageVersion}...`)
        const hostManifest = await resolveHostPkgManifest(`${packageName}@${packageVersion}`)
        manifestDeps = { ...hostManifest.dependencies, ...hostManifest.devDependencies, ...hostManifest.optionalDependencies }
        shouldUpdateCache = true
        cache[`${packageName}@${packageVersion}`] = {
          name: hostManifest.name,
          version: hostManifest.version,
          dependencies: hostManifest.dependencies,
          devDependencies: hostManifest.devDependencies,
          optionalDependencies: hostManifest.optionalDependencies,
        }
      }
      else {
        const cacheInfo = cache[`${packageName}@${packageVersion}`]
        manifestDeps = { ...cacheInfo.dependencies, ...cacheInfo.devDependencies, ...cacheInfo.optionalDependencies }
      }

      const cacheName = cache[`${packageName}@${packageVersion}`].name
      const cacheVersion = cache[`${packageName}@${packageVersion}`].version

      if (manifestDeps[depVersion[0]]) {
        const manifestVersions = manifestDeps[depVersion[0]]?.trim().split('||')
        for (let manifestVersion of manifestVersions) {
          manifestVersion = /^d+/.test(manifestVersion) ? `@${manifestVersion}` : manifestVersion
          if (!depVersion[2]) {
            result.push(`${cacheName}@${cacheVersion} => ${manifestDeps[depVersion[0]]?.trim()}`)
            found = true
            break
          }
          else if (compareVersion(depVersion, resolveVersion(`${depVersion[0]}${manifestVersion}`))) {
            result.push(`${cacheName}@${cacheVersion} => ${manifestDeps[depVersion[0]]?.trim()}`)
            found = true
            break
          }
        }
      }
      else {
        consola.info(`The dep ${dep} is not specified in the latest ${packageName}@${packageVersion}, abort to resolve more`)
        break
      }
    }
  }

  shouldUpdateCache && await dumpCache()

  if (result.length) {
    consola.success('package resolved succeed')
    consola.success(`Found the nearest ${packageName} version for ${deps.join(', ')}`)
    consola.success(`${result.join('\n  ')}\n`)
  }

  return result
}
