"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parseString } from "@/lib/clr-parser"
import { motion, AnimatePresence } from "framer-motion"

interface StringValidatorProps {
  grammar: any
  parsingTable: any
}

export function StringValidator({ grammar, parsingTable }: StringValidatorProps) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<{ isValid: boolean; steps: string[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleValidate = () => {
    setIsLoading(true)
    try {
      const validationResult = parseString(grammar, parsingTable, input)
      setResult(validationResult)
    } catch (error) {
      setResult({
        isValid: false,
        steps: [`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`],
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>String Validator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter string to validate (space-separated tokens)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            />
            <Button onClick={handleValidate} disabled={isLoading}>
              {isLoading ? "Validating..." : "Validate"}
            </Button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                <div
                  className={`p-4 rounded-lg ${
                    result.isValid ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"
                  }`}
                >
                  <p className={`font-medium ${result.isValid ? "text-green-600" : "text-red-600"}`}>
                    {result.isValid ? "String is valid!" : "String is invalid"}
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium">Parsing Steps:</h3>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {result.steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-2 rounded ${
                          step.includes("Error")
                            ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                            : "bg-muted"
                        }`}
                      >
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
} 