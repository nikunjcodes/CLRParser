"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface GrammarInputProps {
  grammar: string
  setGrammar: (grammar: string) => void
}

export function GrammarInput({ grammar, setGrammar }: GrammarInputProps) {
  // Parse existing grammar if any
  const parseExistingGrammar = () => {
    if (!grammar) return []

    const rules: { lhs: string; rhs: string }[] = []
    const lines = grammar.trim().split("\n")

    for (const line of lines) {
      const match = line.match(/^\s*([A-Z][A-Za-z0-9]*)\s*->\s*(.+)\s*$/)
      if (match) {
        const [, lhs, rhs] = match
        rules.push({ lhs, rhs: rhs.trim() })
      }
    }

    return rules
  }

  const [rules, setRules] = useState<{ lhs: string; rhs: string }[]>(
    parseExistingGrammar().length > 0 ? parseExistingGrammar() : [{ lhs: "S", rhs: "" }],
  )

  // Add effect to update rules when grammar prop changes
  useEffect(() => {
    const parsedRules = parseExistingGrammar()
    if (parsedRules.length > 0) {
      setRules(parsedRules)
    }
  }, [grammar])

  const addRule = () => {
    setRules([...rules, { lhs: "", rhs: "" }])
  }

  const removeRule = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    setRules(newRules)
    updateGrammar(newRules)
  }

  const updateRule = (index: number, field: "lhs" | "rhs", value: string) => {
    const newRules = [...rules]
    newRules[index][field] = value
    setRules(newRules)
    updateGrammar(newRules)
  }

  const updateGrammar = (currentRules: { lhs: string; rhs: string }[]) => {
    const grammarText = currentRules
      .filter((rule) => rule.lhs.trim() !== "")
      .map((rule) => `${rule.lhs} -> ${rule.rhs}`)
      .join("\n")

    setGrammar(grammarText)
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2 border-muted">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 text-base">Left-Hand Side (LHS)</TableHead>
                <TableHead className="w-[50px] text-center"></TableHead>
                <TableHead className="w-2/3 text-base">Right-Hand Side (RHS)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {rules.map((rule, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b"
                  >
                    <TableCell>
                      <Input
                        value={rule.lhs}
                        onChange={(e) => updateRule(index, "lhs", e.target.value)}
                        placeholder="Non-terminal (e.g., S)"
                        className="font-mono transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={rule.rhs}
                        onChange={(e) => updateRule(index, "rhs", e.target.value)}
                        placeholder="Symbols (e.g., a A b)"
                        className="font-mono transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(index)}
                        disabled={rules.length <= 1}
                        className="transition-all hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" size="sm" className="mt-4 transition-all duration-200" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add Production Rule
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg animate-slide-up">
        <p className="font-medium mb-2">Format guide:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>LHS must be a single non-terminal symbol (uppercase letter)</li>
          <li>RHS can contain terminals (lowercase) and non-terminals (uppercase)</li>
          <li>Separate symbols with spaces (e.g., "a A b")</li>
          <li>Use "ε" or leave empty for epsilon productions</li>
        </ul>
      </div>
    </div>
  )
}

