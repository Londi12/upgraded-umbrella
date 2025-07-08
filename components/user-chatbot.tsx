"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X, Bot, User, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface ChatMessage {
  id: string
  message: string
  isUser: boolean
  timestamp: Date
  isBot?: boolean
}

export function UserChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      message: "Hi! I'm the CVKonnekt assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      isBot: true
    }
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase()
    
    if (msg.includes('pdf') || msg.includes('download')) {
      return "To download your CV as PDF: 1) Complete your CV form 2) Click 'Download PDF' button 3) If it fails, try refreshing the page. Need more help?"
    }
    if (msg.includes('template') || msg.includes('design')) {
      return "We have 11+ professional templates! Go to Templates page to browse. Each template is ATS-optimized for South African job market."
    }
    if (msg.includes('job') || msg.includes('match')) {
      return "Our job matching finds opportunities based on your CV. Create a CV first, then visit the Jobs page for personalized recommendations!"
    }
    if (msg.includes('plan') || msg.includes('price') || msg.includes('upgrade')) {
      return "We have 3 plans: Base (R199), Premium (R299), Pro (R399). All include 7-day free trial. Check our Pricing page for details!"
    }
    if (msg.includes('ats') || msg.includes('score')) {
      return "ATS scoring checks how well your CV works with applicant tracking systems. Click 'ATS Score' in the CV builder for analysis and tips!"
    }
    if (msg.includes('help') || msg.includes('support') || msg.includes('human')) {
      return "I'm here to help! For complex issues, I can connect you with our support team. What specific problem are you facing?"
    }
    if (msg.includes('hello') || msg.includes('hi')) {
      return "Hello! Welcome to CVKonnekt. I can help with CV creation, templates, job matching, and more. What would you like to know?"
    }
    
    return "I can help with CV creation, templates, job matching, ATS scoring, and pricing. What specific question do you have?"
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: newMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: getBotResponse(newMessage),
        isUser: false,
        timestamp: new Date(),
        isBot: true
      }

      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
      
      if (!isOpen) {
        setHasUnread(true)
      }
    }, 1500)
  }

  const openChat = () => {
    setIsOpen(true)
    setHasUnread(false)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={openChat}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full w-14 h-14 relative"
        >
          <MessageCircle className="h-6 w-6" />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">!</span>
            </div>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 w-80 h-96 bg-white border shadow-2xl rounded-lg z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">CVKonnekt Assistant</h3>
            <p className="text-xs text-blue-200">Online • Instant replies</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-lg ${
              message.isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                {message.isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                <span className="text-xs font-medium">
                  {message.isUser ? 'You' : 'Assistant'}
                </span>
              </div>
              <p className="text-sm">{message.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Bot className="h-3 w-3" />
                <span className="text-xs font-medium">Assistant</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setNewMessage("How do I download PDF?")}
            className="text-xs"
          >
            PDF Help
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setNewMessage("Show me templates")}
            className="text-xs"
          >
            Templates
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setNewMessage("Pricing plans?")}
            className="text-xs"
          >
            Pricing
          </Button>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask me anything..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} size="sm" disabled={isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}