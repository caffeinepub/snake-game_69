import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  sender: "user" | "bot";
  text: string;
  id: number;
}

function getBotReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi"))
    return "Hello! How can I help you today?";
  if (lower.includes("name")) return "I am a simple AI assistant.";
  if (lower.includes("time"))
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  if (lower.includes("help"))
    return "I can answer questions about computers, time, weather, jokes, and more!";
  if (lower.includes("bye")) return "Goodbye! Have a great day! 👋";
  if (lower.includes("weather"))
    return "I'm not connected to weather services, but I hope it's a beautiful day wherever you are!";
  if (lower.includes("joke"))
    return "Why did the computer go to school? To improve its bytes! 😄";
  if (lower.includes("age"))
    return "I was just created, so I'm pretty new! Fresh out of the digital oven.";
  // Computer-related responses
  if (
    lower.includes("what is a computer") ||
    (lower.includes("what") && lower.includes("computer"))
  )
    return "A computer is an electronic device that stores and processes information. It can do math, show videos, browse the internet, and run apps — all very fast!";
  if (lower.includes("computer") && lower.includes("work"))
    return "A computer works by taking your input (like typing or clicking), processing it using a processor (CPU), and showing you the result on screen.";
  if (lower.includes("cpu") || lower.includes("processor"))
    return "The CPU (Central Processing Unit) is the brain of the computer. It handles all the instructions and calculations the computer needs to run.";
  if (lower.includes("ram") || lower.includes("memory"))
    return "RAM (Random Access Memory) is the computer's short-term memory. It holds the data the computer is currently using so it can work quickly.";
  if (
    lower.includes("storage") ||
    lower.includes("hard drive") ||
    lower.includes("ssd")
  )
    return "Storage (like a Hard Drive or SSD) is where your files, photos, and apps are saved permanently, even when the computer is off.";
  if (lower.includes("internet"))
    return "The internet is a huge network connecting millions of computers around the world, letting them share information instantly.";
  if (
    lower.includes("software") ||
    lower.includes("program") ||
    lower.includes("app")
  )
    return "Software is a set of instructions that tells the computer what to do. Apps, games, and operating systems are all examples of software.";
  if (lower.includes("hardware"))
    return "Hardware is the physical parts of a computer — like the screen, keyboard, mouse, and the components inside the case.";
  if (
    lower.includes("operating system") ||
    lower.includes("windows") ||
    lower.includes("macos") ||
    lower.includes("linux")
  )
    return "An operating system (like Windows, macOS, or Linux) is the main software that manages a computer and lets you run other programs.";
  if (lower.includes("virus") || lower.includes("malware"))
    return "A computer virus is harmful software that can damage your files or steal your data. Always use antivirus software and avoid suspicious links!";
  if (lower.includes("computer"))
    return "A computer is an amazing machine that can store, process, and display information. Ask me anything specific about computers!";
  return "Sorry, I don't understand that. Try asking about computers, the time, a joke, or just say hello!";
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    sender: "bot",
    text: "Hi there! I'm your AI assistant. Ask me about computers, the time, a joke, or just say hello!",
  },
];

export default function SimpleAIChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/typing change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: idRef.current++,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(trimmed);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, sender: "bot", text: reply },
      ]);
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border shadow-xs">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground leading-none">
            Simple AI Chat
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Always here to help
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </header>

      {/* Message Area */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex animate-bubble-in ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "bot" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm font-medium"
                    : "bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm border border-border"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-bubble-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            data-ocid="chat.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-muted border-border focus-visible:ring-ring text-sm"
            disabled={isTyping}
          />
          <Button
            data-ocid="chat.submit_button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="rounded-xl w-10 h-10 bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-muted-foreground bg-card border-t border-border">
        Developed by Appu
      </footer>
    </div>
  );
}
