"use client"

import type React from "react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Send, Copy, Trash2, Bot, Zap, Brain, Sparkles, Paperclip, Moon, Sun, Mic } from "lucide-react"

interface ChatBox {
  id: string
  x: number
  y: number
  messages: { role: "user" | "assistant"; content: string }[]
  input: string
  llmType: string
  parentId?: string
}

interface Note {
  id: string
  content: string
  timestamp: Date
}

const AI_MODELS = [
  { name: "GPT-4", icon: Bot, color: "text-blue-500" },
  { name: "Claude", icon: Zap, color: "text-purple-500" },
  { name: "Gemini", icon: Brain, color: "text-green-500" },
  { name: "Llama", icon: Sparkles, color: "text-orange-500" },
]

export default function InfiniteCanvasApp() {
  const [chatBoxes, setChatBoxes] = useState<ChatBox[]>([
    {
      id: "1",
      x: 400,
      y: 300,
      messages: [
        {
          role: "assistant",
          content:
            "Hello! I'm your AI assistant. This is some dummy text to demonstrate text selection functionality. You can select any part of this text and see the selection bar appear with options to add to notepad or create new AI chat boxes. Try selecting different portions of this response to see how the interface works. The selection bar will show various AI model options that you can use to continue the conversation with different AI assistants.",
        },
      ],
      input: "",
      llmType: "GPT-4",
    },
  ])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState<{ text: string; rect: DOMRect } | null>(null)
  const [draggedChatBox, setDraggedChatBox] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectionSource, setSelectionSource] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Handle canvas panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y })
      }
    },
    [canvasOffset],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setCanvasOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      let chatElement: Element | null = null
      let node = selection.anchorNode

      // If anchorNode is a text node, get its parent element
      if (node?.nodeType === Node.TEXT_NODE) {
        node = node.parentElement
      }

      // Now we can safely use closest on the element
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        chatElement = (node as Element).closest("[data-chat-id]")
      }

      const sourceChatId = chatElement?.getAttribute("data-chat-id") || null

      setSelectedText({ text: selection.toString(), rect })
      setSelectionSource(sourceChatId)
    } else {
      setSelectedText(null)
      setSelectionSource(null)
    }
  }, [])

  const addChatBoxFromSelection = useCallback(
    (aiModel: string) => {
      if (selectedText) {
        const newChatBox: ChatBox = {
          id: Date.now().toString(),
          x: selectedText.rect.left - canvasOffset.x + 50,
          y: selectedText.rect.bottom - canvasOffset.y + 10,
          messages: [], // Start with empty messages
          input: selectedText.text, // Put the selected text directly in the input field
          llmType: aiModel,
          parentId: selectionSource || undefined,
        }
        setChatBoxes((prev) => [...prev, newChatBox])
        setSelectedText(null)
        setSelectionSource(null)
        window.getSelection()?.removeAllRanges()

        setTimeout(() => {
          const newChatInput = document.querySelector(`[data-chat-id="${newChatBox.id}"] input`)
          if (newChatInput) {
            ;(newChatInput as HTMLInputElement).focus()
            // Position cursor at the end of the text
            ;(newChatInput as HTMLInputElement).setSelectionRange(selectedText.text.length, selectedText.text.length)
          }
        }, 100)
      }
    },
    [selectedText, canvasOffset, selectionSource],
  )

  // Handle chat input
  const handleSendMessage = useCallback((chatBoxId: string) => {
    setChatBoxes((prev) =>
      prev.map((box) => {
        if (box.id === chatBoxId && box.input.trim()) {
          const newMessages = [
            ...box.messages,
            { role: "user" as const, content: box.input },
            {
              role: "assistant" as const,
              content: `This is a simulated response from ${box.llmType} to: "${box.input}". Here's some additional content that you can select to create new conversations. The beauty of this infinite canvas is that you can branch conversations in any direction, creating a web of interconnected AI discussions that build upon each other.`,
            },
          ]
          return { ...box, messages: newMessages, input: "" }
        }
        return box
      }),
    )
  }, [])

  // Handle chat box dragging
  const handleChatBoxMouseDown = useCallback((e: React.MouseEvent, chatBoxId: string) => {
    e.stopPropagation()
    setDraggedChatBox(chatBoxId)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleChatBoxMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedChatBox) {
        setChatBoxes((prev) =>
          prev.map((box) => {
            if (box.id === draggedChatBox) {
              return {
                ...box,
                x: e.clientX - canvasOffset.x - dragStart.x,
                y: e.clientY - canvasOffset.y - dragStart.y,
              }
            }
            return box
          }),
        )
      }
    },
    [draggedChatBox, canvasOffset, dragStart],
  )

  const handleChatBoxMouseUp = useCallback(() => {
    setDraggedChatBox(null)
  }, [])

  // Notes management
  const addNote = useCallback(() => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        timestamp: new Date(),
      }
      setNotes((prev) => [note, ...prev])
      setNewNote("")
    }
  }, [newNote])

  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
  }, [])

  const copyToNote = useCallback((text: string) => {
    const note: Note = {
      id: Date.now().toString(),
      content: text,
      timestamp: new Date(),
    }
    setNotes((prev) => [note, ...prev])
    setSelectedText(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  // Event listeners
  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection)
    return () => document.removeEventListener("mouseup", handleTextSelection)
  }, [handleTextSelection])

  // Render connection lines between related chat boxes
  const renderConnections = useCallback(() => {
    const connections: JSX.Element[] = []

    chatBoxes.forEach((childBox) => {
      if (childBox.parentId) {
        const parentBox = chatBoxes.find((box) => box.id === childBox.parentId)
        if (parentBox) {
          console.log('Rendering connection from', parentBox.id, 'to', childBox.id);
          // Calculate connection points
          const parentCenterX = parentBox.x + 192 // Half of chat box width (384px / 2)
          const parentCenterY = parentBox.y + 100 // Approximate center height
          const childCenterX = childBox.x + 192
          const childCenterY = childBox.y + 100

          const distance = Math.sqrt(
            Math.pow(childCenterX - parentCenterX, 2) + Math.pow(childCenterY - parentCenterY, 2),
          )
          const numChainLinks = Math.floor(distance / 30) // One chain link every 30px
          const chainLinks = []

          for (let i = 1; i < numChainLinks; i++) {
            const t = i / numChainLinks
            const x = parentCenterX + (childCenterX - parentCenterX) * t
            const y = parentCenterY + (childCenterY - parentCenterY) * t

            chainLinks.push(
              <circle key={`chain-${i}`} cx={x} cy={y} r="3" className="fill-primary/70 stroke-primary stroke-1" />,
            )
          }

          connections.push(
            <svg
              key={`connection-${parentBox.id}-${childBox.id}`}
              className="absolute pointer-events-none"
              style={{ 
                zIndex: 5,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible'
              }}
            >
              {/* Simple, bold connection line */}
              <line
                x1={parentCenterX}
                y1={parentCenterY}
                x2={childCenterX}
                y2={childCenterY}
                stroke="#d97706"
                strokeWidth="4"
                strokeDasharray="10,5"
                opacity="0.8"
              />

              {/* Connection points */}
              <circle cx={parentCenterX} cy={parentCenterY} r="8" fill="#d97706" stroke="#ffffff" strokeWidth="3" />
              <circle cx={childCenterX} cy={childCenterY} r="8" fill="#d97706" stroke="#ffffff" strokeWidth="3" />

              {/* Arrow pointing to child */}
              <defs>
                <marker
                  id={`arrow-${childBox.id}`}
                  markerWidth="15"
                  markerHeight="10"
                  refX="12"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,10 L15,5 z" fill="#d97706" />
                </marker>
              </defs>
              <line
                x1={childCenterX - 25}
                y1={childCenterY}
                x2={childCenterX - 8}
                y2={childCenterY}
                stroke="#d97706"
                strokeWidth="4"
                markerEnd={`url(#arrow-${childBox.id})`}
              />
            </svg>,
          )
        }
      }
    })

    return connections
  }, [chatBoxes])

  return (
    <div className={`h-screen w-screen overflow-hidden relative ${isDarkMode ? "dark" : ""}`}>
      {/* Infinite Background Layer */}
      <div className="fixed inset-0 bg-background" />
      
      {/* Dark Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border"
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="canvas-container h-full w-full border-r border-border relative"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : draggedChatBox ? handleChatBoxMouseMove : undefined}
        onMouseUp={isDragging ? handleMouseUp : draggedChatBox ? handleChatBoxMouseUp : undefined}
      >
        {renderConnections()}

        {/* Chat Boxes */}
        {chatBoxes.map((chatBox) => (
          <div
            key={chatBox.id}
            className="absolute bg-background/95 backdrop-blur-sm border-2 border-border rounded-2xl shadow-lg p-6 w-96 cursor-move"
            style={{ left: chatBox.x, top: chatBox.y, zIndex: 10 }}
            onMouseDown={(e) => handleChatBoxMouseDown(e, chatBox.id)}
            data-chat-id={chatBox.id}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{chatBox.llmType}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatBoxes((prev) => prev.filter((box) => box.id !== chatBox.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {chatBox.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl text-sm select-text border border-border/50 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted text-foreground mr-8"
                  }`}
                  onMouseUp={handleTextSelection}
                  data-chat-id={chatBox.id}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border-2 border-border">
                <Button variant="ghost" size="sm" className="p-2 h-auto">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="h-4 w-4" />
                  <span>Auto</span>
                </div>

                <Input
                  value={chatBox.input}
                  onChange={(e) =>
                    setChatBoxes((prev) =>
                      prev.map((box) => (box.id === chatBox.id ? { ...box, input: e.target.value } : box)),
                    )
                  }
                  placeholder="What do you want to know?"
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatBox.id)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />

                <Button
                  onClick={() => handleSendMessage(chatBox.id)}
                  size="sm"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 p-2 h-auto"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedText && (
        <div
          className="fixed bg-background/95 backdrop-blur-sm border-2 border-border rounded-lg shadow-lg p-2 flex items-center gap-2 z-50"
          style={{
            left: Math.min(selectedText.rect.left, window.innerWidth - 400),
            top: selectedText.rect.top - 60,
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToNote(selectedText.text)}
            className="flex items-center gap-1"
          >
            <Copy className="h-4 w-4" />
            Add to Notes
          </Button>

          <div className="w-px h-6 bg-border" />

          {AI_MODELS.map((model) => {
            const IconComponent = model.icon
            return (
              <Button
                key={model.name}
                variant="outline"
                size="sm"
                onClick={() => addChatBoxFromSelection(model.name)}
                className={`flex items-center gap-1 ${model.color}`}
              >
                <IconComponent className="h-4 w-4" />
                {model.name}
              </Button>
            )
          })}
        </div>
      )}

      {/* Notepad Toggle Button */}
      <button
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-background/95 backdrop-blur-sm border-l-2 border-border rounded-r-lg p-2 transition-all duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Notepad Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-sm border-l-2 border-border transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">Notes</h2>

          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your notes here..."
            className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </div>
      </div>
    </div>
  )
}
