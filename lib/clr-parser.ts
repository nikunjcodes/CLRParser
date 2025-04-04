interface Production {
  lhs: string
  rhs: string[]
  id: number
}

interface Grammar {
  productions: Production[]
  terminals: string[]
  nonTerminals: string[]
  startSymbol: string
}

interface Item {
  production: Production
  dotPosition: number
  lookahead: string[]
}

interface State {
  id: number
  items: Item[]
  kernel?: Item[]
}

export function parseGrammar(input: string): Grammar {
  const lines = input.trim().split("\n")
  const productions: Production[] = []
  const terminals = new Set<string>()
  const nonTerminals = new Set<string>()

  if (lines.length === 0) {
    throw new Error("Grammar cannot be empty")
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^\s*([A-Z][A-Za-z0-9]*)\s*->\s*(.+)\s*$/)
    if (!match) {
      throw new Error(`Invalid production format: ${line}`)
    }

    const [, lhs, rhsStr] = match
    nonTerminals.add(lhs)

    const rhs = rhsStr.trim() === "ε" || rhsStr.trim() === "" ? ["ε"] : rhsStr.trim().split(/\s+/)

    for (const symbol of rhs) {
      if (symbol === "ε") {
        continue
      } else if (/^[a-z0-9]+$/.test(symbol)) {
        terminals.add(symbol)
      } else if (/^[A-Z][A-Za-z0-9]*$/.test(symbol)) {
        nonTerminals.add(symbol)
      } else if (symbol !== "") {
        throw new Error(`Invalid symbol in production: ${symbol}`)
      }
    }

    productions.push({ lhs, rhs: rhs.length === 1 && rhs[0] === "ε" ? [] : rhs, id: i + 1 })
  }

  terminals.add("$")  
  const startSymbol = productions[0].lhs
  const augmentedStartSymbol = `${startSymbol}'`
  productions.unshift({
    lhs: augmentedStartSymbol,
    rhs: [startSymbol],
    id: 0,
  })
  nonTerminals.add(augmentedStartSymbol)

  return {
    productions,
    terminals: Array.from(terminals),
    nonTerminals: Array.from(nonTerminals),
    startSymbol: augmentedStartSymbol,
  }
}

function itemsEqual(item1: Item, item2: Item): boolean {
  return (
    item1.production.lhs === item2.production.lhs &&
    item1.production.rhs.join(" ") === item2.production.rhs.join(" ") &&
    item1.dotPosition === item2.dotPosition &&
    arraysEqual(item1.lookahead, item2.lookahead)
  )
}

function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false
  const set1 = new Set(arr1)
  return arr2.every((item) => set1.has(item))
}

function computeFirst(grammar: Grammar, symbols: string[]): Set<string> {
  const first = new Set<string>()

  if (symbols.length === 0) {
    first.add("ε")
    return first
  }

  const firstSymbol = symbols[0]

  if (grammar.terminals.includes(firstSymbol)) {
    first.add(firstSymbol)
    return first
  }

  for (const production of grammar.productions) {
    if (production.lhs === firstSymbol) {
      if (production.rhs.length === 0 || production.rhs[0] === "ε") {
        first.add("ε")
        if (symbols.length > 1) {
          const restFirst = computeFirst(grammar, symbols.slice(1))
          restFirst.forEach((symbol) => first.add(symbol))
        }
      } else {
        const rhsFirst = computeFirst(grammar, production.rhs)
        rhsFirst.forEach((symbol) => {
          if (symbol !== "ε") {
            first.add(symbol)
          }
        })

        if (rhsFirst.has("ε") && symbols.length > 1) {
          const restFirst = computeFirst(grammar, symbols.slice(1))
          restFirst.forEach((symbol) => first.add(symbol))
        } 
      }
    }
  }

  return first
}

