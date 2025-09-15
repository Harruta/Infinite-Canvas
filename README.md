# LLM Infinite Canvas Playground

An infinite canvas where you can access all the AI models in one unified playground. Chat with multiple AI providers simultaneously, create branching conversations, and build visual webs of interconnected ideas.

## Features

### Multi-AI Integration
- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Sonnet
- **Google**: Gemini 1.5 Flash
- **Ollama**: Local model support (coming soon)

### Infinite Canvas Experience
- Unlimited panning and zooming across an infinite workspace
- Drag and position chat boxes anywhere on the canvas
- Visual connections between related conversations
- Dark and light mode support

### Conversation Branching
- Select any text from AI responses to spawn new conversations
- Choose different AI models for each branching conversation
- Visual connection lines show relationships between chat boxes
- Build complex webs of interconnected ideas and discussions

### Smart Features
- Automatic API key detection and model selection
- Real-time AI-generated welcome messages
- Secure local storage for API keys
- Loading states and error handling
- Note-taking sidebar for capturing insights

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for desired AI providers

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/infinite-canvas.git
cd infinite-canvas
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Key Setup

On first visit, you'll be guided through setting up your API keys:

1. **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
3. **Google**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

API keys are stored securely in your browser's local storage and never sent to external servers except for direct API calls to the respective providers.

## Usage

### Basic Chat
1. Add at least one API key through the settings modal
2. Start typing in any chat box to begin a conversation
3. AI responses appear in real-time with proper loading states

### Creating Branching Conversations
1. Select any text from an AI response
2. Choose an AI model from the selection bar that appears
3. A new chat box spawns with the selected text ready to send
4. Visual connections automatically link related conversations

### Canvas Navigation
- **Pan**: Click and drag on empty canvas areas
- **Move chat boxes**: Click and drag chat box headers
- **Zoom**: Use browser zoom or trackpad gestures
- **Dark mode**: Toggle with the moon/sun icon

### Notes
- Use the sidebar to capture insights and ideas
- Notes persist across sessions
- Expandable interface that doesn't interfere with canvas

## Technical Stack

- **Framework**: Next.js 14 with App Router
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI SDKs**: 
  - OpenAI JavaScript SDK
  - Anthropic SDK
  - Google Generative AI SDK
- **State Management**: React useState/useCallback hooks
- **Storage**: Browser localStorage for API keys and preferences

## API Integration

The application uses secure backend API routes to handle AI provider communications:

- `/api/chat` - Unified endpoint for all AI providers
- Automatic model selection based on available API keys
- Proper error handling and fallback responses
- No API keys exposed to the frontend

## Development

### Project Structure
```
├── app/
│   ├── api/chat/route.ts    # AI provider API integration
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main canvas application
├── components/ui/           # Reusable UI components
├── lib/utils.ts             # Utility functions
└── public/                  # Static assets
```

### Key Components
- **InfiniteCanvasApp**: Main application component
- **Chat boxes**: Draggable conversation containers
- **Connection lines**: SVG-based visual links between related chats
- **API key modals**: Secure key management interface
- **Notes sidebar**: Persistent note-taking system

### Adding New AI Providers
1. Add provider configuration to `API_PROVIDERS` array
2. Install the provider's SDK
3. Add integration logic to `/api/chat/route.ts`
4. Update model selection logic in the frontend

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Next.js and React
- UI components from shadcn/ui
- Icons from Lucide React
- AI integration powered by official provider SDKs