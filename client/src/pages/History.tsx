import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  mode: "development" | "hr";
  timestamp: Date;
  messageCount: number;
}

const mockSessions: ChatSession[] = [
  {
    id: "1",
    title: "Task Manager App Development",
    preview: "I want to build a task management app with real-time collaboration...",
    mode: "development",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messageCount: 12,
  },
  {
    id: "2",
    title: "Discord Bot for Notifications",
    preview: "Create a Discord bot that sends notifications when new tasks are added...",
    mode: "development",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    messageCount: 8,
  },
  {
    id: "3",
    title: "Employee Gratuity Calculation",
    preview: "I need to calculate the end of service benefits for an employee...",
    mode: "hr",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messageCount: 6,
  },
  {
    id: "4",
    title: "Emiratisation Compliance Review",
    preview: "We have 75 employees and need to check if we meet the 2025 Emiratisation...",
    mode: "hr",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messageCount: 15,
  },
  {
    id: "5",
    title: "REST API Design",
    preview: "Help me design a REST API for an e-commerce platform with user authentication...",
    mode: "development",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    messageCount: 20,
  },
];

export default function History() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "development" | "hr">("all");

  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(search.toLowerCase()) ||
      session.preview.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || session.mode === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Chat History</h1>
        <p className="text-muted-foreground">
          View and continue your previous conversations with AI-DAN
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-history"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "development" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("development")}
          >
            Development
          </Button>
          <Button
            variant={filter === "hr" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("hr")}
          >
            HR
          </Button>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No conversations found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="group hover-elevate cursor-pointer"
              data-testid={`card-history-${session.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{session.title}</h3>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs"
                      >
                        {session.mode === "development" ? "Dev" : "HR"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {session.preview}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                      </span>
                      <span>{session.messageCount} messages</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Delete session:", session.id);
                    }}
                    data-testid={`button-delete-history-${session.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