function closure(grammar: Grammar, items: Item[]): Item[] {
  const result: Item[] = [...items]
  let changed = true

  while (changed) {
    changed = false
    for (let i = 0; i < result.length; i++) {
      const item = result[i]

      if (item.dotPosition < item.production.rhs.length) {
        const symbolAfterDot = item.production.rhs[item.dotPosition]

        if (grammar.nonTerminals.includes(symbolAfterDot)) {
          const beta = item.production.rhs.slice(item.dotPosition + 1)
          const lookaheadSymbols = [...beta, ...item.lookahead]
          const firstSet = computeFirst(grammar, lookaheadSymbols)
          firstSet.delete("ε")
          for (const production of grammar.productions) {
            if (production.lhs === symbolAfterDot) {
              for (const lookahead of firstSet) {
                const newItem: Item = {
                  production,
                  dotPosition: 0,
                  lookahead: [lookahead],
                }
                if (!result.some((item) => itemsEqual(item, newItem))) {
                  result.push(newItem)
                  changed = true
                }
              }
            }
          }
        }
      }
    }
  }

  return result
}

function goto(grammar: Grammar, items: Item[], symbol: string): Item[] {
  const result: Item[] = []

  for (const item of items) {
    if (item.dotPosition < item.production.rhs.length && item.production.rhs[item.dotPosition] === symbol) {
      result.push({
        production: item.production,
        dotPosition: item.dotPosition + 1,
        lookahead: item.lookahead,
      })
    }
  }

  return closure(grammar, result)
}

export function generateClrItems(grammar: Grammar): State[] {
  const states: State[] = []
  const stateMap = new Map<string, number>()

  const initialItem: Item = {
    production: grammar.productions[0],
    dotPosition: 0,
    lookahead: ["$"],
  }

  const initialClosure = closure(grammar, [initialItem])
  states.push({
    id: 0,
    items: initialClosure,
    kernel: [initialItem],
  })

  const getStateSignature = (items: Item[]): string => {
    return items
      .map((item) => {
        const { lhs, rhs } = item.production
        const rhsCopy = [...rhs]
        rhsCopy.splice(item.dotPosition, 0, "•")
        return `${lhs}->${rhsCopy.join(" ")},${item.lookahead.join("/")}`
      })
      .sort()
      .join("|")
  }

  stateMap.set(getStateSignature(initialClosure), 0)

  let i = 0
  while (i < states.length) {
    const state = states[i]

    const symbols = new Set<string>()
    for (const item of state.items) {
      if (item.dotPosition < item.production.rhs.length) {
        symbols.add(item.production.rhs[item.dotPosition])
      }
    }

    for (const symbol of symbols) {
      const gotoItems = goto(grammar, state.items, symbol)

      if (gotoItems.length > 0) {
        const signature = getStateSignature(gotoItems)

        if (!stateMap.has(signature)) {
          const newStateId = states.length
          states.push({
            id: newStateId,
            items: gotoItems,
            kernel: gotoItems.filter((item) => {
              return state.items.some(
                (stateItem) =>
                  stateItem.dotPosition < stateItem.production.rhs.length &&
                  stateItem.production.rhs[stateItem.dotPosition] === symbol &&
                  stateItem.production.lhs === item.production.lhs &&
                  stateItem.production.rhs.join(" ") === item.production.rhs.join(" ") &&
                  item.dotPosition === stateItem.dotPosition + 1,
              )
            }),
          })
          stateMap.set(signature, newStateId)
        }
      }
    }

    i++
  }

  return states
}

export function generateDfa(states: State[], grammar: Grammar) {
  const nodes = states.map((state) => ({
    id: state.id,
    label: state.items
      .map((item) => {
        const { lhs, rhs } = item.production
        const rhsCopy = [...rhs]
        rhsCopy.splice(item.dotPosition, 0, "•")
        return `${lhs} -> ${rhsCopy.join(" ")}, ${item.lookahead.join("/")}`
      })
      .join("\n"),
  }))

  const edges: { source: number; target: number; label: string }[] = []

  for (const state of states) {
    const symbols = new Set<string>()
    for (const item of state.items) {
      if (item.dotPosition < item.production.rhs.length) {
        symbols.add(item.production.rhs[item.dotPosition])
      }
    }

    for (const symbol of symbols) {
      const gotoItems = goto(grammar, state.items, symbol)

      if (gotoItems.length > 0) {
        for (const targetState of states) {
          if (
            gotoItems.length === targetState.items.length &&
            gotoItems.every((item) => targetState.items.some((targetItem) => itemsEqual(item, targetItem)))
          ) {
            edges.push({
              source: state.id,
              target: targetState.id,
              label: symbol,
            })
            break
          }
        }
      }
    }
  }

  return { nodes, edges }
}

export function generateParsingTable(states: State[], dfa: any, grammar: Grammar) {
  const actions: Record<string, Record<string, string>> = {}
  const gotos: Record<string, Record<string, string>> = {}

  for (const state of states) {
    actions[state.id] = {}
    gotos[state.id] = {}
  }

  for (const edge of dfa.edges) {
    const { source, target, label } = edge

    if (grammar.terminals.includes(label)) {
      actions[source][label] = `s${target}`
    } else if (grammar.nonTerminals.includes(label)) {
      gotos[source][label] = target.toString()
    }
  }

  for (const state of states) {
    for (const item of state.items) {
      if (item.dotPosition === item.production.rhs.length) {
        if (item.production.lhs === grammar.startSymbol && item.lookahead.includes("$")) {
          actions[state.id]["$"] = "acc"
        } else {
          for (const lookahead of item.lookahead) {
            if (!actions[state.id][lookahead] || !actions[state.id][lookahead].startsWith("s")) {
              actions[state.id][lookahead] = `r${item.production.id}`
            }
          }
        }
      }
    }
  }

  return {
    actions,
    gotos,
    terminals: grammar.terminals,
    nonTerminals: grammar.nonTerminals.filter((nt) => nt !== grammar.startSymbol),
    states: states.map((s) => s.id),
  }
}

export function parseString(grammar: Grammar, parsingTable: any, input: string): { isValid: boolean; steps: string[] } {
  const steps: string[] = []
  const stack: (string | number)[] = [0]
  const tokens = [...input.split(/\s+/), "$"]
  let pointer = 0

  while (true) {
    const currentState = stack[stack.length - 1] as number
    const currentToken = tokens[pointer]
    const action = parsingTable.actions[currentState]?.[currentToken]

    if (!action) {
      steps.push(`Error: No action found for state ${currentState} and token ${currentToken}`)
      return { isValid: false, steps }
    }

    if (action === "acc") {
      steps.push("String accepted!")
      return { isValid: true, steps }
    }

    if (action.startsWith("s")) {
      // Shift action
      const nextState = parseInt(action.substring(1))
      stack.push(currentToken, nextState)
      steps.push(`Shift: ${currentToken} and go to state ${nextState}`)
      pointer++
    } else if (action.startsWith("r")) {
      // Reduce action
      const productionId = parseInt(action.substring(1))
      const production = grammar.productions[productionId]
      const popCount = production.rhs.length * 2 // Each symbol and state
      
      if (popCount > stack.length) {
        steps.push(`Error: Stack underflow during reduction`)
        return { isValid: false, steps }
      }

      stack.splice(-popCount)
      const newState = stack[stack.length - 1] as number
      const gotoState = parsingTable.gotos[newState]?.[production.lhs]

      if (!gotoState) {
        steps.push(`Error: No goto state found for ${production.lhs} in state ${newState}`)
        return { isValid: false, steps }
      }

      stack.push(production.lhs, parseInt(gotoState))
      steps.push(`Reduce: ${production.lhs} -> ${production.rhs.join(" ")} and go to state ${gotoState}`)
    }
  }
}


