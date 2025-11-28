import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Code2, FileText, Activity } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface HomeProps {
  mode: "development" | "hr";
  model: string;
}

export default function Home({ mode, model }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState("src/App.tsx");
  const [rightTab, setRightTab] = useState<string>(
    mode === "development" ? "code" : "tools"
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (newMessages: { role: string; content: string }[]) => {
      const response = await apiRequest("POST", "/api/chat", { messages: newMessages, mode, model });
      return response.json() as Promise<{ content: string; model?: string }>;
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: () => {
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
    },
  });

  useEffect(() => {
    setRightTab(mode === "development" ? "code" : "tools");
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);

    const allMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];
    chatMutation.mutate(allMessages);
  };

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  const mockFiles = [
    {
      name: "src",
      type: "folder" as const,
      children: [
        {
          name: "App.tsx",
          type: "file" as const,
          content: `import { TaskList } from "./components/TaskList";
import { AddTask } from "./components/AddTask";

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Task Manager
      </h1>
      <AddTask onAdd={handleAddTask} />
      <TaskList tasks={tasks} />
    </div>
  );
}`,
        },
        {
          name: "components",
          type: "folder" as const,
          children: [
            {
              name: "TaskList.tsx",
              type: "file" as const,
              content: `interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="space-y-2">
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}`,
            },
            {
              name: "AddTask.tsx",
              type: "file" as const,
              content: `export function AddTask({ onAdd }) {
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Add task" />
      <button type="submit">Add</button>
    </form>
  );
}`,
            },
          ],
        },
      ],
    },
    {
      name: "package.json",
      type: "file" as const,
      content: `{
  "name": "task-manager",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "express": "^4.18.2"
  }
}`,
    },
  ];

  const mockProgress = [
    {
      action: "analyzing" as const,
      title: "Analyzing Requirements",
      description: "Extracting features from description",
      status: "completed" as const,
    },
    {
      action: "coding" as const,
      title: "Generating Frontend",
      description: "Creating React components",
      progress: 65,
      status: "in-progress" as const,
    },
    {
      action: "deploying" as const,
      title: "Push to GitHub",
      description: "Creating repository",
      status: "pending" as const,
    },
  ];

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
                />
              ))
            )}
            {chatMutation.isPending && (
              <ChatMessage role="assistant" content="" isTyping />
            )}
          </div>
        </ScrollArea>
        <div className="pt-4 border-t border-border">
          <ChatInput
            onSend={handleSend}
            isLoading={chatMutation.isPending}
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
                <CodePreview
                  files={mockFiles}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              </TabsContent>
              <TabsContent value="progress" className="flex-1 mt-4 overflow-auto">
                <div className="flex flex-col gap-3">
                  {mockProgress.map((p) => (
                    <ProgressCard key={p.action} {...p} />
                  ))}
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
