"use client"

import { useEffect, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
  type EdgeChange,
  applyEdgeChanges,
  Panel,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { motion } from "framer-motion"

interface DfaVisualizationProps {
  dfa: {
    nodes: any[]
    edges: any[]
  }
}

export function DfaVisualization({ dfa }: DfaVisualizationProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    // Clear existing nodes and edges immediately
    setNodes([])
    setEdges([])

    setTimeout(() => {
      if (dfa.nodes.length === 0) {
        // Display placeholder nodes if no DFA is generated yet
        setNodes([
          {
            id: "placeholder",
            data: { label: "Generate a CLR parser to see the DFA visualization" },
            position: { x: 250, y: 200 },
            style: {
              width: 300,
              textAlign: "center",
              color: "gray",
            },
          },
        ])
        setEdges([])
        setIsLoading(false)
        return
      }

      // Calculate positions for nodes in a circular layout
      const nodeCount = dfa.nodes.length
      const radius = Math.min(300, 100 + nodeCount * 20)
      const centerX = 400
      const centerY = 300

      // Transform the DFA data into ReactFlow nodes and edges
      const flowNodes: Node[] = dfa.nodes.map((node, index) => {
        // Position nodes in a circle
        const angle = (index / nodeCount) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        return {
          id: node.id.toString(),
          data: {
            label: `I${node.id}:\n${node.label}`,
          },
          position: { x, y },
          style: {
            width: 250,
            padding: "10px",
            borderRadius: "8px",
            fontSize: "12px",
            fontFamily: "var(--font-jetbrains-mono)",
            whiteSpace: "pre-wrap",
            textAlign: "left" as const,
            border: "1px solid #ccc",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
          },
        }
      })

      const flowEdges: Edge[] = dfa.edges.map((edge, index) => ({
        id: `e${index}`,
        source: edge.source.toString(),
        target: edge.target.toString(),
        label: edge.label,
        labelStyle: {
          fill: "#333",
          fontWeight: 700,
          fontFamily: "var(--font-jetbrains-mono)",
        },
        animated: true,
        style: { stroke: "#555" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#555",
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsLoading(false)
    }, 300) // Reduced delay for better responsiveness
  }, [dfa])

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p>Loading DFA visualization...</p>
        </CardContent>
      </Card>
    )
  }

  if (dfa.nodes.length === 0 && nodes.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          Generate a CLR parser to see the DFA visualization
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={true}
        className="bg-slate-50 dark:bg-slate-900"
      >
        <Background color="#aaa" gap={16} size={1} />
        <Controls />
        <Panel position="top-right" className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md">
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

