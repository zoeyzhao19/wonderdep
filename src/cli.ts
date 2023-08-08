import cac from 'cac'
import consola from 'consola'
import { resolvePkg } from './resolve'

const cli = cac('wonder')

cli.command('<packageName>', 'package name')
  .option('--deps <deps>', 'deps which is depended')
  .action((packageName, options) => {
    if (!options.deps) {
      consola.error('Please specify deps name')
      return
    }
    resolvePkg(packageName, (options.deps as string).split(' '))
  })

cli.help()
cli.parse()
