import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you learn more about NullAudit?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBotResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("hey")) {
      return "Hello! I'm here to help you understand NullAudit. What would you like to know?";
    }

    if (lowerInput.includes("what") || lowerInput.includes("what is") || lowerInput.includes("explain")) {
      return "NullAudit is a Multi-LLM Security & Evaluation Agent that provides automated security audits with human-in-the-loop verification for AI systems. It uses multiple language models (GPT-4, Claude-3, Gemini) to comprehensively analyze AI security.";
    }

    if (lowerInput.includes("feature") || lowerInput.includes("capability") || lowerInput.includes("can")) {
      return "NullAudit offers:\n• Multi-LLM orchestration for comprehensive analysis\n• Automated vulnerability detection\n• Human-in-the-loop verification\n• On-chain attestation via NullShot Protocol\n• Real-time monitoring\n• Compliance reporting";
    }

    if (lowerInput.includes("security") || lowerInput.includes("audit") || lowerInput.includes("vulnerability")) {
      return "NullAudit performs automated security audits by coordinating multiple LLMs to test AI systems for vulnerabilities, injection attacks, and compliance issues. Critical findings are escalated for human review.";
    }

    if (lowerInput.includes("start") || lowerInput.includes("begin") || lowerInput.includes("get started")) {
      return "To get started, click the 'Get Started' button on the page to log in, or visit the Dashboard to begin your first audit. You'll need to configure your target AI system and select audit parameters.";
    }

    if (lowerInput.includes("price") || lowerInput.includes("cost") || lowerInput.includes("pricing")) {
      return "For pricing information and plans, please contact our sales team or check the Settings page after logging in. We offer various plans based on your audit volume and requirements.";
    }

    if (lowerInput.includes("help") || lowerInput.includes("support")) {
      return "I'm here to help! You can ask me about:\n• What NullAudit does\n• Features and capabilities\n• How to get started\n• Security and auditing processes\n• Or any other questions about the platform";
    }

    return "I understand you're asking about: " + userInput + ". NullAudit is a comprehensive AI security auditing platform. Could you be more specific about what you'd like to know? I can help explain features, getting started, security processes, or answer other questions.";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-black shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
        aria-label="Open chatbot"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.sender === "user"
                        ? "bg-primary text-black"
                        : "bg-slate-800 text-white border border-slate-700"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="px-6 pb-6 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
                className="bg-primary hover:bg-primary/90 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

