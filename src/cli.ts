import cac from 'cac'
import { consola } from 'consola'
import { resolvePkg } from './resolve'

const cli = cac('wonder')

cli.command('<packageName>', 'package name')
  .option('--deps <deps>', 'deps which is depended')
  .action((packageName, options) => {
    if (!options.deps) {
      consola.warn('No deps provided')
      return
    }

    const deps = options.deps || ''
    resolvePkg(packageName, deps.split(' '))
  })

cli.help()
cli.parse()
