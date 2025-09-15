"use client"

import type React from "react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ChevronLeft, Send, Copy, Trash2, Bot, Zap, Brain, Sparkles, Paperclip, Moon, Sun, Mic, Plus, Settings, Key } from "lucide-react"

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

interface ApiKey {
  id: string
  provider: string
  key: string
  label: string
}

interface ApiKeyInput {
  id: string
  provider: string
  key: string
  label: string
}

const AI_MODELS = [
  { name: "GPT-4", icon: Bot, color: "text-blue-500" },
  { name: "Claude", icon: Zap, color: "text-purple-500" },
  { name: "Gemini", icon: Brain, color: "text-green-500" },
  { name: "Llama", icon: Sparkles, color: "text-orange-500" },
]

const API_PROVIDERS = [
  { name: "OpenAI", models: ["GPT-4", "GPT-3.5"], placeholder: "sk-..." },
  { name: "Anthropic", models: ["Claude"], placeholder: "sk-ant-..." },
  { name: "Google", models: ["Gemini"], placeholder: "AIza..." },
  { name: "Ollama", models: ["Llama"], placeholder: "http://localhost:11434" },
]

export default function InfiniteCanvasApp() {
  const [chatBoxes, setChatBoxes] = useState<ChatBox[]>([])
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
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyInputs, setApiKeyInputs] = useState<ApiKeyInput[]>([
    { id: "1", provider: "OpenAI", key: "", label: "OpenAI API Key" }
  ])

  const canvasRef = useRef<HTMLDivElement>(null)

  // Check for existing API keys on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('llm-playground-api-keys')
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys)
        setApiKeys(parsedKeys)
        
        // If user has API keys but no chat boxes, create a welcome chat box
        if (parsedKeys.length > 0 && chatBoxes.length === 0) {
          // Determine the best model to use
          let selectedModel = "GPT-4"
          if (parsedKeys.find((key: ApiKey) => key.provider === "OpenAI")) {
            selectedModel = "GPT-4"
          } else if (parsedKeys.find((key: ApiKey) => key.provider === "Anthropic")) {
            selectedModel = "Claude"
          } else if (parsedKeys.find((key: ApiKey) => key.provider === "Google")) {
            selectedModel = "Gemini"
          } else if (parsedKeys.find((key: ApiKey) => key.provider === "Ollama")) {
            selectedModel = "Llama"
          }

          const initialChatBox: ChatBox = {
            id: "welcome",
            x: 400,
            y: 300,
            messages: [
              {
                role: "assistant",
                content: "🤔 Preparing your canvas...",
              },
            ],
            input: "",
            llmType: selectedModel,
          }
          setChatBoxes([initialChatBox])

          // Generate welcome message from LLM
          const generateWelcome = async () => {
            try {
              const welcomePrompt = [
                {
                  role: "user",
                  content: "Welcome the user back to their infinite canvas LLM playground. Mention that their API keys are ready and they can start creating branching AI conversations. Be brief but enthusiastic."
                }
              ]

              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messages: welcomePrompt,
                  model: selectedModel,
                  provider: parsedKeys.find((key: ApiKey) => {
                    const providerModels = API_PROVIDERS.find(p => p.name === key.provider)?.models || []
                    return providerModels.includes(selectedModel)
                  })?.provider,
                  apiKey: parsedKeys.find((key: ApiKey) => {
                    const providerModels = API_PROVIDERS.find(p => p.name === key.provider)?.models || []
                    return providerModels.includes(selectedModel)
                  })?.key,
                }),
              })

              if (response.ok) {
                const data = await response.json()
                setChatBoxes(prev => prev.map(box => 
                  box.id === "welcome" 
                    ? { ...box, messages: [{ role: "assistant", content: data.response }] }
                    : box
                ))
              } else {
                setChatBoxes(prev => prev.map(box => 
                  box.id === "welcome" 
                    ? { 
                        ...box, 
                        messages: [{ 
                          role: "assistant", 
                          content: "🎉 Welcome back! Your API keys are ready. Start exploring by typing a message or selecting text to create new conversations!" 
                        }] 
                      }
                    : box
                ))
              }
            } catch (error) {
              console.error('Error generating welcome message:', error)
              setChatBoxes(prev => prev.map(box => 
                box.id === "welcome" 
                  ? { 
                      ...box, 
                      messages: [{ 
                        role: "assistant", 
                        content: "🎉 Welcome back to your LLM Playground! Ready to explore?" 
                      }] 
                    }
                  : box
              ))
            }
          }

          generateWelcome()
        }
      } catch (error) {
        console.error('Error parsing saved API keys:', error)
        setShowWelcomeModal(true)
      }
    } else {
      // Show welcome modal for new users
      setShowWelcomeModal(true)
    }
  }, [])

  // API Key Management Functions
  const addApiKeyInput = useCallback(() => {
    const newInput: ApiKeyInput = {
      id: Date.now().toString(),
      provider: "OpenAI",
      key: "",
      label: "API Key"
    }
    setApiKeyInputs(prev => [...prev, newInput])
  }, [])

  const removeApiKeyInput = useCallback((id: string) => {
    setApiKeyInputs(prev => prev.filter(input => input.id !== id))
  }, [])

  const updateApiKeyInput = useCallback((id: string, field: keyof ApiKeyInput, value: string) => {
    setApiKeyInputs(prev => prev.map(input => 
      input.id === id ? { ...input, [field]: value } : input
    ))
  }, [])

  const saveApiKeys = useCallback(async () => {
    const validKeys = apiKeyInputs.filter(input => input.key.trim() !== '')
    const keysToSave: ApiKey[] = validKeys.map(input => ({
      id: input.id,
      provider: input.provider,
      key: input.key,
      label: input.label
    }))
    
    setApiKeys(keysToSave)
    localStorage.setItem('llm-playground-api-keys', JSON.stringify(keysToSave))
    setShowApiKeyModal(false)
    setShowWelcomeModal(false)
    
    // Create initial welcome chat box if none exist
    if (chatBoxes.length === 0 && keysToSave.length > 0) {
      // Determine the best model to use based on available API keys
      let selectedModel = "GPT-4"
      if (keysToSave.find(key => key.provider === "OpenAI")) {
        selectedModel = "GPT-4"
      } else if (keysToSave.find(key => key.provider === "Anthropic")) {
        selectedModel = "Claude"
      } else if (keysToSave.find(key => key.provider === "Google")) {
        selectedModel = "Gemini"
      } else if (keysToSave.find(key => key.provider === "Ollama")) {
        selectedModel = "Llama"
      }

      const initialChatBox: ChatBox = {
        id: "welcome",
        x: 400,
        y: 300,
        messages: [
          {
            role: "assistant",
            content: "🤔 Generating welcome message...",
          },
        ],
        input: "",
        llmType: selectedModel,
      }
      setChatBoxes([initialChatBox])

      // Generate a real welcome message from the LLM
      try {
        const welcomePrompt = [
          {
            role: "user",
            content: "You are now connected to an infinite canvas LLM playground where users can create branching conversations, select text to spawn new AI chats, and build a visual web of ideas. Please introduce yourself briefly and explain what makes this canvas-based approach to AI conversation unique and exciting. Keep it concise but engaging."
          }
        ]

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: welcomePrompt,
            model: selectedModel,
            provider: keysToSave.find(key => {
              const providerModels = API_PROVIDERS.find(p => p.name === key.provider)?.models || []
              return providerModels.includes(selectedModel)
            })?.provider,
            apiKey: keysToSave.find(key => {
              const providerModels = API_PROVIDERS.find(p => p.name === key.provider)?.models || []
              return providerModels.includes(selectedModel)
            })?.key,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update the welcome message with the real LLM response
          setChatBoxes(prev => prev.map(box => 
            box.id === "welcome" 
              ? { ...box, messages: [{ role: "assistant", content: data.response }] }
              : box
          ))
        } else {
          // Fallback if API call fails
          setChatBoxes(prev => prev.map(box => 
            box.id === "welcome" 
              ? { 
                  ...box, 
                  messages: [{ 
                    role: "assistant", 
                    content: "🎉 Welcome to your LLM Playground! Your API keys are configured and ready. Start exploring the infinite canvas by typing a message below or selecting text to create branching conversations!" 
                  }] 
                }
              : box
          ))
        }
      } catch (error) {
        console.error('Error generating welcome message:', error)
        // Fallback if API call fails
        setChatBoxes(prev => prev.map(box => 
          box.id === "welcome" 
            ? { 
                ...box, 
                messages: [{ 
                  role: "assistant", 
                  content: "🎉 Welcome to your LLM Playground! Your API keys are configured and ready. Start exploring the infinite canvas by typing a message below!" 
                }] 
              }
            : box
        ))
      }
    }
  }, [apiKeyInputs, chatBoxes.length])

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

  // API call function
  const callLLMAPI = useCallback(async (model: string, messages: { role: string; content: string }[]) => {
    const apiKey = apiKeys.find(key => {
      const providerModels = API_PROVIDERS.find(p => p.name === key.provider)?.models || []
      return providerModels.includes(model)
    })

    if (!apiKey) {
      throw new Error(`No API key found for model: ${model}`)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          provider: apiKey.provider,
          apiKey: apiKey.key,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'API request failed')
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('API Error:', error)
      throw new Error(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [apiKeys])

  // Handle chat input
  const handleSendMessage = useCallback(async (chatBoxId: string) => {
    const currentBox = chatBoxes.find(box => box.id === chatBoxId)
    if (!currentBox || !currentBox.input.trim()) return

    const userMessage = { role: "user" as const, content: currentBox.input }
    
    // Add user message and clear input immediately
    setChatBoxes((prev) =>
      prev.map((box) => {
        if (box.id === chatBoxId) {
          return {
            ...box,
            messages: [...box.messages, userMessage],
            input: ""
          }
        }
        return box
      }),
    )

    // Prepare messages for API call
    const allMessages = [...currentBox.messages, userMessage]
    
    try {
      // Add loading state
      setChatBoxes((prev) =>
        prev.map((box) => {
          if (box.id === chatBoxId) {
            return {
              ...box,
              messages: [...box.messages, { role: "assistant" as const, content: "🤔 Thinking..." }]
            }
          }
          return box
        }),
      )

      const response = await callLLMAPI(currentBox.llmType, allMessages)
      
      // Replace loading message with actual response
      setChatBoxes((prev) =>
        prev.map((box) => {
          if (box.id === chatBoxId) {
            const newMessages = [...box.messages]
            newMessages[newMessages.length - 1] = { role: "assistant" as const, content: response }
            return { ...box, messages: newMessages }
          }
          return box
        }),
      )
    } catch (error) {
      // Replace loading message with error
      setChatBoxes((prev) =>
        prev.map((box) => {
          if (box.id === chatBoxId) {
            const newMessages = [...box.messages]
            newMessages[newMessages.length - 1] = { 
              role: "assistant" as const, 
              content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get response'}` 
            }
            return { ...box, messages: newMessages }
          }
          return box
        }),
      )
    }
  }, [chatBoxes, callLLMAPI])

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
      
      {/* Top Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {/* Settings Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowApiKeyModal(true)}
          className="bg-background/80 backdrop-blur-sm border border-border"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        {/* Dark Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="bg-background/80 backdrop-blur-sm border border-border"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

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

      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Welcome to LLM Playground!
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>🎨 Create an infinite canvas of AI conversations</p>
              <p>🔗 Connect ideas by selecting text and choosing different AI models</p>
              <p>📝 Take notes and build your knowledge web</p>
              <p className="font-medium">To get started, please configure at least one API key:</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setShowWelcomeModal(false)
              setShowApiKeyModal(true)
            }} className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Setup API Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Setup Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              API Key Configuration
            </DialogTitle>
            <DialogDescription>
              Add your API keys to start chatting with AI models. Your keys are stored securely in your browser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {apiKeyInputs.map((input) => (
              <div key={input.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <select
                    value={input.provider}
                    onChange={(e) => updateApiKeyInput(input.id, 'provider', e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    {API_PROVIDERS.map(provider => (
                      <option key={provider.name} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  
                  {apiKeyInputs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApiKeyInput(input.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <Input
                  placeholder={API_PROVIDERS.find(p => p.name === input.provider)?.placeholder || "Enter API key..."}
                  value={input.key}
                  onChange={(e) => updateApiKeyInput(input.id, 'key', e.target.value)}
                  type="password"
                />
                
                <Input
                  placeholder="Label (optional)"
                  value={input.label}
                  onChange={(e) => updateApiKeyInput(input.id, 'label', e.target.value)}
                />
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addApiKeyInput}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another API Key
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKeys} disabled={!apiKeyInputs.some(input => input.key.trim())}>
              Save API Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
