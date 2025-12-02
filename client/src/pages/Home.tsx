import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ProgressCard } from "@/components/ProgressCard";
import { CodePreview } from "@/components/CodePreview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HRCalculator } from "@/components/HRCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, FileText, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolCall {
  name: string;
  status: "running" | "completed" | "failed";
  result?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelName?: string;
  toolCalls?: ToolCall[];
}

interface HomeProps {
  mode: "development" | "hr";
  model: string;
  onClearChat?: () => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const modelDisplayNames: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "claude-sonnet-4-5": "Claude Sonnet",
  "claude-haiku-4-5": "Claude Haiku",
  "claude-opus-4-1": "Claude Opus",
  "deepseek/deepseek-chat-v3.1": "DeepSeek V3.1",
  "deepseek/deepseek-r1-0528": "DeepSeek R1",
  "x-ai/grok-4.1-fast:free": "Grok 4.1",
  "x-ai/grok-3-mini": "Grok 3 Mini",
};

export default function Home({ mode, model, onClearChat, setIsLoading }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rightTab, setRightTab] = useState<string>(
    mode === "development" ? "code" : "tools"
  );
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>("");

  const { data: historyData } = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/chat/history"],
  });

  useEffect(() => {
    if (historyData?.messages && messages.length === 0) {
      setMessages(historyData.messages);
    }
  }, [historyData]);

  const saveHistory = async (msgs: Message[]) => {
    try {
      await apiRequest("POST", "/api/chat/history", { messages: msgs });
    } catch {}
  };

  useEffect(() => {
    setRightTab(mode === "development" ? "code" : "tools");
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamingContent]);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);

    const allMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];

    setIsStreaming(true);
    setIsLoading?.(true);
    setStreamingContent("");
    streamingContentRef.current = "";
    setCurrentToolCalls([]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, mode, model }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      const toolCalls: ToolCall[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]" || !data) continue;

            try {
              const event = JSON.parse(data);
              
              if (event.type === "token") {
                fullContent += event.data;
                setStreamingContent(fullContent);
                streamingContentRef.current = fullContent;
              } else if (event.type === "tool_start") {
                const newTool: ToolCall = { name: event.data.name, status: "running" };
                toolCalls.push(newTool);
                setCurrentToolCalls([...toolCalls]);
              } else if (event.type === "tool_end") {
                const idx = toolCalls.findIndex(t => t.name === event.data.name && t.status === "running");
                if (idx !== -1) {
                  toolCalls[idx] = {
                    name: event.data.name,
                    status: event.data.success ? "completed" : "failed",
                    result: event.data.result?.message || event.data.error,
                  };
                  setCurrentToolCalls([...toolCalls]);
                }
              } else if (event.type === "done") {
                fullContent = event.data.content || fullContent;
              } else if (event.type === "error") {
                throw new Error(event.data || "Stream error");
              }
            } catch (parseError) {
              console.warn("SSE parse error:", parseError);
            }
          }
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        modelName: modelDisplayNames[model] || model,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      setMessages((prev) => {
        const updated = [...prev, aiMessage];
        saveHistory(updated);
        return updated;
      });

      queryClient.invalidateQueries({ queryKey: ["/api/generated"] });
    } catch (error: any) {
      if (error.name === "AbortError") {
        const partialContent = streamingContentRef.current;
        if (partialContent) {
          const partialMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: partialContent + "\n\n*[Response stopped]*",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            modelName: modelDisplayNames[model] || model,
          };
          setMessages((prev) => {
            const updated = [...prev, partialMessage];
            saveHistory(updated);
            return updated;
          });
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Oops! I ran into a hiccup. Could you try asking me again?",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      setIsLoading?.(false);
      setStreamingContent("");
      streamingContentRef.current = "";
      setCurrentToolCalls([]);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  const handleClearChat = async () => {
    setMessages([]);
    try {
      await apiRequest("DELETE", "/api/chat/history");
    } catch {}
  };

  const mockProgress = isStreaming
    ? [
        {
          action: "analyzing" as const,
          title: "Processing Request",
          description: "AI-DAN is thinking...",
          status: "in-progress" as const,
        },
        ...(currentToolCalls.map((tc) => ({
          action: "coding" as const,
          title: tc.name,
          description: tc.result || "Executing...",
          status: tc.status === "running" ? "in-progress" as const : tc.status === "completed" ? "completed" as const : "pending" as const,
        }))),
      ]
    : [];

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex flex-1 flex-col min-w-0">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.length === 0 ? (
              <WelcomeCard mode={mode} onQuickAction={handleQuickAction} />
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  modelName={msg.modelName}
                  toolCalls={msg.toolCalls}
                />
              ))
            )}
            {isStreaming && (
              <ChatMessage 
                role="assistant" 
                content={streamingContent || ""} 
                isTyping={!streamingContent}
                toolCalls={currentToolCalls.length > 0 ? currentToolCalls : undefined}
              />
            )}
          </div>
        </ScrollArea>
        <div className="pt-4 border-t border-border flex flex-col gap-2">
          {messages.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1.5"
                onClick={handleClearChat}
                data-testid="button-clear-chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear chat
              </Button>
            </div>
          )}
          <ChatInput
            onSend={handleSend}
            isLoading={isStreaming}
            onStop={handleStop}
            placeholder={
              mode === "development"
                ? "Describe your app idea or ask AI-DAN to build something..."
                : "Ask about UAE labor laws, gratuity, contracts, or compliance..."
            }
          />
        </div>
      </div>

      <div className="hidden lg:flex w-[400px] shrink-0 flex-col">
        <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
          <TabsList className="w-full justify-start shrink-0">
            {mode === "development" ? (
              <>
                <TabsTrigger value="code" className="gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Progress
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="tools" className="gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="docs" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Reference
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {mode === "development" ? (
            <>
              <TabsContent value="code" className="flex-1 mt-4 overflow-hidden">
                <CodePreview />
              </TabsContent>
              <TabsContent value="progress" className="flex-1 mt-4 overflow-auto">
                <div className="flex flex-col gap-3">
                  {mockProgress.length > 0 ? (
                    mockProgress.map((p, i) => (
                      <ProgressCard key={`${p.action}-${i}`} {...p} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Tool activity will appear here when AI-DAN is working
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="tools" className="flex-1 mt-4 overflow-auto">
                <div className="flex flex-col gap-4">
                  <HRCalculator type="gratuity" />
                  <HRCalculator type="emiratisation" />
                </div>
              </TabsContent>
              <TabsContent value="docs" className="flex-1 mt-4 overflow-auto">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      UAE Labor Law Quick Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                    <div>
                      <h4 className="font-medium">Key Legislation</h4>
                      <p className="text-muted-foreground">
                        Federal Decree-Law No. 33/2021 (effective Feb 2022), amended by Decree-Laws No. 20/2023 and No. 9/2024
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Working Hours</h4>
                      <p className="text-muted-foreground">
                        8 hours/day, 48 hours/week. Reduced by 2 hours during Ramadan.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Annual Leave</h4>
                      <p className="text-muted-foreground">
                        30 calendar days after 1 year of service.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Gratuity</h4>
                      <p className="text-muted-foreground">
                        Eligible after 6 months. 21 days/year for first 5 years, 30 days/year thereafter. Max 1.5 years salary.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Emiratisation 2025</h4>
                      <p className="text-muted-foreground">
                        8% target for companies with 50+ employees. AED 108,000 penalty per missing hire.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
