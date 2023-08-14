import { consola } from 'consola'
import pacote from 'pacote'
import { compareVersion } from './compare'
import { dumpCache, loadCache } from './cache'

export type ResolvedVersion = [string, '@' | '^' | '~', number | undefined, number | undefined, number | undefined]

async function resolveHostPkgPack(name: string) {
  consola.info(`resolving all available versions of ${name}...`)
  const pack = await pacote.packument(name)
  return pack
}

async function resolveHostPkgManifest(name: string) {
  consola.info(`resolving manifest for ${name}...`)
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

export async function resolvePkg(packageNameV: string, deps: string[]) {
  const pack = await resolveHostPkgPack(packageNameV)

  const cache = await loadCache()
  let shouldUpdateCache = false

  const result: string[] = []
  for (const dep of deps) {
    let found = false
    const depInfos = resolveVersion(dep)
    if (depInfos[1] !== '@') {
      consola.error(`Please use @ to specify the exact version of ${dep}`)
      break
    }

    const packageVersions = Object.keys(pack.versions).reverse()
    for (const packageVersion of packageVersions) {
      if (found)
        break
      let manifestDeps: Record<string, string>
      const packageWithVersion = packageNameV.split('@')[1] ? packageNameV : `${packageNameV}@${packageVersion}`
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

      if (manifestDeps[depInfos[0]]) {
        const depVersions = manifestDeps[depInfos[0]]?.trim().split('||')
        for (let depVersion of depVersions) {
          depVersion = /^d+/.test(depVersion) ? `@${depVersion}` : depVersion
          if (!depInfos[2]) {
            // deps that does not specify the version would resolved directly
            result.push(`${cacheName}@${cacheVersion} => ${manifestDeps[depInfos[0]]?.trim()}`)
            found = true
            break
          }
          else if (compareVersion(depInfos, resolveVersion(`${depInfos[0]}${depVersion}`))) {
            result.push(`${cacheName}@${cacheVersion} => ${manifestDeps[depInfos[0]]?.trim()}`)
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
    consola.success(`Found the nearest ${packageNameV} version for ${deps.join(', ')}`)
    consola.success(`${result.join('\n  ')}\n`)
  }

  return result
}
