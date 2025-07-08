"use client"

import { useState, useEffect, useRef } from "react"
import { Send, X, User, Bot, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: Date
  isAdmin: boolean
  isBot?: boolean
}

interface ActiveChat {
  userId: string
  userName: string
  userEmail: string
  lastMessage: string
  unreadCount: number
  isActive: boolean
}

export function AdminChatWindow() {
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([
    {
      userId: "user1",
      userName: "Sarah Johnson",
      userEmail: "sarah@example.com",
      lastMessage: "Hi, I need help with PDF download",
      unreadCount: 2,
      isActive: true
    },
    {
      userId: "user2", 
      userName: "Mike Wilson",
      userEmail: "mike@example.com",
      lastMessage: "How do I upgrade my plan?",
      unreadCount: 1,
      isActive: true
    }
  ])

  const [selectedChat, setSelectedChat] = useState<string>("user1")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "user1",
      userName: "Sarah Johnson",
      message: "Hi, I'm having trouble downloading my CV as PDF. Can you help?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isAdmin: false
    },
    {
      id: "2",
      userId: "user1", 
      userName: "CVKonnekt Bot",
      message: "I can help you with PDF downloads! Let me check your account...",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      isAdmin: false,
      isBot: true
    },
    {
      id: "3",
      userId: "user1",
      userName: "Sarah Johnson", 
      message: "The bot couldn't solve it. Can I speak to a human?",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isAdmin: false
    }
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: selectedChat,
      userName: "Admin",
      message: newMessage,
      timestamp: new Date(),
      isAdmin: true
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")

    // Update chat as read
    setActiveChats(prev => prev.map(chat => 
      chat.userId === selectedChat 
        ? { ...chat, unreadCount: 0, lastMessage: newMessage }
        : chat
    ))
  }

  const selectedChatData = activeChats.find(chat => chat.userId === selectedChat)
  const chatMessages = messages.filter(msg => msg.userId === selectedChat)

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          💬 Admin Chat ({activeChats.reduce((sum, chat) => sum + chat.unreadCount, 0)})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white border shadow-2xl rounded-lg z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Admin Chat</h3>
          <p className="text-xs text-blue-200">{activeChats.length} active conversations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="w-32 border-r bg-gray-50 overflow-y-auto">
          {activeChats.map(chat => (
            <div
              key={chat.userId}
              onClick={() => setSelectedChat(chat.userId)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                selectedChat === chat.userId ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${chat.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{chat.userName.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </div>
              {chat.unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs mt-1">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedChatData && (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b bg-gray-50">
                <p className="font-medium text-sm">{selectedChatData.userName}</p>
                <p className="text-xs text-gray-500">{selectedChatData.userEmail}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-2 rounded-lg ${
                      message.isAdmin 
                        ? 'bg-blue-600 text-white' 
                        : message.isBot
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        {message.isBot ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        <span className="text-xs font-medium">
                          {message.isAdmin ? 'You' : message.isBot ? 'Bot' : message.userName}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}