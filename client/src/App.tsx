import { useState, useEffect, useCallback, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { ModelSelector } from "@/components/ModelSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallButton } from "@/components/InstallButton";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import Templates from "@/pages/Templates";
import Calculators from "@/pages/Calculators";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

interface RouterProps {
  mode: "development" | "hr";
  model: string;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  onClearChat: () => void;
}

function Router({ mode, model, chatInputRef, onClearChat }: RouterProps) {
  return (
    <Switch>
      <Route path="/">
        <Home mode={mode} model={model} chatInputRef={chatInputRef} onClearChat={onClearChat} />
      </Route>
      <Route path="/projects" component={Projects} />
      <Route path="/templates" component={Templates} />
      <Route path="/calculators" component={Calculators} />
      <Route path="/documents" component={Templates} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Inner component that uses sidebar context
function AppContent({ 
  mode, 
  setMode, 
  model, 
  setModel,
  showShortcuts,
  setShowShortcuts,
  chatInputRef,
  onClearChat,
}: {
  mode: "development" | "hr";
  setMode: (mode: "development" | "hr") => void;
  model: string;
  setModel: (model: string) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  onClearChat: () => void;
}) {
  const { toggleSidebar } = useSidebar();
  const [, navigate] = useLocation();

  // Define keyboard shortcuts
  const shortcuts = [
    {
      key: "/",
      action: () => {
        chatInputRef.current?.focus();
      },
      description: "Focus chat input",
    },
    {
      key: "n",
      ctrl: true,
      action: () => {
        onClearChat();
        navigate("/");
      },
      description: "New chat",
    },
    {
      key: "b",
      ctrl: true,
      action: toggleSidebar,
      description: "Toggle sidebar",
    },
    {
      key: "m",
      ctrl: true,
      shift: true,
      action: () => setMode(mode === "development" ? "hr" : "development"),
      description: "Toggle mode",
    },
    {
      key: "h",
      ctrl: true,
      shift: true,
      action: () => navigate("/"),
      description: "Go to Home",
    },
    {
      key: "p",
      ctrl: true,
      shift: true,
      action: () => navigate("/projects"),
      description: "Go to Projects",
    },
    {
      key: "t",
      ctrl: true,
      shift: true,
      action: () => navigate("/templates"),
      description: "Go to Templates",
    },
    {
      key: ",",
      ctrl: true,
      action: () => navigate("/settings"),
      description: "Go to Settings",
    },
    {
      key: "?",
      shift: true,
      action: () => setShowShortcuts(true),
      description: "Show shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen w-full">
      <AppSidebar mode={mode} />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ModeSwitcher mode={mode} onModeChange={setMode} />
            <ModelSelector value={model} onChange={setModel} />
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShortcuts(true)}
                  className="hidden sm:inline-flex"
                  data-testid="button-keyboard-shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyboard shortcuts (Shift+?)</p>
              </TooltipContent>
            </Tooltip>
            <InstallButton />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <Router mode={mode} model={model} chatInputRef={chatInputRef} onClearChat={onClearChat} />
        </main>
      </div>
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<"development" | "hr">("development");
  const [model, setModel] = useState("gpt-4o-mini");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [clearChatTrigger, setClearChatTrigger] = useState(0);

  const handleClearChat = useCallback(() => {
    setClearChatTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <AppContent
            mode={mode}
            setMode={setMode}
            model={model}
            setModel={setModel}
            showShortcuts={showShortcuts}
            setShowShortcuts={setShowShortcuts}
            chatInputRef={chatInputRef}
            onClearChat={handleClearChat}
          />
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
