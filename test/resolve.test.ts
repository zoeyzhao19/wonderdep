import { describe, expect, test } from 'vitest'
import { resolvePkg } from '../src/resolve'

describe('resolve host for a specify dep', () => {
  test('resolvePkg', async () => {
    const data: [string, string[]] = ['vite-plugin-inspect@0.7.35', ['vite']]

    const result = await resolvePkg(data[0], data[1])
    expect(result).toMatchInlineSnapshot(`
      [
        "vite-plugin-inspect@0.7.35 => ^4.4.8",
      ]
    `)
  })
})
