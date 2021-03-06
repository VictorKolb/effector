//@ts-check
const {promises} = require('fs')
const {resolve} = require('path')

/**
fn:
- with fn with second argument
- with fn without second argument
- without fn

source:
- unit
- combinable

target:
- without target
- unit
- array of units


clock array kinds:
  no unification to any:
- [voidt, stringt]
- [stringt, voidt]
  unification to any:
- [voidt, anyt, stringt]
- [voidt, stringt, anyt]
- [anyt, voidt, stringt]
- [anyt, stringt, voidt]
- [stringt, voidt, anyt]
- [stringt, anyt, voidt]
*/

function generateCase({
  description,
  pass,
  clock: clockItems,
  combinable,
  fn,
  secondArgument,
  explicitArgumentTypes,
  unificationToAny,
  fnClockTypeAssertion,
  fnWithoutArgs,
}) {
  description = `${description} (should ${pass ? 'pass' : 'fail'})`
  const clock = printArray(clockItems)
  const headers = []
  let body = []
  const footer = ['expect(typecheck).toMatchInlineSnapshot()']
  if (combinable) {
    if (fn && secondArgument) {
      headers.push(
        'const target = createEvent<{a: string; b: number; clock: any}>()',
      )
    } else {
      headers.push('const target = createEvent<{a: string; b: number}>()')
    }
    if (fn && secondArgument && explicitArgumentTypes) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  fn: ({a, b}: {a: string; b: number}, clock: ${
          fnClockTypeAssertion ? 'string' : 'any'
        }) => ({a, b, clock}),
  target,
})`,
      ]
    } else if (fn && secondArgument && !explicitArgumentTypes) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  fn: ({a, b}, clock) => ({a, b, clock}),
  target,
})`,
      ]
    } else if (fn && !secondArgument && explicitArgumentTypes) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  fn: ({a, b}: {a: string; b: number}) => ({a, b}),
  target,
})`,
      ]
    } else if (
      fn &&
      !secondArgument &&
      !explicitArgumentTypes &&
      !fnWithoutArgs
    ) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  fn: ({a, b}) => ({a, b}),
  target,
})`,
      ]
    } else if (
      fn &&
      !secondArgument &&
      !explicitArgumentTypes &&
      fnWithoutArgs
    ) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  fn: () => ({a: '', b: 2}),
  target,
})`,
      ]
    } else if (!fn) {
      body = [
        `sample({
  source: {a, b},
  clock: ${clock},`,
        `  target,
})`,
      ]
    }
  } else {
    if (fn && secondArgument) {
      headers.push('const target = createEvent<{a: string; clock: any}>()')
    } else if (fn && !secondArgument) {
      headers.push('const target = createEvent<{a: string}>()')
    } else if (!fn) {
      headers.push('const target = createEvent<string>()')
    }
    if (fn && secondArgument && explicitArgumentTypes) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  fn: (a: string, clock: ${
          fnClockTypeAssertion ? 'string' : 'any'
        }) => ({a, clock}),
  target,
})`,
      ]
    } else if (fn && secondArgument && !explicitArgumentTypes) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  fn: (a, clock) => ({a, clock}),
  target,
})`,
      ]
    } else if (fn && !secondArgument && explicitArgumentTypes) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  fn: (a: string) => ({a}),
  target,
})`,
      ]
    } else if (
      fn &&
      !secondArgument &&
      !explicitArgumentTypes &&
      !fnWithoutArgs
    ) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  fn: (a) => ({a}),
  target,
})`,
      ]
    } else if (
      fn &&
      !secondArgument &&
      !explicitArgumentTypes &&
      fnWithoutArgs
    ) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  fn: () => ({a: ''}),
  target,
})`,
      ]
    } else if (!fn) {
      body = [
        `sample({
  source: a,
  clock: ${clock},`,
        `  target,
})`,
      ]
    }
  }
  return createTest(description, [...headers, ...body, ...footer])
}

