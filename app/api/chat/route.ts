import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { messages, model, provider, apiKey } = await request.json()

    if (!messages || !model || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let response: string

    if (provider === 'OpenAI') {
      const openai = new OpenAI({
        apiKey: apiKey,
      })

      const completion = await openai.chat.completions.create({
        model: model === 'GPT-4' ? 'gpt-4' : 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      })

      response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'
    } 
    else if (provider === 'Anthropic') {
      const anthropic = new Anthropic({
        apiKey: apiKey,
      })

      const completion = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: messages.filter((msg: any) => msg.role !== 'system'), // Claude doesn't use system messages the same way
      })

      response = completion.content[0]?.type === 'text' ? completion.content[0].text : 'Sorry, I couldn\'t generate a response.'
    }
    else if (provider === 'Google') {
      const genAI = new GoogleGenerativeAI(apiKey)
      
      // Use gemini-1.5-flash which is confirmed to work
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Convert messages to Gemini format - use the last user message
      const lastMessage = messages[messages.length - 1]
      const prompt = lastMessage.content

      const result = await model.generateContent(prompt)
      const responseText = result.response

      response = responseText.text() || 'Sorry, I couldn\'t generate a response.'
    }
    else {
      return NextResponse.json(
        { error: `Provider ${provider} not supported yet` },
        { status: 400 }
      )
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('API Error:', error)
    
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: `API Error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
