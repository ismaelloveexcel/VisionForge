import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import aiDanAvatar from "@assets/generated_images/ai-dan_nerdy_mascot_avatar.png";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isTyping?: boolean;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isTyping,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
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
          className={`rounded-lg px-4 py-2.5 ${
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
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        )}
      </div>
    </div>
  );
}
