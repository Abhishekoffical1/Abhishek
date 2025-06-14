import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Volume2, Send, Loader2, Brain, MessageSquare, Mic, MicOff } from "lucide-react";
import type { Reminder } from "@shared/schema";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function AIHelper() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      content: "Hello! I'm your AI assistant. I can help you understand, summarize, or give advice about your reminders. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { speak, speaking, supported } = useSpeechSynthesis();
  const { transcript, isListening, startListening, stopListening, isSupported: speechRecognitionSupported } = useSpeechRecognition();

  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message,
        reminders
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        sender: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(prev => prev + ' ' + transcript);
    }
  }, [transcript, isListening]);

  const handleSend = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue.trim());
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    switch(action) {
      case 'summarize':
        message = 'Please summarize all my reminders';
        break;
      case 'prioritize':
        message = 'Help me prioritize my tasks for today';
        break;
      case 'advice':
        message = 'Give me advice on managing my reminders better';
        break;
    }
    
    if (message) {
      setInputValue(message);
    }
  };

  return (
    <section id="ai-helper" className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <i className="fas fa-robot text-white"></i>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Helper</h2>
            <p className="text-gray-600 text-sm">Ask questions about your reminders or get advice</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Chat Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
              )}
              
              <div
                className={`rounded-xl p-4 max-w-xs lg:max-w-md ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.sender === 'ai' && (
                  <div className="mt-3 flex items-center space-x-3 text-xs text-gray-600">
                    {supported && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => speak(message.content)}
                        className="p-0 h-auto hover:text-blue-600 flex items-center"
                        disabled={speaking}
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Listen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto hover:text-blue-600"
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                        toast({ title: "Copied to clipboard!" });
                      }}
                    >
                      <i className="fas fa-copy mr-1"></i>
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              {message.sender === 'user' && (
                <div className="bg-gray-300 p-2 rounded-full flex-shrink-0">
                  <i className="fas fa-user text-gray-600 text-sm"></i>
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full flex-shrink-0">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  <span className="text-gray-700 text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <i className="fas fa-lightbulb"></i>
            <span>Try asking: "Summarize my health reminders" or "What should I focus on today?"</span>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Input
                id="aiInput"
                type="text"
                placeholder="Ask AI about your reminders..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-20"
                disabled={chatMutation.isPending}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {speechRecognitionSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    className="p-1 h-auto"
                    disabled={chatMutation.isPending}
                  >
                    {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || chatMutation.isPending}
                  className="p-1 h-auto"
                >
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('summarize')}
              className="text-xs"
            >
              <i className="fas fa-list-ul mr-1"></i>
              Summarize All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('prioritize')}
              className="text-xs"
            >
              <i className="fas fa-sort mr-1"></i>
              Help Prioritize
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('advice')}
              className="text-xs"
            >
              <i className="fas fa-lightbulb mr-1"></i>
              Get Advice
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
