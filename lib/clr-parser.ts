// Grammar types
interface Production {
  lhs: string
  rhs: string[]
  id: number // Production ID for reduce actions
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
  kernel?: Item[] // For display purposes
}

// Parse the grammar from string input
export function parseGrammar(input: string): Grammar {
  const lines = input.trim().split("\n")
  const productions: Production[] = []
  const terminals = new Set<string>()
  const nonTerminals = new Set<string>()

  if (lines.length === 0) {
    throw new Error("Grammar cannot be empty")
  }

  // Parse each production line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^\s*([A-Z][A-Za-z0-9]*)\s*->\s*(.+)\s*$/)
    if (!match) {
      throw new Error(`Invalid production format: ${line}`)
    }

    const [, lhs, rhsStr] = match
    nonTerminals.add(lhs)

    // Split the RHS by spaces and handle empty productions
    const rhs = rhsStr.trim() === "ε" || rhsStr.trim() === "" ? ["ε"] : rhsStr.trim().split(/\s+/)

    // Identify terminals and non-terminals
    for (const symbol of rhs) {
      if (symbol === "ε") {
        // Epsilon is a special case
        continue
      } else if (/^[a-z0-9]+$/.test(symbol)) {
        terminals.add(symbol)
      } else if (/^[A-Z][A-Za-z0-9]*$/.test(symbol)) {
        nonTerminals.add(symbol)
      } else if (symbol !== "") {
        throw new Error(`Invalid symbol in production: ${symbol}`)
      }
    }

    productions.push({ lhs, rhs: rhs === ["ε"] ? [] : rhs, id: i + 1 })
  }

  // Add the end marker as a terminal
  terminals.add("$")

  // The start symbol is the LHS of the first production
  const startSymbol = productions[0].lhs

  // Add augmented production S' -> S
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

// Helper function to check if two items are equal
function itemsEqual(item1: Item, item2: Item): boolean {
  return (
    item1.production.lhs === item2.production.lhs &&
    item1.production.rhs.join(" ") === item2.production.rhs.join(" ") &&
    item1.dotPosition === item2.dotPosition &&
    arraysEqual(item1.lookahead, item2.lookahead)
  )
}

// Helper function to check if two arrays are equal
function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false
  const set1 = new Set(arr1)
  return arr2.every((item) => set1.has(item))
}

// Helper function to compute FIRST set for a symbol or sequence
function computeFirst(grammar: Grammar, symbols: string[]): Set<string> {
  const first = new Set<string>()

  if (symbols.length === 0) {
    first.add("ε")
    return first
  }

  const firstSymbol = symbols[0]

  // If it's a terminal, FIRST is just the terminal itself
  if (grammar.terminals.includes(firstSymbol)) {
    first.add(firstSymbol)
    return first
  }

  // If it's a non-terminal, compute FIRST for all its productions
  for (const production of grammar.productions) {
    if (production.lhs === firstSymbol) {
      // If it's an epsilon production, add epsilon and check next symbol
      if (production.rhs.length === 0 || production.rhs[0] === "ε") {
        first.add("ε")

        // If there are more symbols, compute FIRST for the rest
        if (symbols.length > 1) {
          const restFirst = computeFirst(grammar, symbols.slice(1))
          restFirst.forEach((symbol) => first.add(symbol))
        }
      } else {
        // Compute FIRST for the RHS
        const rhsFirst = computeFirst(grammar, production.rhs)
        rhsFirst.forEach((symbol) => {
          if (symbol !== "ε") {
            first.add(symbol)
          }
        })

        // If RHS can derive epsilon, compute FIRST for the rest
        if (rhsFirst.has("ε") && symbols.length > 1) {
          const restFirst = computeFirst(grammar, symbols.slice(1))
          restFirst.forEach((symbol) => first.add(symbol))
        }
      }
    }
  }

  return first
}

