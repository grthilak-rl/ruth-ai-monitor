import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icon from '@/components/AppIcon';

const ChatAssistance = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Sample AI responses for demonstration
  const aiResponses = {
    'hello': 'Hello! How can I assist you with industrial safety today?',
    'safety': 'Industrial safety is crucial for preventing accidents and ensuring worker wellbeing. What specific safety concerns would you like to address?',
    'ppe': 'Personal Protective Equipment (PPE) is essential in industrial environments. Our system can detect if workers are wearing required PPE such as helmets, safety vests, gloves, and safety glasses.',
    'fall': 'Fall detection is one of our key safety features. The system monitors for potential fall incidents and immediately alerts safety personnel when a fall is detected.',
    'fire': 'Our fire and smoke detection models can identify early signs of fire hazards, allowing for rapid response before incidents escalate.',
    'help': 'I can help with information about our safety monitoring system, detection capabilities, violation reporting, and safety best practices. What would you like to know?',
    'default': 'I understand your question. Our safety monitoring system is designed to help prevent accidents and ensure compliance with safety protocols. Could you provide more details about your specific concern?'
  };

  // Function to scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        text: 'Welcome to the Industrial Safety AI Assistant. How can I help you today?',
        sender: 'ai'
      }
    ]);
  }, []);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response after delay
    setTimeout(() => {
      // Generate AI response based on keywords in user input
      let responseText = aiResponses.default;
      const lowercaseInput = input.toLowerCase();
      
      Object.keys(aiResponses).forEach(keyword => {
        if (lowercaseInput.includes(keyword) && keyword !== 'default') {
          responseText = aiResponses[keyword];
        }
      });

      const aiMessage = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-foreground'}`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg p-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="textarea"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={2}
              className="resize-none"
            />
          </div>
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            className="self-end"
            iconName="Send"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatAssistance;