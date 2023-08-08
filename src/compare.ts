import type { ResolvedVersion } from './resolve'

export function compareVersion(depVersion: ResolvedVersion, manifestVersion: ResolvedVersion) {
  const depMajor = depVersion[2]
  const depMinor = depVersion[3]
  const depPatch = depVersion[4]
  const manifestMajor = manifestVersion[2]!
  const manifestMinor = manifestVersion[3]!
  const manifestPatch = manifestVersion[4]!
  if (depVersion[1] === '@') {
    switch (manifestVersion[1]) {
      case '@':
        if (depMajor === manifestMajor) {
          if (!depMinor || (depMinor === manifestMinor && (!depPatch || depPatch === manifestPatch)))
            return true
        }
        return false
      case '^':
        if (depMajor === manifestMajor) {
          if (!depMinor || (depMinor && depMinor >= manifestMinor))
            return true
        }
        return false
      case '~':
        if (depMajor === manifestMajor) {
          if (!depMinor || (depMinor === manifestMinor && (!depPatch || depPatch >= manifestPatch)))
            return true
        }
        return false
    }
  }
}