// Compute closure of a set of LR(1) items
function closure(grammar: Grammar, items: Item[]): Item[] {
  const result: Item[] = [...items]
  let changed = true

  while (changed) {
    changed = false

    for (let i = 0; i < result.length; i++) {
      const item = result[i]

      // If dot is before a non-terminal
      if (item.dotPosition < item.production.rhs.length) {
        const symbolAfterDot = item.production.rhs[item.dotPosition]

        if (grammar.nonTerminals.includes(symbolAfterDot)) {
          // Compute FIRST for the rest of the string followed by lookahead
          const beta = item.production.rhs.slice(item.dotPosition + 1)
          const lookaheadSymbols = [...beta, ...item.lookahead]
          const firstSet = computeFirst(grammar, lookaheadSymbols)

          // Remove epsilon from FIRST set
          firstSet.delete("ε")

          // Add items for all productions with the non-terminal on the LHS
          for (const production of grammar.productions) {
            if (production.lhs === symbolAfterDot) {
              for (const lookahead of firstSet) {
                const newItem: Item = {
                  production,
                  dotPosition: 0,
                  lookahead: [lookahead],
                }

                // Check if the item is already in the result
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

// Compute GOTO for a set of LR(1) items and a grammar symbol
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

// Generate CLR(1) items
export function generateClrItems(grammar: Grammar): State[] {
  const states: State[] = []
  const stateMap = new Map<string, number>() // Map state signature to state ID

  // Create initial state (I0)
  const initialItem: Item = {
    production: grammar.productions[0], // S' -> S
    dotPosition: 0,
    lookahead: ["$"],
  }

  const initialClosure = closure(grammar, [initialItem])
  states.push({
    id: 0,
    items: initialClosure,
    kernel: [initialItem],
  })

  // Function to get a signature for a set of items
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

  // Process states until no new states are added
  let i = 0
  while (i < states.length) {
    const state = states[i]

    // Get all symbols after the dot
    const symbols = new Set<string>()
    for (const item of state.items) {
      if (item.dotPosition < item.production.rhs.length) {
        symbols.add(item.production.rhs[item.dotPosition])
      }
    }

    // For each symbol, compute GOTO and add new state if needed
    for (const symbol of symbols) {
      const gotoItems = goto(grammar, state.items, symbol)

      if (gotoItems.length > 0) {
        const signature = getStateSignature(gotoItems)

        if (!stateMap.has(signature)) {
          // Create a new state
          const newStateId = states.length
          states.push({
            id: newStateId,
            items: gotoItems,
            kernel: gotoItems.filter((item) => {
              // Find items that came from advancing the dot
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

// Generate DFA from CLR items
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

  // For each state, compute transitions
  for (const state of states) {
    // Get all symbols after the dot
    const symbols = new Set<string>()
    for (const item of state.items) {
      if (item.dotPosition < item.production.rhs.length) {
        symbols.add(item.production.rhs[item.dotPosition])
      }
    }

    // For each symbol, compute GOTO
    for (const symbol of symbols) {
      const gotoItems = goto(grammar, state.items, symbol)

      if (gotoItems.length > 0) {
        // Find the state ID for these items
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

// Generate CLR parsing table
export function generateParsingTable(states: State[], dfa: any, grammar: Grammar) {
  const actions: Record<string, Record<string, string>> = {}
  const gotos: Record<string, Record<string, string>> = {}

  // Initialize tables
  for (const state of states) {
    actions[state.id] = {}
    gotos[state.id] = {}
  }

  // Add shift actions based on DFA edges
  for (const edge of dfa.edges) {
    const { source, target, label } = edge

    if (grammar.terminals.includes(label)) {
      // Shift action for terminals
      actions[source][label] = `s${target}`
    } else if (grammar.nonTerminals.includes(label)) {
      // Goto action for non-terminals
      gotos[source][label] = target.toString()
    }
  }

  // Add reduce and accept actions based on items
  for (const state of states) {
    for (const item of state.items) {
      // If dot is at the end of production
      if (item.dotPosition === item.production.rhs.length) {
        // Accept action for augmented production
        if (item.production.lhs === grammar.startSymbol && item.lookahead.includes("$")) {
          actions[state.id]["$"] = "acc"
        } else {
          // Reduce action
          for (const lookahead of item.lookahead) {
            // Don't override shift actions (shift-reduce conflict resolution)
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

