import { beforeEach, describe, expect, it } from 'vitest'
import { dedupeImports } from '../src/utils'

describe('dedupeImports', () => {
  let warnMsg = ''
  const warnFn = (msg: string) => {
    warnMsg = msg
  }

  beforeEach(() => {
    warnMsg = ''
  })

  it('later should have hight priority', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module2',
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module2",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg)
      .toMatchInlineSnapshot(`"Duplicated imports "foo", the one from "module1" has been ignored and "module2" is used"`)
  })

  it('respect explit priority', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module2',
          priority: 2,
        },
        {
          name: 'foo',
          from: 'module3',
          priority: 1,
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module2",
          "name": "foo",
          "priority": 2,
        },
      ]
    `)
  })

  it('should respect negative priority', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module2',
          priority: -1,
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module1",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot(`""`)
  })

  it('should treat priority 0 as lower than default', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module2',
          priority: 0,
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module1",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot(`""`)
  })

  it('should not dedupe disabled imports', () => {
    const imports = [
      {
        name: 'foo',
        from: 'moduleA',
        disabled: true,
      },
      {
        name: 'foo',
        from: 'moduleB',
      },
      {
        name: 'foo',
        from: 'moduleC',
      },
    ]

    expect(dedupeImports(imports, warnFn)).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "moduleA",
          "name": "foo",
        },
        {
          "from": "moduleC",
          "name": "foo",
        },
      ]
    `)
    expect(warnMsg).toMatchInlineSnapshot(`"Duplicated imports "foo", the one from "moduleB" has been ignored and "moduleC" is used"`)
  })

  it('should not warn about duplicates when one is disabled', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
          disabled: true,
        },
        {
          name: 'foo',
          from: 'module2',
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "module1",
          "name": "foo",
        },
        {
          "from": "module2",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })

  it('should dedupe some from', () => {
    expect(dedupeImports(
      [
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module1',
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "from": "module1",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })

  it('should dedupe correctly when disabled imports precede duplicates', () => {
    expect(dedupeImports(
      [
        {
          name: 'bar',
          from: 'moduleX',
          disabled: true,
        },
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module2',
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "moduleX",
          "name": "bar",
        },
        {
          "from": "module2",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg)
      .toMatchInlineSnapshot(`"Duplicated imports "foo", the one from "module1" has been ignored and "module2" is used"`)
  })

  it('should respect priority when disabled imports precede duplicates', () => {
    expect(dedupeImports(
      [
        {
          name: 'bar',
          from: 'moduleX',
          disabled: true,
        },
        {
          name: 'baz',
          from: 'moduleY',
          disabled: true,
        },
        {
          name: 'foo',
          from: 'module1',
          priority: 1,
        },
        {
          name: 'foo',
          from: 'module2',
          priority: 2,
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "moduleX",
          "name": "bar",
        },
        {
          "disabled": true,
          "from": "moduleY",
          "name": "baz",
        },
        {
          "from": "module2",
          "name": "foo",
          "priority": 2,
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })

  it('should dedupe same-source duplicates after a disabled import', () => {
    expect(dedupeImports(
      [
        {
          name: 'bar',
          from: 'moduleX',
          disabled: true,
        },
        {
          name: 'foo',
          from: 'module1',
        },
        {
          name: 'foo',
          from: 'module1',
        },
      ],
      warnFn,
    )).toMatchInlineSnapshot(`
      [
        {
          "disabled": true,
          "from": "moduleX",
          "name": "bar",
        },
        {
          "from": "module1",
          "name": "foo",
        },
      ]
    `)

    expect(warnMsg).toMatchInlineSnapshot('""')
  })
})