function printArray(array) {
  return `[${array.join(', ')}]`
}
function wrapText(firstLine, lines) {
  return [firstLine, ...leftPad(lines), '})'].join(`\n`)
}
function leftPad(lines) {
  return lines
    .join(`\n`)
    .split(`\n`)
    .map(line => `  ${line}`)
}
function permute(items) {
  if (items.length === 0) return [[]]
  if (items.length === 1) return [[items[0]]]
  if (items.length === 2)
    return [
      [items[0], items[1]],
      [items[1], items[0]],
    ]
  const result = []
  for (let i = 0; i < items.length; i++) {
    const head = items[i]
    const tail = [...items]
    tail.splice(i, 1)
    const subresults = permute(tail)
    for (const subresult of subresults) {
      result.push([head, ...subresult])
    }
  }
  return result
}
function matchSomeOfBoolFields(value, shape) {
  for (const field in shape) {
    if (value[field] === shape[field]) return true
  }
  return false
}
const generatedCases = generateCaseSet({
  groupBy: ['fn', 'combinable'],
  groupDescriptions: {
    fn: val => (val ? 'fn' : 'no fn'),
    combinable: val => (val ? 'combinable source' : 'plain source'),
  },
  ignore: [
    item =>
      !item.fn &&
      matchSomeOfBoolFields(item, {
        fnClockTypeAssertion: true,
        secondArgument: true,
        explicitArgumentTypes: true,
        fnWithoutArgs: true,
      }),
    item =>
      item.fnClockTypeAssertion &&
      matchSomeOfBoolFields(item, {
        fn: false,
        secondArgument: false,
        explicitArgumentTypes: false,
      }),
    item =>
      item.fnWithoutArgs &&
      matchSomeOfBoolFields(item, {
        fn: false,
        fnClockTypeAssertion: true,
        secondArgument: true,
        explicitArgumentTypes: true,
      }),
  ],
  shape: {
    combinable: boolField(),
    fn: boolField(),
    secondArgument: boolField(),
    explicitArgumentTypes: boolField(),
    unificationToAny: boolField(),
    fnClockTypeAssertion: boolField(),
    fnWithoutArgs: boolField(),
    pass: dependent(({fnClockTypeAssertion}) => !fnClockTypeAssertion),
    clock: dependent(({unificationToAny, fnClockTypeAssertion}) =>
      unificationToAny
        ? ['anyt', 'voidt', fnClockTypeAssertion ? 'numt' : 'stringt']
        : ['voidt', fnClockTypeAssertion ? 'numt' : 'stringt'],
    ),
    description: dependent(shape => {
      const res = []
      shape.combinable ? res.push('combinable') : res.push('plain')
      shape.fn && res.push('fn')
      shape.secondArgument && res.push('fnClock')
      shape.explicitArgumentTypes && res.push('typedFn')
      shape.unificationToAny && res.push('unificationToAny')
      shape.fnClockTypeAssertion && res.push('assertFnType')
      shape.fnWithoutArgs && res.push('fnWithoutArgs')

      return res.join(', ')
    }),
  },
  generateCases({
    description,
    pass,
    clock,
    combinable,
    fn,
    secondArgument,
    explicitArgumentTypes,
    unificationToAny,
    fnClockTypeAssertion,
    fnWithoutArgs,
  }) {
    const cases = []
    if (!unificationToAny) {
      for (const clockItem of clock) {
        cases.push(
          generateCase({
            description: `${description}, single ${printArray([clockItem])}`,
            pass,
            clock: [clockItem],
            combinable,
            fn,
            secondArgument,
            explicitArgumentTypes,
            unificationToAny,
            fnClockTypeAssertion,
            fnWithoutArgs,
          }),
        )
      }
    }
    for (const permutation of permute(clock)) {
      cases.push(
        generateCase({
          description: `${description} ${printArray(permutation)}`,
          pass,
          clock: permutation,
          combinable,
          fn,
          secondArgument,
          explicitArgumentTypes,
          unificationToAny,
          fnClockTypeAssertion,
          fnWithoutArgs,
        }),
      )
    }
    return {
      description,
      cases,
    }
  },
})

