import cac from 'cac'
import { consola } from 'consola'
import { resolveHostVersion } from './resolve'

const cli = cac('wonder')

cli.command('<packageName>', 'raw package name, and should not append with a version. e.g: vitest')
  .option('--deps <deps>', 'deps which is depended, should append with a semver version')
  .action((packageName, options) => {
    if (!options.deps) {
      consola.warn('No deps provided')
      return
    }
    const deps = options.deps || ''
    resolveHostVersion(packageName, deps.split(' '))
  })

cli.help()
cli.parse()
