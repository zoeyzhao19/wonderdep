import cac from 'cac'
import { version } from '../package.json'
import { log } from './log'
import { resolveHostVersion } from './resolve'
import { cleanCache } from './cache'

const cli = cac('wonder')

cli.command('cache [type]')
  .action((type: string) => {
    if (type === 'clean')
      cleanCache()
  })

cli.command('<packageName>', 'raw package name, and should not append with a version. e.g: vitest')
  .option('--deps <...deps>', 'deps which is depended, should append with a semver version')
  .action((packageName, options) => {
    if (!options.deps) {
      log.warn('No deps provided')
      return
    }
    const deps = options.deps || ''
    resolveHostVersion(packageName, deps.split(' '))
  })

cli.help()
cli.version(version)
cli.parse()