writeTestSuite({
  file: 'clockArrayGen',
  suite: generatedCases,
  usedMethods: ['createStore', 'createEvent', 'sample'],
  header: `
const voidt = createEvent()
const anyt = createEvent<any>()
const stringt = createEvent<string>()
const numt = createEvent<number>()
const a = createStore('')
const b = createStore(0)
`,
})
function selectUniqN(items, {n, optional = []}) {
  if (n === 0) return [[]]
  if (n === 1) return items.map(item => [item])
  // if (n > items.length)
  function selectUniqNFlat(items, {n}) {}
}
function createDescribe(description, lines) {
  return wrapText(
    `describe('${description.replace(/\'/gi, '"')}', () => {`,
    lines.filter(Boolean),
  )
}
function createTest(description, lines) {
  return wrapText(
    `test('${description.replace(/\'/gi, '"')}', () => {`,
    lines.filter(Boolean),
  )
}
function byFields(values, {shape = {}}) {
  for (const key in shape) {
    const def = shape[key]
    if (def.union) {
      values = permuteField(values, {
        field: key,
        items: def.union,
        amount: {min: 1, max: 1},
        unbox: true,
      })
    }
    if (def.compute) {
      if (!def.compute.field) def.compute.field = key
      values = computeField(values, def.compute)
    }
    if (def.permute) {
      if (!def.permute.field) def.permute.field = key
      values = permuteField(values, def.permute)
    }

    if (def.flag) {
      const {flag} = def
      const ignoreChecks = []
      if (flag.needs) {
        const needs = Array.isArray(flag.needs) ? flag.needs : [flag.needs]
        ignoreChecks.push(item => {
          if (!item[key]) return true
          return needs.every(field => !!item[field])
        })
      }
      if (flag.avoid) {
        const avoid = (Array.isArray(flag.avoid)
          ? flag.avoid
          : [flag.avoid]
        ).map(e => {
          if (typeof e === 'string') return item => !!item[e]
          if (typeof e === 'function') return e
          const keys = Object.keys(e)
          return item => {
            for (const key of keys) {
              if (item[key] !== e[key]) return false
            }
            return true
          }
        })
        ignoreChecks.push(item => {
          if (!item[key]) return true
          return !avoid.some(fn => !!fn(item))
        })
      }
      values = permuteField(values, {
        field: key,
        items: [false, true],
        amount: {min: 1, max: 1},
        unbox: true,
        ignore:
          ignoreChecks.length > 0
            ? item => ignoreChecks.every(fn => fn(item))
            : null,
      })
    }
    if (def.split) {
      if (!def.split.field) def.split.field = key
      values = splitField(values, def.split)
    }
  }
  return values
}

