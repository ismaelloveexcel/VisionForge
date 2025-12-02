import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

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
    const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    
    if (e.key === "Enter" && !e.shiftKey && !isCmdOrCtrl) {
      e.preventDefault();
      handleSend();
    }
    
    if (e.key === "Enter" && isCmdOrCtrl) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="opacity-50 pointer-events-none"
                data-testid="button-attach"
                disabled
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>File attachments coming soon!</p>
          </TooltipContent>
        </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isMac ? "⌘" : "Ctrl"}+Enter or Enter to send</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex justify-end">
        <span className="text-[10px] text-muted-foreground">
          {isMac ? "⌘" : "Ctrl"}+Enter or Enter to send · Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
