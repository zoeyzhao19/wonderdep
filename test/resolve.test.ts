import { describe, expect, test } from 'vitest'
import { resolveHostVersion } from '../src'

describe('resolve', async () => {
  // test('resolve a specify dep version from a specify host package ', async () => {
  //   const data: [string, string[]] = ['vite-plugin-inspect@0.7.35', ['vite']]

  //   const result = await resolveDepsVersion(data[0], data[1])
  //   expect(result).toMatchInlineSnapshot(`
  //     [
  //       "vite-plugin-inspect@0.7.35 => vite^4.4.8",
  //     ]
  //   `)
  // })

  test('resolve specify host package version from a specify dep', async () => {
    const data: [string, string[]] = ['vite-plugin-inspect', ['vite@4.4.8']]

    const result = await resolveHostVersion(data[0], data[1])
    expect(result).toMatchInlineSnapshot(`
      [
        "vite-plugin-inspect=0.7.35 => vite^4.4.8",
      ]
    `)
  }, {
    timeout: 200000,
  })
})
