import { describe, expect, test } from 'vitest'
import { resolveHostVersion } from '../src'

describe('resolve', async () => {
  test('resolve specify host package version from a specify dep', async () => {
    const data: [string, string[]] = ['@babel/plugin-transform-optional-chaining', ['@babel/core@7.24.7']]

    const result = await resolveHostVersion(data[0], data[1])
    expect(result).toMatchInlineSnapshot(`
      [
        "@babel/plugin-transform-optional-chaining=7.24.7 => @babel/core^7.24.7",
      ]
    `)
  }, {
    timeout: 600000,
  })
})
