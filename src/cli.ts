import cac from 'cac'
import { consola } from 'consola'
import { resolveDepsVersion } from './resolve'

const cli = cac('wonder')

cli.command('<packageName>', 'package name, can append with a version. e.g: vitest or vitest@0.7.35')
  .option('--deps <deps>', 'deps which is depended, should append with a version. otherwise, it will default to the latest version if there is no specify version with a <packageName>, or will be resolved directly if there is a specify version with the <packageName>')
  .action((packageName, options) => {
    if (!options.deps) {
      consola.warn('No deps provided')
      return
    }

    const deps = options.deps || ''
    resolveDepsVersion(packageName, deps.split(' '))
  })

cli.help()
cli.parse()
