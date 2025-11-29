import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import aiDanAvatar from "@assets/generated_images/ai-dan_nerdy_mascot_avatar.png";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isTyping?: boolean;
  modelName?: string;
}

function formatContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeContent = part.slice(3, -3);
      const firstNewline = codeContent.indexOf("\n");
      const language = firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : "";
      const code = firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent;
      
      return (
        <pre
          key={index}
          className="my-2 rounded-md bg-muted p-3 overflow-x-auto text-xs font-mono"
        >
          {language && (
            <div className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
              {language}
            </div>
          )}
          <code>{code}</code>
        </pre>
      );
    }
    
    const lines = part.split("\n");
    return lines.map((line, lineIndex) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={`${index}-${lineIndex}`} className="font-semibold">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <li key={`${index}-${lineIndex}`} className="ml-4 list-disc">
            {line.slice(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={`${index}-${lineIndex}`} className="ml-4 list-decimal">
            {line.replace(/^\d+\.\s/, "")}
          </li>
        );
      }
      return line ? (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ) : (
        <br key={`${index}-${lineIndex}`} />
      );
    });
  });
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isTyping,
  modelName,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      data-testid={`chat-message-${role}`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={aiDanAvatar} alt="AI-DAN" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            DAN
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex max-w-[80%] flex-col gap-1 ${isUser ? "items-end" : ""}`}
      >
        <div
          className={`relative rounded-lg px-4 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-card-border"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
            </div>
          ) : (
            <div className="text-sm">{formatContent(content)}</div>
          )}
          
          {!isUser && !isTyping && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute -right-10 top-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
              data-testid="button-copy-message"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
          {!isUser && modelName && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {modelName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
