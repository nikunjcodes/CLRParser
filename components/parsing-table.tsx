"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface ParsingTableProps {
  parsingTable: {
    actions: Record<string, Record<string, string>>
    gotos: Record<string, Record<string, string>>
    terminals?: string[]
    nonTerminals?: string[]
    states?: number[]
  }
}

export function ParsingTable({ parsingTable }: ParsingTableProps) {
  const { actions, gotos, terminals = [], nonTerminals = [], states = [] } = parsingTable

  if (Object.keys(actions).length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          Generate a CLR parser to see the parsing table
        </CardContent>
      </Card>
    )
  }

  // Animation variants for table cells
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  }

  return (
    <div className="overflow-x-auto">
      <motion.div initial="hidden" animate="show" variants={container}>
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold border bg-muted/50" rowSpan={2}>
                State
              </TableHead>
              <TableHead
                className="font-bold border text-center bg-blue-50 dark:bg-blue-950/30"
                colSpan={terminals.length}
              >
                Action
              </TableHead>
              <TableHead
                className="font-bold border text-center bg-indigo-50 dark:bg-indigo-950/30"
                colSpan={nonTerminals.length}
              >
                Goto
              </TableHead>
            </TableRow>
            <TableRow>
              {/* Action columns (terminals) */}
              {terminals.map((terminal) => (
                <TableHead key={terminal} className="font-bold border text-center bg-blue-50/50 dark:bg-blue-950/20">
                  <motion.div variants={item} className="font-mono">
                    {terminal}
                  </motion.div>
                </TableHead>
              ))}
              {/* Goto columns (non-terminals) */}
              {nonTerminals.map((nonTerminal) => (
                <TableHead
                  key={nonTerminal}
                  className="font-bold border text-center bg-indigo-50/50 dark:bg-indigo-950/20"
                >
                  <motion.div variants={item} className="font-mono">
                    {nonTerminal}
                  </motion.div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {states.map((state) => (
              <TableRow key={state} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium border bg-muted/20">
                  <motion.div variants={item} className="font-mono">
                    {state}
                  </motion.div>
                </TableCell>
                {/* Action cells */}
                {terminals.map((terminal) => (
                  <TableCell key={`${state}-${terminal}`} className="border text-center">
                    <motion.div
                      variants={item}
                      className={`font-mono ${
                        actions[state] && actions[state][terminal] && actions[state][terminal].startsWith("s")
                          ? "text-blue-600 dark:text-blue-400"
                          : actions[state] && actions[state][terminal] && actions[state][terminal].startsWith("r")
                            ? "text-green-600 dark:text-green-400"
                            : actions[state] && actions[state][terminal] === "acc"
                              ? "text-purple-600 dark:text-purple-400"
                              : ""
                      }`}
                    >
                      {actions[state] && actions[state][terminal] ? actions[state][terminal] : ""}
                    </motion.div>
                  </TableCell>
                ))}
                {/* Goto cells */}
                {nonTerminals.map((nonTerminal) => (
                  <TableCell key={`${state}-${nonTerminal}`} className="border text-center">
                    <motion.div variants={item} className="font-mono">
                      {gotos[state] && gotos[state][nonTerminal] ? gotos[state][nonTerminal] : ""}
                    </motion.div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <div className="mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
          <span>
            Shift actions (s<em>n</em>)
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
          <span>
            Reduce actions (r<em>n</em>)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
          <span>Accept action (acc)</span>
        </div>
      </div>
    </div>
  )
}