function splitField(values, {field, cases, match}) {
  const result = []
  const matcher = typeof match === 'string' ? item => item[match] : match
  for (const value of values) {
    const matchedCaseName = matcher(value)
    let currentCase = cases[matchedCaseName]
    if (!matchedCaseName || !cases[matchedCaseName]) {
      currentCase = cases.__
    }
    if (!currentCase) {
      result.push(value)
      continue
    }
    result.push(...byFields([value], {shape: {[field]: currentCase}}))
  }
  return result
}
function computeField(values, {field, fn}) {
  return values.map(val => ({...val, [field]: fn(val)}))
}
function permuteField(
  values,
  {field, items, amount: {min = 0, max = items.length - 1} = {}, ignore, unbox},
) {
  const results = []
  if (typeof items === 'function') {
    for (const value of values) {
      const valueItems = items(value)
      const combinations = selectFromNToM(valueItems, min, max)
      for (const combination of selectFromNToM(valueItems, min, max)) {
        results.push(
          ...values.map(val => ({
            ...val,
            [field]: unbox ? combination[0] : combination,
          })),
        )
      }
    }
  } else {
    const combinations = selectFromNToM(items, min, max)
    for (const combination of selectFromNToM(items, min, max)) {
      results.push(
        ...values.map(val => ({
          ...val,
          [field]: unbox ? combination[0] : combination,
        })),
      )
    }
  }
  if (ignore) return results.filter(ignore)
  return results
}
function selectFromNToM(items, from, to) {
  const result = []
  for (let i = from; i < Math.min(to + 1, items.length); i++) {
    result.push(...selectN(items, i))
  }
  return result
}
function selectN(items, n) {
  if (n === 0) return [[]]
  if (n === 1) return items.map(item => [item])
  const result = []
  for (let i = 0; i < items.length; i++) {
    const subItems = [...items]
    subItems.splice(i, 1)
    result.push(
      ...selectN(subItems, n - 1).map(nested => [items[i], ...nested]),
    )
  }
  return result
}
const arrayTargetCaseSet = generateCaseSet({
  groupBy: [],
  groupDescriptions: {
    fn: val => (val ? 'fn' : 'no fn'),
    combinable: val => (val ? 'combinable source' : 'plain source'),
  },
  ignore: [],
  shape: {
    combinable: boolField(),
    source: 'number',
    clock: 'any',
    variables: {
      number: 'numt',
      void: 'voidt',
      string: 'stringt',
      any: 'anyt',
    },
  },
  generateCases({source, clock, variables, combinable}) {
    if (combinable) {
      const failCases = {
        a: ['a_num', 'a_num_b_num', 'a_num_b_str'],
        ab: ['a_str', 'a_num_b_num'],
        tuple_a: ['l_str'],
        tuple_aa: ['l_num', 'l_str', 'l_num_num'],
      }
      const casesDefs = byFields([{clock: 'number'}], {
        shape: {
          source: {
            union: ['a', 'ab', 'tuple_a', 'tuple_aa'],
          },
          sourceType: {
            compute: {
              fn({source}) {
                switch (source) {
                  case 'tuple_a':
                  case 'tuple_aa':
                    return 'tuple'
                  case 'a':
                  case 'ab':
                  default:
                    return 'object'
                }
              },
            },
          },
          fn: {
            flag: {},
          },
          fnClock: {
            flag: {
              needs: 'fn',
            },
          },
          typedFn: {
            flag: {
              needs: 'fn',
            },
          },
          noFalsePositiveFnClock: {
            flag: {
              needs: ['fn', 'typedFn', 'fnClock'],
            },
          },
          noFalsePositiveFnSource: {
            flag: {
              needs: ['fn', 'typedFn'],
              avoid: ['noFalsePositiveFnClock'],
            },
          },
          fnWithoutArgs: {
            flag: {
              needs: ['fn'],
              avoid: [
                'fnClock',
                'typedFn',
                'noFalsePositiveFnClock',
                'noFalsePositiveFnSource',
              ],
            },
          },
          // clockFailedByAssert: {
          //   flag: {
          //     needs: ['fn', fnClock, 'typedFn', 'noFalsePositiveFnClock'],
          //     avoid: ['fnWithoutArgs'],
          //   },
          // },
          // clock: {
          //   permute: {
          //     // items:
          //   },
          // },
          fnText: {
            compute: {
              fn({
                source,
                sourceType,
                typedFn,
                fnClock,
                noFalsePositiveFnClock,
                noFalsePositiveFnSource,
                fnWithoutArgs,
              }) {
                if (sourceType === 'object') {
                  if (fnWithoutArgs) return "() => ({a: 2, b: ''})"
                  if (typedFn) {
                    if (fnClock) {
                      if (noFalsePositiveFnClock)
                        return '({a}: {a: number; b: string}, cl: string) => ({a, b: cl})'
                      if (noFalsePositiveFnSource)
                        return "({a, b}: {a: number; b: number}, cl: number) => ({a: b + cl, b: ''})"
                      return '({a, b}: {a: number; b: string}, cl: number) => ({a: a + cl, b})'
                    } else {
                      if (noFalsePositiveFnSource)
                        return "({b}: {a: number; b: number}) => ({a: b, b: ''})"
                      return '({a, b}: {a: number; b: string}) => ({a, b})'
                    }
                  } else {
                    return fnClock
                      ? '({a, b}, cl) => ({a: a + cl, b})'
                      : '({a, b}) => ({a, b})'
                  }
                } else {
                  if (fnWithoutArgs) return "() => ({a: 2, b: ''})"
                  switch (source) {
                    case 'tuple_a': {
                      if (typedFn) {
                        if (fnClock) {
                          if (noFalsePositiveFnClock)
                            return '([a]: [number], cl: string) => ({a, b: cl})'
                          if (noFalsePositiveFnSource)
                            return '([a]: [string], cl: number) => ({a: cl, b: a})'
                          return "([a]: [number], cl: number) => ({a: a + cl, b: ''})"
                        } else {
                          if (noFalsePositiveFnSource)
                            return '([a]: [string]) => ({a: 2, b: a})'
                          return "([a]: [number]) => ({a, b: ''})"
                        }
                      } else {
                        return fnClock
                          ? "([a], cl) => ({a: a + cl, b: ''})"
                          : "([a]) => ({a, b: ''})"
                      }
                    }
                    case 'tuple_aa': {
                      if (typedFn) {
                        if (fnClock) {
                          if (noFalsePositiveFnClock)
                            return '([a]: [number, string], cl: string) => ({a, b: cl})'
                          if (noFalsePositiveFnSource)
                            return "([a, b]: [number, number], cl: number) => ({a: b + cl, b: ''})"
                          return '([a, b]: [number, string], cl: number) => ({a: a + cl, b})'
                        } else {
                          if (noFalsePositiveFnSource)
                            return "([,b]: [number, number]) => ({a: b, b: ''})"
                          return '([a, b]: [number, string]) => ({a, b})'
                        }
                      } else {
                        return fnClock
                          ? '([a, b], cl) => ({a: a + cl, b})'
                          : '([a, b]) => ({a, b})'
                      }
                    }
                  }
                }
              },
            },
          },
          fnDescription: {
            compute: {
              fn({
                sourceType,
                typedFn,
                fnClock,
                noFalsePositiveFnClock,
                noFalsePositiveFnSource,
                fnWithoutArgs,
              }) {
                if (sourceType === 'object') {
                  if (fnWithoutArgs) return '() => ...'
                  if (typedFn) {
                    if (fnClock) {
                      if (noFalsePositiveFnClock)
                        return '(src, clk: wrong) => ...'
                      if (noFalsePositiveFnSource)
                        return '(src: wrong, clk) => ...'
                      return '(src: t, clk: t) => ...'
                    } else {
                      if (noFalsePositiveFnSource) return '(src: wrong) => ...'
                      return '(src: t) => ...'
                    }
                  } else {
                    return fnClock ? '(src, cl) => ...' : '(src) => ...'
                  }
                } else {
                  if (fnWithoutArgs) return '() => ...'
                  if (typedFn) {
                    if (fnClock) {
                      if (noFalsePositiveFnClock)
                        return '(src, clk: wrong) => ...'
                      if (noFalsePositiveFnSource)
                        return '(src: wrong, clk) => ...'
                      return '(src: t, clk: t) => ...'
                    } else {
                      if (noFalsePositiveFnSource) return '(src: wrong) => ...'
                      return '(src: t) => ...'
                    }
                  } else {
                    return fnClock ? '(src, cl) => ...' : '(src) => ...'
                  }
                }
              },
            },
          },
          sourceDescription: {
            compute: {
              fn({source}) {
                switch (source) {
                  case 'tuple_a':
                    return '[a]'
                  case 'tuple_aa':
                    return '[a,b]'
                  case 'a':
                    return '{a}'
                  case 'ab':
                    return '{a,b}'
                }
              },
            },
          },
          sourceCode: {
            compute: {
              fn({source}) {
                switch (source) {
                  case 'tuple_a':
                    return '[$num]'
                  case 'tuple_aa':
                    return '[$num, $str]'
                  case 'a':
                    return '{a: $num}'
                  case 'ab':
                    return '{a: $num, b: $str}'
                }
              },
            },
          },
          target: {
            split: {
              match: ({sourceType, fn}) =>
                fn || sourceType === 'object' ? 'object' : 'tuple',
              cases: {
                tuple: {
                  permute: {
                    items: ['l_num', 'l_str', 'l_num_str', 'l_num_num'],
                    amount: {min: 1, max: 2},
                  },
                },
                object: {
                  permute: {
                    items: ['a_num', 'a_str', 'a_num_b_num', 'a_num_b_str'],
                    amount: {min: 1, max: 2},
                  },
                },
              },
            },
          },
          pass: {
            compute: {
              fn({
                source,
                target,
                fn,
                noFalsePositiveFnSource,
                noFalsePositiveFnClock,
              }) {
                if (noFalsePositiveFnSource || noFalsePositiveFnClock)
                  return false
                if (fn) {
                  return failCases.ab.every(
                    failCase => !target.includes(failCase),
                  )
                }
                return failCases[source].every(
                  failCase => !target.includes(failCase),
                )
              },
            },
          },
        },
      })
      const casesDefsPending = [...casesDefs]
      const defsGroups = new Map()
      let cur
      while ((cur = casesDefsPending.pop())) {
        const hash = `${cur.sourceDescription} ${
          cur.fn ? cur.fnDescription : ''
        }`
        let set = defsGroups.get(hash)
        if (!set) {
          set = {itemsPass: [], itemsFail: [], description: ''}
          defsGroups.set(hash, set)
        }
        ;(cur.pass ? set.itemsPass : set.itemsFail).push(cur)
        const description = `source:${cur.sourceDescription}${
          cur.fn ? `, fn:${cur.fnDescription}` : ''
        }`
        set.description = description
      }
      const resultCases = []
      for (const {description, itemsPass, itemsFail} of defsGroups.values()) {
        if (itemsPass.length === 0 && itemsFail.length === 0) continue
        const testSuiteItems = []
        if (itemsPass.length > 0) {
          testSuiteItems.push(
            createTest(`${description} (should pass)`, [
              ...itemsPass.map(createTestLines).flat(),
              'expect(typecheck).toMatchInlineSnapshot()',
            ]),
          )
        }
        if (itemsFail.length > 0) {
          testSuiteItems.push(
            createTest(`${description} (should fail)`, [
              ...itemsFail.map(createTestLines).flat(),
              'expect(typecheck).toMatchInlineSnapshot()',
            ]),
          )
        }
        resultCases.push(createDescribe(description, testSuiteItems))
      }
      function createTestLines({
        sourceCode,
        sourceDescription,
        clock,
        target,
        pass,
        fn,
        fnText,
        fnDescription,
        fnClock,
        typedFn,
        noFalsePositiveFnClock,
        fnWithoutArgs,
      }) {
        const getText = item => variables[item] || item
        const printTargets = target.join(',')
        const sourceTargets = target.map(getText).join(', ')
        const methodCall = `sample({source: ${sourceCode}, clock: ${getText(
          clock,
        )}, ${fn ? `fn: ${fnText}, ` : ''}target: [${sourceTargets}]})`
        return [
          pass || methodCall.length > 76 ? null : '/*@ts-expect-error*/',
          methodCall,
        ]
      }
      // console.log(casesDefs)
      return {
        description: 'combinable',
        cases: resultCases,
        // casesDefs.map(
        //   ({
        //     sourceCode,
        //     sourceDescription,
        //     clock,
        //     target,
        //     pass,
        //     fn,
        //     fnText,
        //     fnDescription,
        //     fnClock,
        //     typedFn,
        //     noFalsePositiveFnClock,
        //     fnWithoutArgs,
        //   }) => {
        //     const getText = item => variables[item] || item
        //     const printTargets = target.join(',')
        //     const sourceTargets = target.map(getText).join(', ')
        //     const description = `sample({source:${sourceDescription}, ${
        //       fn ? `fn:${fnDescription}, ` : ''
        //     }target:[${printTargets}]}) (should ${pass ? 'pass' : 'fail'})`
        //     const methodCall = `sample({source: ${sourceCode}, clock: ${getText(
        //       clock,
        //     )}, ${fn ? `fn: ${fnText}, ` : ''}target: [${sourceTargets}]})`
        //     return createTest(description, [
        //       pass
        //         ? '//prettier-ignore'
        //         : '/*@ts-expect-error*/ //prettier-ignore',
        //       methodCall,
        //       'expect(typecheck).toMatchInlineSnapshot()',
        //     ])
        //   },
        // ),
      }
    }
    const pairs = [
      ['number', 'numberString', true],
      ['number', 'void', true],
      ['string', 'number', false],
      ['string', 'numberString', false],
      ['number', 'stringBoolean', false],
      ['string', 'void', false],
      ['string', 'any', false],
    ]
      .map(([a, b, pass]) => [
        {items: [a, b], pass},
        {items: [b, a], pass},
      ])
      .flat()
    const singleCases = [
      {items: ['number'], pass: true},
      {items: ['void'], pass: true},
      {items: ['string'], pass: false},
    ]
    return {
      description: 'basic cases',
      cases: [...singleCases, ...pairs].map(({items, pass}) => {
        const getText = item => variables[item] || item
        const printTargets = items.join(',')
        const sourceTargets = items.map(getText).join(', ')
        const description = `sample({source:${source},clock:${clock},target:[${printTargets}]}) (should ${
          pass ? 'pass' : 'fail'
        })`
        const methodCall = `sample({source: ${getText(
          source,
        )}, clock: ${getText(clock)}, target: [${sourceTargets}]})`
        return createTest(description, [
          pass ? null : '//@ts-expect-error',
          methodCall,
          'expect(typecheck).toMatchInlineSnapshot()',
        ])
      }),
    }
  },
})

