"use client"

import { useState } from "react"
import { GrammarInput } from "@/components/grammar-input"
import { ParsingTable } from "@/components/parsing-table"
import { DfaVisualization } from "@/components/dfa-visualization"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { parseGrammar, generateClrItems, generateDfa, generateParsingTable } from "@/lib/clr-parser"
import { AlertCircle, BookOpen, Info, Code, Database, Activity } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"

export default function Home() {
  const [grammar, setGrammar] = useState<string>("")
  const [items, setItems] = useState<any[]>([])
  const [dfa, setDfa] = useState<any>({ nodes: [], edges: [] })
  const [parsingTable, setParsingTable] = useState<any>({ actions: {}, gotos: {} })
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("input")
  const [parsedGrammar, setParsedGrammar] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleParseGrammar = async () => {
    try {
      setError(null)
      setIsGenerating(true)

      if (!grammar.trim()) {
        setError("Please enter a grammar before generating the parser")
        setIsGenerating(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 600))

      const grammarObj = parseGrammar(grammar)
      setParsedGrammar(grammarObj)

      const clrItems = generateClrItems(grammarObj)
      setItems(clrItems)

      const dfaResult = generateDfa(clrItems, grammarObj)
      setDfa(dfaResult)

      const table = generateParsingTable(clrItems, dfaResult, grammarObj)
      setParsingTable(table)

      setActiveTab("dfa")
      setIsGenerating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while parsing the grammar")
      setIsGenerating(false)
    }
  }

  const handleExampleGrammar = async () => {
    const exampleGrammar = "S -> A A\nA -> a A\nA -> b"
    setGrammar(exampleGrammar)
    
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    await handleParseGrammar()
  }

  return (
    <main className="min-h-screen">
      <div className="bg-background py-20 mb-8 relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 font-mono"
            >
              <span className="text-sm font-medium tracking-tight">Compiler Design Tool</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mb-6 font-mono text-primary"
            >
              CLR Parser Generator
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl text-muted-foreground mb-8 leading-relaxed font-mono"
            >
              Generate CLR(1) parsing tables and visualize DFA from context-free grammars. 
              A powerful tool for compiler design and language processing.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-mono"
            >
              <div className="flex items-center gap-2 group">
                <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="group-hover:text-green-500 transition-colors duration-200">Real-time Visualization</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="group-hover:text-blue-500 transition-colors duration-200">Interactive DFA</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="group-hover:text-purple-500 transition-colors duration-200">Detailed Parsing Table</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger
              value="input"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Code className="mr-2 h-4 w-4" />
              Grammar Input
            </TabsTrigger>
            <TabsTrigger
              value="dfa"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Database className="mr-2 h-4 w-4" />
              DFA Visualization
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Activity className="mr-2 h-4 w-4" />
              Parsing Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="animate-fade-in">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-2xl">Enter Grammar</CardTitle>
                <CardDescription>
                  Enter your context-free grammar using the production rules table below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GrammarInput grammar={grammar} setGrammar={setGrammar} />

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleParseGrammar}
                    disabled={isGenerating}
                    className="relative overflow-hidden group"
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-pulse">Generating Parser...</span>
                      </>
                    ) : (
                      <>
                        Generate CLR Parser
                        <span className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExampleGrammar}
                    className="transition-all duration-200 hover:bg-secondary"
                  >
                    Load Example
                  </Button>
                </div>

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    The first production rule is considered the start symbol. Use &quot;ε&quot; or leave empty for
                    epsilon productions.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dfa" className="animate-fade-in">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-2xl">DFA Visualization</CardTitle>
                <CardDescription>
                  Visual representation of the Deterministic Finite Automaton for the CLR(1) parser
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <DfaVisualization dfa={dfa} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="animate-fade-in">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-2xl">CLR(1) Parsing Table</CardTitle>
                <CardDescription>The generated parsing table with action and goto functions</CardDescription>
              </CardHeader>
              <CardContent>
                <ParsingTable parsingTable={parsingTable} grammar={parsedGrammar} />

                {parsedGrammar && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-6 border-t pt-4"
                  >
                    <h3 className="text-lg font-medium mb-2">Production Rules</h3>
                    <div className="grid gap-1">
                      {parsedGrammar.productions.map((prod: any, index: number) => (
                        <div key={index} className="font-mono text-sm">
                          {index}: {prod.lhs} → {prod.rhs.length > 0 ? prod.rhs.join(" ") : "ε"}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              <CardTitle>About CLR Parsing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                CLR (Canonical LR) parsing is a powerful bottom-up parsing technique that uses the canonical collection
                of LR(1) items to build the parsing table.
              </p>
              <p className="mb-2">The steps involved in CLR(1) parsing are:</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Write a context-free grammar for the input string</li>
                <li>Check the ambiguity of the grammar</li>
                <li>Add augment production to the grammar</li>
                <li>Create canonical collection of LR(1) items</li>
                <li>Draw a data flow diagram (DFA)</li>
                <li>Construct a CLR(1) parsing table</li>
              </ol>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Understanding the Parsing Table</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Action Table:</strong> Determines what action to take for each state and terminal
                  </li>
                  <li>
                    <strong>
                      s<em>n</em>:
                    </strong>{" "}
                    Shift and go to state <em>n</em>
                  </li>
                  <li>
                    <strong>
                      r<em>n</em>:
                    </strong>{" "}
                    Reduce using production <em>n</em>
                  </li>
                  <li>
                    <strong>acc:</strong> Accept the input
                  </li>
                  <li>
                    <strong>Goto Table:</strong> Determines which state to go to after a reduction
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="mt-16 border-t py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">Made with ❤️ by</p>
            <div className="flex items-center justify-center gap-6 font-mono">
              <div className="group">
                <span className="text-primary group-hover:text-primary/80 transition-colors duration-200">Nikunj Jakhotiya</span>
                <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
              </div>
              <div className="group">
                <span className="text-primary group-hover:text-primary/80 transition-colors duration-200">Sujal Kothari</span>
                <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
              </div>
              <div className="group">
                <span className="text-primary group-hover:text-primary/80 transition-colors duration-200">Vedant Dharmadhikari</span>
                <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  )
}

