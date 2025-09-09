"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Plus, Send, Copy, Trash2, Bot, Zap, Brain, Sparkles } from "lucide-react"

interface ChatBox {
  id: string
  x: number
  y: number
  messages: { role: "user" | "assistant"; content: string }[]
  input: string
  llmType: string
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
            "Hello! I'm your AI assistant. This is  dummy text to demonstrate text selection functionality. You can select any part of this text and see the selection bar appear with options to add to notepad or create new AI chat boxes. Try selecting different portions of this response to see how the interface works. The selection bar will show various AI model options that you can use to continue the conversation with different AI assistants.",
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

  const canvasRef = useRef<HTMLDivElement>(null)
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
      setSelectedText({ text: selection.toString(), rect })
    } else {
      setSelectedText(null)
    }
  }, [])

  const addChatBoxFromSelection = useCallback(
    (aiModel: string) => {
      if (selectedText) {
        const newChatBox: ChatBox = {
          id: Date.now().toString(),
          x: selectedText.rect.left - canvasOffset.x + 50,
          y: selectedText.rect.bottom - canvasOffset.y + 10,
          messages: [
            { role: "user", content: selectedText.text },
            {
              role: "assistant",
              content: `This is a simulated response from ${aiModel}. I'm analyzing your selected text: "${selectedText.text}". Here's some additional dummy content to demonstrate the text selection feature. You can continue selecting text from this response to create even more AI conversations and build a complex network of interconnected thoughts and ideas.`,
            },
          ],
          input: "",
          llmType: aiModel,
        }
        setChatBoxes((prev) => [...prev, newChatBox])
        setSelectedText(null)
        window.getSelection()?.removeAllRanges()
      }
    },
    [selectedText, canvasOffset],
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

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="canvas-container canvas-grid h-full w-full"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : draggedChatBox ? handleChatBoxMouseMove : undefined}
        onMouseUp={isDragging ? handleMouseUp : draggedChatBox ? handleChatBoxMouseUp : undefined}
      >
        {/* Chat Boxes */}
        {chatBoxes.map((chatBox) => (
          <div
            key={chatBox.id}
            className="absolute bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 w-80 cursor-move"
            style={{ left: chatBox.x, top: chatBox.y }}
            onMouseDown={(e) => handleChatBoxMouseDown(e, chatBox.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">{chatBox.llmType}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatBoxes((prev) => prev.filter((box) => box.id !== chatBox.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {chatBox.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm select-text ${
                    message.role === "user" ? "bg-blue-500 text-white ml-4" : "bg-gray-100 text-gray-800 mr-4"
                  }`}
                  onMouseUp={handleTextSelection}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={chatBox.input}
                onChange={(e) =>
                  setChatBoxes((prev) =>
                    prev.map((box) => (box.id === chatBox.id ? { ...box, input: e.target.value } : box)),
                  )
                }
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(chatBox.id)}
                className="flex-1"
              />
              <Button onClick={() => handleSendMessage(chatBox.id)} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedText && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-2 z-50"
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

          <div className="w-px h-6 bg-gray-300" />

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
        className={`notepad-toggle ${sidebarOpen ? "sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <ChevronLeft className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Notepad Sidebar */}
      <div className={`notepad-sidebar w-80 ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="p-4 h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>

          <div className="flex gap-2 mb-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a new note..."
              className="flex-1"
              rows={3}
            />
            <Button onClick={addNote} className="self-end">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground">{note.timestamp.toLocaleTimeString()}</span>
                    <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-balance">{note.content}</p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

