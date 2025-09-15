export class MessageHandler {
  private static processedMessages = new Set<string>();
  
  static handleMessage(event: MessageEvent) {
    const messageId = `${event.origin}-${JSON.stringify(event.data)}-${Date.now()}`;
    
    if (this.processedMessages.has(messageId)) {
      return; // Prevent duplicate processing
    }
    
    this.processedMessages.add(messageId);
    
    // Clean old messages (keep only last 100)
    if (this.processedMessages.size > 100) {
      const messages = Array.from(this.processedMessages);
      messages.slice(0, 50).forEach(msg => this.processedMessages.delete(msg));
    }
    
    // Only process messages from trusted origins
    const trustedOrigins = [
      'https://upgraded-umbrella-ta9l-4eupyi2ki-londis-projects.vercel.app',
      window.location.origin
    ];
    
    if (!trustedOrigins.includes(event.origin)) {
      console.warn('Untrusted message origin:', event.origin);
      return;
    }
    
    // Process the message here
    console.log('Processing message from:', event.origin, event.data);
  }
}

// Auto-setup if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('message', MessageHandler.handleMessage.bind(MessageHandler));
}