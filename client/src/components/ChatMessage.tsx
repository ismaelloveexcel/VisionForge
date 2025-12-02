import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Terminal, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import aiDanAvatar from "@assets/generated_images/ai-dan_nerdy_mascot_avatar.png";

interface ToolCall {
  name: string;
  status: "running" | "completed" | "failed";
  result?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isTyping?: boolean;
  modelName?: string;
  toolCalls?: ToolCall[];
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 group/code">
      <div className="flex items-center justify-between bg-zinc-800 dark:bg-zinc-900 px-3 py-1.5 rounded-t-md border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono">{language || "code"}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover/code:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-zinc-700"
          onClick={handleCopy}
          data-testid="button-copy-code"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.375rem",
          borderBottomRightRadius: "0.375rem",
          fontSize: "0.75rem",
        }}
        wrapLongLines
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function ToolCallIndicator({ toolCall }: { toolCall: ToolCall }) {
  const statusColors = {
    running: "text-blue-500",
    completed: "text-green-500",
    failed: "text-red-500",
  };

  const statusIcons = {
    running: <Loader2 className="h-3 w-3 animate-spin" />,
    completed: <Check className="h-3 w-3" />,
    failed: <span className="h-3 w-3">✕</span>,
  };

  return (
    <div className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5 my-1">
      <Terminal className="h-3 w-3 text-muted-foreground" />
      <span className="font-mono text-muted-foreground">{toolCall.name}</span>
      <span className={statusColors[toolCall.status]}>{statusIcons[toolCall.status]}</span>
      {toolCall.result && toolCall.status === "completed" && (
        <span className="text-muted-foreground truncate max-w-[200px]">{toolCall.result}</span>
      )}
    </div>
  );
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isTyping,
  modelName,
  toolCalls,
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
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-pre:my-0 prose-pre:p-0 prose-pre:bg-transparent">
              {toolCalls && toolCalls.length > 0 && (
                <div className="mb-2 space-y-1">
                  {toolCalls.map((tc, i) => (
                    <ToolCallIndicator key={i} toolCall={tc} />
                  ))}
                </div>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    
                    if (match || codeString.includes("\n")) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ""}
                          value={codeString}
                        />
                      );
                    }
                    
                    return (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-2">
                        <table className="min-w-full border-collapse border border-border text-xs">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-border bg-muted px-2 py-1 text-left font-medium">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-border px-2 py-1">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
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
