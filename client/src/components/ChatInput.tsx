import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Describe your idea or ask AI-DAN anything...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
      <Button
        size="icon"
        variant="ghost"
        className="shrink-0"
        data-testid="button-attach"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0"
        data-testid="input-chat"
      />
      <div className="flex shrink-0 gap-1">
        <Button
          size="icon"
          variant="ghost"
          data-testid="button-suggestions"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
