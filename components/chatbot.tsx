"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, User, Bot, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  text: string
  isBot: boolean
  suggestions?: string[]
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isTyping, setIsTyping] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages([{
          id: '1',
          text: "👋 Hi there! I'm here to help you create an amazing CV and find your dream job in South Africa. What would you like to know?",
          isBot: true,
          suggestions: ["How do I start?", "Show me pricing", "Is it free to try?", "Contact Support"]
        }])
        setHasGreeted(true)
      }, 1500)
    }
  }, [isOpen, hasGreeted])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim()) return

    const userMessage: Message = { id: Date.now().toString(), text: messageText, isBot: false }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000))

    let response = ""
    let suggestions: string[] = []
    const text = messageText.toLowerCase()
    
    // FAQ responses
    if (text.includes('pricing') || text.includes('plan') || text.includes('cost') || text.includes('price')) {
      response = "💰 Our Plans:\n\n• Base: R199.99/month - Perfect for getting started\n• Premium: R299.99/month - Most popular choice\n• Pro: R399.99/month - Everything you need\n\nAll plans include a 7-day free trial!"
      suggestions = ["What's included?", "Start free trial", "Contact Support"]
    } else if (text.includes('start') || text.includes('begin') || text.includes('how do i')) {
      response = "🚀 Getting Started is Easy:\n\n1. Choose from 11+ professional templates\n2. Fill in your information step-by-step\n3. Download your polished CV in PDF/Word\n\nTakes about 10-15 minutes!"
      suggestions = ["View Templates", "What's included?", "Free trial"]
    } else if (text.includes('free') || text.includes('trial')) {
      response = "✅ Absolutely FREE to try!\n\n• 7-day free trial\n• No credit card required upfront\n• Cancel anytime\n• Full access to all features\n• Download unlimited CVs during trial"
      suggestions = ["Start now", "View Templates", "Pricing Plans"]
    } else if (text.includes('template') || text.includes('design')) {
      response = "📄 We have 11+ stunning templates:\n\n• Designed for South African job market\n• ATS-optimized (gets past automated screening)\n• Professional layouts\n• Easy to customize\n• Perfect for all industries"
      suggestions = ["View Templates", "Start free trial", "What's ATS?"]
    } else if (text.includes('include') || text.includes('feature') || text.includes('get')) {
      response = "🎯 What You Get:\n\n• Professional CV templates\n• Cover letter builder\n• Job matching service\n• ATS optimization\n• PDF & Word downloads\n• Email/Priority support"
      suggestions = ["Start free trial", "Pricing Plans", "Job matching"]
    } else if (text.includes('job') || text.includes('match') || text.includes('search')) {
      response = "🎯 Job Matching Feature:\n\n• We find jobs that match your skills\n• Base: 1 match per week\n• Premium: 5 matches per week\n• Pro: Unlimited matches\n\nSaves you hours of job hunting!"
      suggestions = ["How it works", "Start free trial", "Pricing Plans"]
    } else if (text.includes('time') || text.includes('long') || text.includes('quick')) {
      response = "⏱️ Super Quick Process:\n\n• Choose template: 2 minutes\n• Fill details: 10-15 minutes\n• Download CV: Instant\n\nMost people finish in under 20 minutes!"
      suggestions = ["Start now", "View Templates", "Free trial"]
    } else if (text.includes('ats') || text.includes('automated') || text.includes('screening')) {
      response = "🤖 ATS-Optimized Templates:\n\nATS = Applicant Tracking System\n• 90% of companies use ATS to screen CVs\n• Our templates are designed to pass these systems\n• Proper formatting & keywords\n• Higher chance of getting interviews!"
      suggestions = ["View Templates", "Start free trial", "Job matching"]
    } else {
      // Simple AI-like response for uncovered questions
      response = await generateSimpleResponse(text)
      suggestions = ["Contact Support", "View Templates", "Free trial"]
    }

    setIsTyping(false)
    const botMessage: Message = { id: (Date.now() + 1).toString(), text: response, isBot: true, suggestions }
    setMessages(prev => [...prev, botMessage])
  }

  const generateSimpleResponse = async (userInput: string): Promise<string> => {
    // Simple pattern matching for common intents
    if (userInput.includes('help') || userInput.includes('support')) {
      return "🤝 I'm here to help! I can answer questions about:\n\n• Creating your CV\n• Our pricing plans\n• Free trial details\n• Job matching\n\nWhat would you like to know?"
    }
    if (userInput.includes('thank') || userInput.includes('thanks')) {
      return "😊 You're very welcome! I'm here whenever you need help with your CV or job search. Good luck!"
    }
    if (userInput.includes('bye') || userInput.includes('goodbye')) {
      return "👋 Goodbye! Feel free to come back anytime. Best of luck with your job search!"
    }
    if (userInput.includes('example') || userInput.includes('sample')) {
      return "📋 Great question! While I can't show examples here, you can view all our professional templates and samples on our templates page. Each one is designed for different industries and experience levels."
    }
    
    return "🤔 That's a great question! I want to make sure I give you the best answer. Our support team can provide detailed help with that specific topic. Would you like me to connect you with them?"
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === "Contact Support") {
      setShowContactForm(true)
    } else if (suggestion === "View Templates" || suggestion === "Start now" || suggestion === "Start free trial") {
      window.open('/templates', '_blank')
    } else {
      handleSendMessage(suggestion)
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally send the form data to your backend
    alert('Thank you! Your message has been sent. We\'ll get back to you within 24 hours.')
    setShowContactForm(false)
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-2 -left-2 bg-red-500 text-white animate-pulse">
          Help
        </Badge>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 h-96 shadow-xl">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              CVKonnekt Support
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full flex flex-col">
          {showContactForm ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Contact Support</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowContactForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <Input 
                  placeholder="Your Name" 
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Email Address" 
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Subject" 
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                />
                <Textarea 
                  placeholder="How can we help you?" 
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                />
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
              <div className="text-center text-sm text-gray-500">
                Or email us directly at support@cvkonnekt.com
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                    {message.isBot && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[70%] p-3 rounded-lg text-sm whitespace-pre-line ${
                      message.isBot ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'
                    }`}>
                      {message.text}
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.suggestions.map(s => (
                            <Button 
                              key={s} 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSuggestionClick(s)}
                              className="text-xs bg-white hover:bg-gray-50"
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!message.isBot && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="sm" onClick={() => handleSendMessage()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}