writeTestSuite({
  file: 'arrayTargetGen',
  suite: arrayTargetCaseSet,
  usedMethods: ['createStore', 'createEvent', 'sample', 'combine'],
  header: `
const voidt = createEvent()
const anyt = createEvent<any>()
const stringt = createEvent<string>()
const numt = createEvent<number>()
const numberString = createEvent<number | string>()
const stringBoolean = createEvent<string | boolean>()
const $num = createStore<number>(0)
const $str = createStore<string>('')
const a_num = createEvent<{a: number}>()
const a_str = createEvent<{a: string}>()
const a_num_b_num = createEvent<{a: number; b: number}>()
const a_num_b_str = createEvent<{a: number; b: string}>()
const l_num = createEvent<[number]>()
const l_str = createEvent<[string]>()
const l_num_str = createEvent<[number, string]>()
const l_num_num = createEvent<[number, number]>()
`,
})

function boolField() {
  return {type: 'bool'}
}
function dependent(config) {
  if (typeof config === 'function') config = {fn: config, resultType: 'plain'}
  return {
    type: 'dependent',
    fn: config.fn,
    resultType: config.resultType || 'plain',
  }
}
function groupBy(field, descriptionFn) {
  return {type: 'groupBy', field, descriptionFn}
}

function generateCaseSet({
  groupBy = [],
  ignore = [],
  groupDescriptions = {},
  shape,
  generateCases,
}) {
  groupBy = groupBy.map(val => (typeof val === 'string' ? {field: val} : val))
  const groupByFields = groupBy.map(({field}) => field)
  const valueSet = {}
  const plainShape = {}
  const generationSeq = []
  for (const fieldName in shape) {
    const field = shape[fieldName]
    if (field && field.type) {
      switch (field.type) {
        case 'bool': {
          valueSet[fieldName] = [false, true]
          break
        }
        case 'dependent': {
          generationSeq.push(shape => ({
            ...shape,
            [fieldName]: field.fn(shape),
          }))
          break
        }
      }
    } else {
      plainShape[fieldName] = shape[fieldName]
    }
  }
  let results = [{...plainShape}]
  for (const field in valueSet) {
    const newResults = []
    for (const value of valueSet[field]) {
      newResults.push(...results.map(val => ({...val, [field]: value})))
    }
    results = newResults
  }

  const resultsFlat = results
    .map(item => {
      item = generationSeq.reduce((item, fn) => fn(item), item)
      return item
    })
    .filter(item => {
      if (ignore.length === 0) return true
      return ignore.every(fn => !fn(item))
    })
  const testSuite = []
  for (const resultItem of resultsFlat) {
    const groupValues = groupBy.map(({field}) => ({
      field,
      value: resultItem[field],
    }))
    if (groupValues.length === 0) {
      testSuite.push({type: 'item', value: resultItem})
    } else {
      let currentParent = testSuite
      for (let i = 0; i < groupValues.length; i++) {
        const {field, value} = groupValues[i]
        let newParent = currentParent.find(
          e => e.type === 'group' && e.name === field && e.value === value,
        )
        if (!newParent) {
          newParent = {
            type: 'group',
            name: field,
            value,
            child: [],
          }
          currentParent.push(newParent)
        }
        currentParent = newParent.child
        if (i === groupValues.length - 1) {
          currentParent.push({type: 'item', value: resultItem})
        }
      }
    }
  }
  const testSuiteText = iterateSuite(testSuite).join(`\n`)
  return testSuiteText
  function iterateSuite(suite) {
    const results = []
    for (const item of suite) {
      switch (item.type) {
        case 'item': {
          const generated = generateCases(item.value)
          if (Array.isArray(generated)) {
            for (const {description, cases} of generated) {
              if (cases.length > 0)
                results.push(
                  wrapText(`describe('${description}', () => {`, [...cases]),
                )
            }
          } else if (generated) {
            const {description, cases} = generated
            if (cases.length > 0)
              results.push(
                wrapText(`describe('${description}', () => {`, [...cases]),
              )
          }
          break
        }
        case 'group': {
          const descriptionFn = groupDescriptions[item.name]
          let description = `${item.name}: ${item.value}`
          if (descriptionFn) description = descriptionFn(item.value)
          if (item.child.length === 0) continue
          results.push(
            wrapText(
              `describe('${description}', () => {`,
              iterateSuite(item.child),
            ),
          )
          break
        }
      }
    }
    return results
  }
}

async function writeTestSuite({file, suite, usedMethods = [], header = ''}) {
  const content = `/* eslint-disable no-unused-vars */
import {${usedMethods.join(', ')}} from 'effector'
const typecheck = '{global}'

${header.trim()}

${suite}`

  const srcRoot = resolve(
    __dirname,
    '..',
    '__tests__',
    'effector',
    'sample',
    'generated',
  )
  const fullFileName = resolve(srcRoot, `${file}.test.ts`)
  await promises.writeFile(fullFileName, content)
}
